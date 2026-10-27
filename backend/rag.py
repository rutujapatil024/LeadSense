"""
rag.py — Retrieval-Augmented Generation (RAG) Pipeline
======================================================
This is the brain of LeadSense's conversational interface.

Flow:
  1. User asks a natural language question (e.g., "Which high-priority 
     leads from Mumbai haven't been contacted?")
  2. We embed the question using the same model used for lead ingestion
  3. We search Supabase for the most semantically similar leads (pgvector)
  4. We format the matching leads as context
  5. We send question + context to Groq LLM via LangChain
  6. We return the LLM's answer grounded in actual lead data
"""

import logging
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from config import GROQ_API_KEY, GROQ_MODEL
from database import supabase
from embeddings import generate_embedding

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
- If the data doesn't contain enough information to answer, say so honestly.
- Be specific — mention lead names, locations, dates, and statuses.
- Format your answer clearly using plain bullet points (-) for lists.
- Do NOT use markdown asterisks like **bold** or *italic* anywhere in your response.
- If asked about counts, actually count the matching leads from the data.
- When mentioning dates, also mention how many days ago that was.

LEAD DATA:
{context}
"""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}"),
])


def _format_leads_as_context(leads: list[dict]) -> str:
    """
    Format retrieved leads into a readable text block for the LLM prompt.
    Each lead becomes a clearly separated paragraph with all its details.
    """
    if not leads:
        return "No matching leads found in the database."

    formatted = []
    for i, lead in enumerate(leads, 1):
        parts = [
            f"--- Lead {i} ---",
            f"  Name: {lead['name']}",
            f"  Location: {lead['location']}",
            f"  Source: {lead['source']}",
            f"  Status: {lead['status']}",
            f"  Priority: {lead['priority']}",
            f"  Enquiry Date: {lead['enquiry_date']}",
        ]
        if lead.get("last_contacted_date"):
            parts.append(f"  Last Contacted: {lead['last_contacted_date']}")
        if lead.get("notes"):
            parts.append(f"  Notes: {lead['notes']}")
        if lead.get("similarity"):
            parts.append(f"  Relevance Score: {lead['similarity']:.2f}")
        formatted.append("\n".join(parts))

    return "\n\n".join(formatted)


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
    2. Embed search query
    3. Search matching leads via Supabase pgvector
    4. Pass context + chat history to Groq LLM
    5. Return answer, sources, and tokens used
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

    # ── Step 1: Embed the search query ──────────────────────
    try:
        query_embedding = generate_embedding(search_query)
        logger.info(f"[EMBED] Query embedded: {len(query_embedding)} dimensions")
    except Exception as e:
        logger.error(f"[ERROR] Question embedding failed: {e}")
        return {"answer": "Sorry, I couldn't process your question. Please try again.", "sources": []}

    # ── Step 2: Search for similar leads via pgvector ───────
    try:
        result = supabase.rpc("match_leads", {
            "query_embedding": query_embedding,
            "match_threshold": 0.2,   # Lower threshold = more results
            "match_count": 10,        # Return top 10 most relevant leads
        }).execute()
        matching_leads = result.data or []
        logger.info(f"[SEARCH] Found {len(matching_leads)} matching leads")
    except Exception as e:
        logger.error(f"[ERROR] Vector search failed: {e}")
        return {"answer": "Sorry, I couldn't search the lead database. Please try again.", "sources": []}

    # ── Step 3: Format leads as context for the LLM ────────
    context = _format_leads_as_context(matching_leads)

    # ── Step 4: Send question + context + chat history to Groq LLM ──
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

    # ── Step 5: Extract source lead names ──────────────────
    sources = [lead["name"] for lead in matching_leads]

    return {
        "answer": answer,
        "sources": sources,
        "tokens_used": total_tokens if total_tokens > 0 else None,
    }
