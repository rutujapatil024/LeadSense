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
from langchain_core.prompts import ChatPromptTemplate
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

# ── RAG Prompt Template ────────────────────────────────────────
# This tells the LLM how to behave: use ONLY the provided lead data,
# don't hallucinate, and give clear answers.
RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are LeadSense, an AI assistant for a franchise sales team.
Your job is to answer questions about lead/enquiry data.

RULES:
- Use ONLY the lead data provided below to answer the question.
- If the data doesn't contain enough information to answer, say so honestly.
- Be specific — mention lead names, locations, dates, and statuses.
- Format your answer clearly using plain bullet points (-) for lists.
- Do NOT use markdown asterisks like **bold** or *italic* anywhere in your response.
- If asked about counts, actually count the matching leads from the data.
- When mentioning dates, also mention how many days ago that was.

LEAD DATA:
{context}
"""),
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


async def ask_question(question: str) -> dict:
    """
    Full RAG pipeline: embed question → search leads → ask LLM → return answer.
    
    Args:
        question: Natural language question from the user
    
    Returns:
        Dictionary with 'answer' (str) and 'sources' (list of lead names)
    """
    logger.info(f"[QUESTION] Question received: {question}")

    # ── Step 1: Embed the user's question ───────────────────
    # We use the SAME embedding model as ingestion, so the vectors
    # are in the same semantic space and cosine similarity works correctly.
    try:
        query_embedding = generate_embedding(question)
        logger.info(f"[EMBED] Question embedded: {len(query_embedding)} dimensions")
    except Exception as e:
        logger.error(f"[ERROR] Question embedding failed: {e}")
        return {"answer": "Sorry, I couldn't process your question. Please try again.", "sources": []}

    # ── Step 2: Search for similar leads via pgvector ───────
    # Call the match_leads RPC function we created in the migration SQL.
    # This returns leads ranked by cosine similarity to the question.
    try:
        result = supabase.rpc("match_leads", {
            "query_embedding": query_embedding,
            "match_threshold": 0.2,   # Lower threshold = more results (tune as needed)
            "match_count": 10,        # Return top 10 most relevant leads
        }).execute()
        matching_leads = result.data
        logger.info(f"[SEARCH] Found {len(matching_leads)} matching leads")
    except Exception as e:
        logger.error(f"[ERROR] Vector search failed: {e}")
        return {"answer": "Sorry, I couldn't search the lead database. Please try again.", "sources": []}

    # ── Step 3: Format leads as context for the LLM ────────
    context = _format_leads_as_context(matching_leads)

    # ── Step 4: Send question + context to Groq LLM ────────
    try:
        chain = RAG_PROMPT | llm
        response = await chain.ainvoke({
            "context": context,
            "question": question,
        })
        answer = response.content
        logger.info(f"[SUCCESS] LLM response generated ({len(answer)} chars)")
    except Exception as e:
        logger.error(f"[ERROR] LLM call failed: {e}")
        return {"answer": "Sorry, the AI service is temporarily unavailable. Please try again.", "sources": []}

    # ── Step 5: Extract source lead names ──────────────────
    sources = [lead["name"] for lead in matching_leads]

    return {"answer": answer, "sources": sources}
