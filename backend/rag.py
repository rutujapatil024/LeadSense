"""
rag.py — Retrieval-Augmented Generation (RAG) Pipeline
======================================================
This is the brain of LeadSense's conversational interface.

Flow:
  1. User asks a natural language question (e.g., "Which high-priority 
     leads from Mumbai haven't been contacted?")
  2. We fetch ALL leads from Supabase to have complete data
  3. We compute aggregate stats for accuracy
  4. We also do vector similarity search for semantic relevance
  5. We combine filtered full-dataset results + vector results as context
  6. We send question + context to Groq LLM via LangChain
  7. We return the LLM's answer grounded in actual lead data
"""

import logging
from collections import Counter
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from config import GROQ_API_KEY, GROQ_MODEL
from database import supabase
from embeddings import generate_embedding
from cache import get_cached_leads, set_cached_leads

logger = logging.getLogger(__name__)

# ── Initialize the Groq LLM (loaded once, reused per request) ──
llm = ChatGroq(
    model=GROQ_MODEL,
    api_key=GROQ_API_KEY,
    temperature=0.3,  # Low temperature for factual, grounded answers
)

# ── Query Reformulation Prompt for Conversational RAG ───────────
# If the user asks a follow-up question like "tell me about his status",
# this reformulates it to "What is Akshay Kumar's status?" so vector search
# can locate the right lead in Supabase.
CONDENSE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a conversational query assistant.
Given a recent chat history and the latest user question that might reference past entities (e.g., 'he', 'she', 'his', 'her', 'their', 'them', 'that lead', 'his status', 'her email'), reformulate it into a self-contained, standalone question suitable for vector search.
RULES:
- Do NOT answer the question.
- Only replace ambiguous references/pronouns with specific lead names or topics mentioned in the chat history.
- If the question is already self-contained, return it exactly as is.
- Return ONLY the standalone question, with no explanation or conversational filler."""),
    ("human", "Recent Chat History:\n{history}\n\nLatest Question: {question}")
])

# ── RAG Prompt Template with Chat History ───────────────────────
RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are LeadSense, an AI assistant for a franchise sales team.
Your job is to answer questions about lead/enquiry data.

RULES:
- Use the lead data provided below and the conversation history to answer the question.
- The AGGREGATE STATS section contains exact counts from the full database — always use these numbers when asked about totals or counts.
- The MATCHING LEADS section contains the actual lead records that match the query.
- If the data doesn't contain enough information to answer, say so honestly.
- Be specific — mention lead names, locations, dates, and statuses.
- Format your answer clearly using plain bullet points (-) for lists.
- Do NOT use markdown asterisks like **bold** or *italic* anywhere in your response.
- If asked about counts, use the exact numbers from AGGREGATE STATS.
- When listing leads, list ALL leads from the MATCHING LEADS section.
- When mentioning dates, also mention how many days ago that was.

LEAD DATA:
{context}
"""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}"),
])


def _fetch_all_leads() -> list[dict]:
    """
    Fetch all leads from Supabase, using the in-memory cache when available.
    Returns the full dataset for accurate counting and filtering.
    """
    cached = get_cached_leads()
    if cached is not None:
        logger.debug(f"[RAG] Using cached leads: {len(cached)} records")
        return cached

    try:
        page_size = 1000
        all_leads = []
        start = 0

        while True:
            result = supabase.table("leads").select(
                "id, name, contact, location, source, status, priority, "
                "enquiry_date, last_contacted_date, notes, created_at"
            ).order("created_at", desc=True).range(
                start, start + page_size - 1
            ).execute()

            page = result.data or []
            all_leads.extend(page)
            if len(page) < page_size:
                break
            start += page_size

        set_cached_leads(all_leads)
        logger.info(f"[RAG] Fetched {len(all_leads)} leads from Supabase")
        return all_leads
    except Exception as e:
        logger.error(f"[RAG] Failed to fetch all leads: {e}")
        return []


