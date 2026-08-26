"""
routes/email.py — Follow-Up Email Generation Endpoint
======================================================
"""

import logging
from fastapi import APIRouter, HTTPException
from models import EmailResponse
from email_generator import generate_follow_up_email

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Email"])


@router.post("/leads/{lead_id}/follow-up-email", response_model=EmailResponse)
async def follow_up_email(lead_id: str):
    """
    Generate a personalized follow-up email draft for a specific lead.
    
    The email is crafted by the Groq LLM based on the lead's actual data
    (name, source, status, enquiry date, etc.).
    """
    try:
        result = await generate_follow_up_email(lead_id)
        return EmailResponse(
            subject=result["subject"],
            body=result["body"],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"[ERROR] Email generation endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
