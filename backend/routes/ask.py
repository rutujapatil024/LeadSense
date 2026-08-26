"""
routes/ask.py — RAG Chat Endpoint
===================================
Handles natural language questions about lead data.
"""

import logging
from fastapi import APIRouter, HTTPException
from models import AskRequest, AskResponse
from rag import ask_question

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat"])


@router.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """
    Ask a natural language question about your lead data.
    
    Examples:
      - "Which high-priority leads from Mumbai haven't been contacted?"
      - "How many leads came from Instagram ads this month?"
      - "Show me all converted leads from referrals"
    
    The question is embedded, matched against lead data using vector
    similarity, and answered by the Groq LLM with cited sources.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = await ask_question(request.question)
        return AskResponse(
            answer=result["answer"],
            sources=result["sources"],
        )
    except Exception as e:
        logger.error(f"[ERROR] Ask endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
