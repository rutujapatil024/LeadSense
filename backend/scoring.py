"""
scoring.py — Rule-Based Lead Scoring + AI Explanation
=====================================================
Computes a numeric lead score (0-100) using simple, transparent rules,
then asks the Groq LLM to explain the score in plain English.

Scoring weights:
  - Priority:      high=30, medium=20, low=10
  - Recency:       0-3 days=30, 4-7=20, 8-14=10, 15+=5
  - Source quality: referral=25, walk-in=20, Google=15, social ads=10, other=5
  - Contact status: converted=20, contacted=15, follow_up=10, not_contacted=0, lost=-10

Total possible: ~105 (capped at 100)
"""

import logging
from datetime import datetime, timezone
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from config import GROQ_API_KEY, GROQ_MODEL
from database import supabase

logger = logging.getLogger(__name__)

# LLM for generating score explanations
llm = ChatGroq(
    model=GROQ_MODEL,
    api_key=GROQ_API_KEY,
    temperature=0.5,
)

# ── Score Explanation Prompt ────────────────────────────────
SCORE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a lead scoring analyst for a franchise business.
Explain the given lead score in plain English. Be specific about:
1. What factors contributed positively to the score
2. What factors pulled the score down
3. One actionable recommendation for the sales team

RULES:
- Do NOT use markdown asterisks like **bold** or *italic* anywhere in your response.
- Keep your explanation under 120 words. Be direct and practical.
"""),
    ("human", """Lead: {name}
Location: {location}
Source: {source}
Status: {status}
Priority: {priority}
Enquiry Date: {enquiry_date}
Days Since Enquiry: {days_since}
Last Contacted: {last_contacted}
Notes: {notes}

Computed Score: {score}/100

Score breakdown:
- Priority score: {priority_score}/30
- Recency score: {recency_score}/30
- Source quality score: {source_score}/25
- Contact status score: {status_score}/20
"""),
])


# ── Scoring Weight Maps ────────────────────────────────────

PRIORITY_SCORES = {
    "high": 30,
    "medium": 20,
    "low": 10,
}

SOURCE_SCORES = {
    "referral": 25,
    "walk-in": 20,
    "google search": 15,
    "website form": 15,
    "instagram ad": 10,
    "facebook ad": 10,
    "trade show": 15,
}

STATUS_SCORES = {
    "converted": 20,
    "contacted": 15,
    "follow_up": 10,
    "not_contacted": 0,
    "lost": -10,
}


def _compute_score(lead: dict) -> dict:
    """
    Compute a numeric lead score (0-100) using rule-based heuristics.
    
    Returns a dictionary with the total score and breakdown per category.
    """
    # Priority score
    priority_score = PRIORITY_SCORES.get(lead.get("priority", "").lower(), 10)

    # Recency score — how recently did they enquire?
    try:
        enquiry_dt = datetime.fromisoformat(str(lead["enquiry_date"]).replace("Z", "+00:00"))
        if enquiry_dt.tzinfo is None:
            enquiry_dt = enquiry_dt.replace(tzinfo=timezone.utc)
        days_since = (datetime.now(timezone.utc) - enquiry_dt).days
    except (ValueError, TypeError):
        days_since = 30  # Assume old if we can't parse

    if days_since <= 3:
        recency_score = 30
    elif days_since <= 7:
        recency_score = 20
    elif days_since <= 14:
        recency_score = 10
    else:
        recency_score = 5

    # Source quality score
    source_score = SOURCE_SCORES.get(lead.get("source", "").lower(), 5)

    # Contact status score
    status_score = STATUS_SCORES.get(lead.get("status", "").lower(), 0)

    # Total score, capped between 0 and 100
    total = max(0, min(100, priority_score + recency_score + source_score + status_score))

    return {
        "score": total,
        "priority_score": priority_score,
        "recency_score": recency_score,
        "source_score": source_score,
        "status_score": status_score,
        "days_since": days_since,
    }


async def get_score_explanation(lead_id: str) -> dict:
    """
    Compute a lead's score and get an AI-generated explanation.
    
    Args:
        lead_id: UUID of the lead
    
    Returns:
        Dictionary with 'score' (int) and 'explanation' (str)
    """
    # ── Fetch the lead ──────────────────────────────────────
    try:
        result = supabase.table("leads").select("*").eq("id", lead_id).execute()
        if not result.data:
            raise ValueError(f"Lead not found with ID: {lead_id}")
        lead = result.data[0]
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Failed to fetch lead {lead_id}: {e}")
        raise Exception(f"Database query failed: {str(e)}")

    # ── Compute the numeric score ───────────────────────────
    score_data = _compute_score(lead)
    logger.info(f"[SCORE] Score for {lead['name']}: {score_data['score']}/100")

    # ── Get AI explanation ──────────────────────────────────
    try:
        chain = SCORE_PROMPT | llm
        response = await chain.ainvoke({
            "name": lead["name"],
            "location": lead["location"],
            "source": lead["source"],
            "status": lead["status"],
            "priority": lead["priority"],
            "enquiry_date": lead["enquiry_date"],
            "days_since": str(score_data["days_since"]),
            "last_contacted": lead.get("last_contacted_date") or "Never",
            "notes": lead.get("notes") or "No notes",
            "score": str(score_data["score"]),
            "priority_score": str(score_data["priority_score"]),
            "recency_score": str(score_data["recency_score"]),
            "source_score": str(score_data["source_score"]),
            "status_score": str(score_data["status_score"]),
        })
        explanation = response.content
        logger.info(f"[SUCCESS] Score explanation generated for: {lead['name']}")
    except Exception as e:
        logger.error(f"[ERROR] Score explanation failed for {lead_id}: {e}")
        # Fall back to a basic explanation if LLM fails
        explanation = (
            f"Score: {score_data['score']}/100. "
            f"Priority ({lead['priority']}): {score_data['priority_score']} pts, "
            f"Recency ({score_data['days_since']} days): {score_data['recency_score']} pts, "
            f"Source ({lead['source']}): {score_data['source_score']} pts, "
            f"Status ({lead['status']}): {score_data['status_score']} pts."
        )

    return {"score": score_data["score"], "explanation": explanation}