def _compute_aggregate_stats(leads: list[dict]) -> str:
    """
    Compute aggregate statistics from the full lead dataset.
    These stats are injected into the LLM context so it can answer
    count/summary questions accurately.
    """
    total = len(leads)
    if total == 0:
        return "No leads in the database."

    status_counts = Counter(l.get("status", "unknown") for l in leads)
    priority_counts = Counter(l.get("priority", "unknown") for l in leads)
    source_counts = Counter(l.get("source", "unknown") for l in leads)
    location_counts = Counter(l.get("location", "unknown") for l in leads)

    lines = [
        f"Total leads in database: {total}",
        "",
        "Leads by Status:",
    ]
    for status, count in sorted(status_counts.items(), key=lambda x: -x[1]):
        lines.append(f"  - {status}: {count}")

    lines.append("")
    lines.append("Leads by Priority:")
    for priority, count in sorted(priority_counts.items(), key=lambda x: -x[1]):
        lines.append(f"  - {priority}: {count}")

    lines.append("")
    lines.append("Leads by Source:")
    for source, count in sorted(source_counts.items(), key=lambda x: -x[1]):
        lines.append(f"  - {source}: {count}")

    lines.append("")
    lines.append("Leads by Location (top 10):")
    for location, count in sorted(location_counts.items(), key=lambda x: -x[1])[:10]:
        lines.append(f"  - {location}: {count}")

    return "\n".join(lines)


def _filter_leads_by_query(all_leads: list[dict], search_query: str) -> list[dict]:
    """
    Filter leads from the full dataset based on keywords in the search query.
    This complements vector search by providing exact-match filtering for
    status, priority, location, source, and name queries.
    """
    query_lower = search_query.lower()

    # Detect filter criteria from the query
    status_filters = []
    for status in ["not_contacted", "not contacted", "contacted", "follow_up", "follow up", "converted", "lost", "dropped"]:
        if status in query_lower:
            # Normalize to DB format (underscored)
            status_filters.append(status.replace(" ", "_"))

    priority_filters = []
    for priority in ["high", "medium", "low"]:
        if priority in query_lower and "priority" in query_lower:
            priority_filters.append(priority)

    # If we detected specific filters, apply them
    filtered = all_leads
    if status_filters:
        filtered = [l for l in filtered if l.get("status") in status_filters]
    if priority_filters:
        filtered = [l for l in filtered if l.get("priority") in priority_filters]

    # Also check for location/source keywords (only if explicitly mentioned)
    # We look for location names that appear in the data
    locations_in_query = []
    sources_in_query = []
    for lead in all_leads:
        loc = (lead.get("location") or "").lower()
        src = (lead.get("source") or "").lower()
        if loc and loc in query_lower and loc not in locations_in_query:
            locations_in_query.append(loc)
        if src and src in query_lower and src not in sources_in_query:
            sources_in_query.append(src)

    if locations_in_query:
        filtered = [l for l in filtered if (l.get("location") or "").lower() in locations_in_query]
    if sources_in_query:
        filtered = [l for l in filtered if (l.get("source") or "").lower() in sources_in_query]

    return filtered


def _format_leads_as_context(leads: list[dict], max_leads: int = 200) -> str:
    """
    Format retrieved leads into a readable text block for the LLM prompt.
    Each lead becomes a clearly separated paragraph with all its details.
    Limits output to max_leads to stay within token limits.
    """
    if not leads:
        return "No matching leads found in the database."

    display_leads = leads[:max_leads]
    truncated = len(leads) > max_leads

    formatted = []
    for i, lead in enumerate(display_leads, 1):
        parts = [
            f"--- Lead {i} ---",
            f"  Name: {lead['name']}",
            f"  Location: {lead.get('location', 'N/A')}",
            f"  Source: {lead.get('source', 'N/A')}",
            f"  Status: {lead.get('status', 'N/A')}",
            f"  Priority: {lead.get('priority', 'N/A')}",
            f"  Enquiry Date: {lead.get('enquiry_date', 'N/A')}",
        ]
        if lead.get("last_contacted_date"):
            parts.append(f"  Last Contacted: {lead['last_contacted_date']}")
        if lead.get("notes"):
            parts.append(f"  Notes: {lead['notes']}")
        if lead.get("similarity"):
            parts.append(f"  Relevance Score: {lead['similarity']:.2f}")
        formatted.append("\n".join(parts))

    result = "\n\n".join(formatted)
    if truncated:
        result += f"\n\n... and {len(leads) - max_leads} more leads (showing first {max_leads} of {len(leads)} total matches)"

    return result


def _format_history_text(history: list[dict]) -> str:
    """Format recent history into compact text for query reformulation."""
    lines = []
    for msg in history[-6:]:
        role = "User" if msg.get("role") == "user" else "LeadSense AI"
        content = (msg.get("content") or "").strip()
        if len(content) > 300:
            content = content[:300] + "..."
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


def _to_langchain_messages(history: list[dict]) -> list:
    """Convert raw message dicts into LangChain message objects."""
    messages = []
    for msg in history[-8:]:
        role = msg.get("role")
        content = msg.get("content") or ""
        if not content:
            continue
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
    return messages


