"""
email_generator.py — AI-Powered Follow-Up Email Generator
=========================================================
Generates personalized follow-up email drafts for individual leads
using the Groq LLM. The email is grounded in the lead's actual data
(name, source, status, enquiry date, notes).
"""

import logging
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from config import GROQ_API_KEY, GROQ_MODEL
from database import supabase

logger = logging.getLogger(__name__)

# Reuse the same LLM instance for email generation
llm = ChatGroq(
    model=GROQ_MODEL,
    api_key=GROQ_API_KEY,
    temperature=0.7,  # Slightly higher temperature for more natural email writing
)

# ── Email Generation Prompt ─────────────────────────────────
EMAIL_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a professional sales email writer for a franchise business.
Write a personalized follow-up email for the lead described below.

RULES:
- Be warm, professional, and concise (under 200 words for the body).
- Reference specific details from the lead data (how they found us, their location, etc.).
- Include a clear call-to-action (schedule a call, visit our center, etc.).
- Match the urgency to the lead's priority level.
- If they haven't been contacted before, acknowledge this and apologize for the delay.
- Do NOT use generic templates — make it feel personal.

Respond in EXACTLY this format:
SUBJECT: <email subject line>
BODY: <email body text>
"""),
    ("human", """Lead details:
- Name: {name}
- Location: {location}
- Source: {source} (how they found us)
- Status: {status}
- Priority: {priority}
- Enquiry Date: {enquiry_date}
- Days Since Enquiry: {days_since}
- Last Contacted: {last_contacted}
- Notes: {notes}
"""),
])


async def generate_follow_up_email(lead_id: str) -> dict:
    """
    Generate a personalized follow-up email for a specific lead.
    
    Args:
        lead_id: UUID of the lead to generate an email for
    
    Returns:
        Dictionary with 'subject' and 'body' keys
    
    Raises:
        ValueError: If the lead is not found
        Exception: If LLM call fails
    """
    # ── Fetch the lead from Supabase ────────────────────────
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

    # Calculate days since enquiry
    from datetime import datetime, timezone
    try:
        enquiry_dt = datetime.fromisoformat(str(lead["enquiry_date"]).replace("Z", "+00:00"))
        if enquiry_dt.tzinfo is None:
            enquiry_dt = enquiry_dt.replace(tzinfo=timezone.utc)
        days_since = (datetime.now(timezone.utc) - enquiry_dt).days
    except (ValueError, TypeError):
        days_since = "unknown"

    # ── Call the LLM to generate the email ──────────────────
    try:
        chain = EMAIL_PROMPT | llm
        response = await chain.ainvoke({
            "name": lead["name"],
            "location": lead["location"],
            "source": lead["source"],
            "status": lead["status"],
            "priority": lead["priority"],
            "enquiry_date": lead["enquiry_date"],
            "days_since": str(days_since),
            "last_contacted": lead.get("last_contacted_date") or "Never contacted",
            "notes": lead.get("notes") or "No notes",
        })
        
        # Parse the LLM response to extract subject and body
        text = response.content
        subject = ""
        body = text  # Default: entire response as body
        
        if "SUBJECT:" in text and "BODY:" in text:
            subject = text.split("SUBJECT:")[1].split("BODY:")[0].strip()
            body = text.split("BODY:")[1].strip()
        elif "SUBJECT:" in text:
            subject = text.split("SUBJECT:")[1].strip()
        
        logger.info(f"[SUCCESS] Follow-up email generated for lead: {lead['name']}")
        return {"subject": subject, "body": body}
        
    except Exception as e:
        logger.error(f"[ERROR] Email generation failed for lead {lead_id}: {e}")
        raise Exception(f"Email generation failed: {str(e)}")