async def ask_question(question: str, history: list[dict] = None) -> dict:
    """
    Full Conversational RAG pipeline:
    1. Reformulate question if referring to past messages
    2. Fetch ALL leads from the database for accurate counts
    3. Compute aggregate stats from the full dataset
    4. Filter leads by detected criteria (status, priority, location, etc.)
    5. Also do vector similarity search for semantic relevance
    6. Combine both into rich context for the LLM
    7. Return answer, sources, and tokens used
    """
    if history is None:
        history = []

    logger.info(f"[QUESTION] Question received: {question} (history length: {len(history)})")
    total_tokens = 0
    search_query = question

    # ── Step 0: Reformulate question using history if pronouns/references are used ──
    has_prior_user_msgs = any(m.get("role") == "user" for m in history)
    if has_prior_user_msgs:
        try:
            history_text = _format_history_text(history)
            condense_chain = CONDENSE_PROMPT | llm
            condense_resp = await condense_chain.ainvoke({
                "history": history_text,
                "question": question,
            })
            reformulated = condense_resp.content.strip()
            if reformulated:
                search_query = reformulated
                logger.info(f"[REFORMULATE] Standalone query for vector search: '{search_query}'")

            c_usage = getattr(condense_resp, "usage_metadata", None)
            if c_usage and c_usage.get("total_tokens"):
                total_tokens += c_usage["total_tokens"]
        except Exception as e:
            logger.warning(f"[WARN] Query reformulation error (using original): {e}")
            search_query = question

    # ── Step 1: Fetch ALL leads from database ──────────────
    all_leads = _fetch_all_leads()
    logger.info(f"[RAG] Total leads in database: {len(all_leads)}")

    # ── Step 2: Compute aggregate stats ────────────────────
    aggregate_stats = _compute_aggregate_stats(all_leads)

    # ── Step 3: Filter leads from full dataset by query criteria ──
    filtered_leads = _filter_leads_by_query(all_leads, search_query)
    logger.info(f"[RAG] Filtered leads matching query criteria: {len(filtered_leads)}")

    # ── Step 4: Also do vector similarity search for semantic matches ──
    vector_leads = []
    try:
        query_embedding = generate_embedding(search_query)
        logger.info(f"[EMBED] Query embedded: {len(query_embedding)} dimensions")

        result = supabase.rpc("match_leads", {
            "query_embedding": query_embedding,
            "match_threshold": 0.2,
            "match_count": 10,
        }).execute()
        vector_leads = result.data or []
        logger.info(f"[SEARCH] Vector search found {len(vector_leads)} similar leads")
    except Exception as e:
        logger.warning(f"[WARN] Vector search failed (using filtered results only): {e}")

    # ── Step 5: Combine results — prefer filtered leads when available ──
    # If we have filtered leads (from status/priority/location filters),
    # use those as the primary context. Otherwise, fall back to vector search.
    if filtered_leads and len(filtered_leads) != len(all_leads):
        # We detected and applied specific filters — use filtered results
        context_leads = filtered_leads
        source_label = "filtered"
    elif vector_leads:
        # No specific filters detected — use vector similarity results
        context_leads = vector_leads
        source_label = "vector"
    else:
        # Fallback to all leads (limited)
        context_leads = all_leads[:50]
        source_label = "all"

    logger.info(f"[RAG] Using {len(context_leads)} leads as context (source: {source_label})")

    # ── Step 6: Build combined context ─────────────────────
    leads_context = _format_leads_as_context(context_leads)
    context = f"=== AGGREGATE STATS (from full database) ===\n{aggregate_stats}\n\n=== MATCHING LEADS ({len(context_leads)} results) ===\n{leads_context}"

    # ── Step 7: Send question + context + chat history to Groq LLM ──
    try:
        langchain_history = _to_langchain_messages(history)
        chain = RAG_PROMPT | llm
        response = await chain.ainvoke({
            "context": context,
            "chat_history": langchain_history,
            "question": question,
        })
        answer = response.content

        usage = getattr(response, "usage_metadata", None)
        if usage and usage.get("total_tokens"):
            total_tokens += usage["total_tokens"]

        logger.info(f"[SUCCESS] LLM response generated ({len(answer)} chars, {total_tokens} total tokens)")
    except Exception as e:
        logger.error(f"[ERROR] LLM call failed: {e}")
        return {"answer": "Sorry, the AI service is temporarily unavailable. Please try again.", "sources": []}

    # ── Step 8: Extract source lead names ──────────────────
    sources = [lead["name"] for lead in context_leads[:20]]

    return {
        "answer": answer,
        "sources": sources,
        "tokens_used": total_tokens if total_tokens > 0 else None,
    }
