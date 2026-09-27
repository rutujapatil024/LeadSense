"""
models.py — Pydantic Schemas for Request/Response Validation
============================================================
These models define the exact shape of data flowing in and out of each
API endpoint. FastAPI uses them for:
  1. Automatic request body validation
  2. Response serialization
  3. Auto-generated OpenAPI/Swagger docs
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Lead Schemas ────────────────────────────────────────────

class LeadCreate(BaseModel):
    """
    Input schema for creating a new lead.
    Used by POST /leads and internally by the CSV bulk upload.
    """
    name: str = Field(..., description="Full name of the lead")
    contact: str = Field(..., description="Phone number or email address")
    location: str = Field(..., description="City or state")
    source: str = Field(..., description="How the lead found us (e.g., Instagram ad, walk-in)")
    status: str = Field(
        default="not_contacted",
        description="Current status: not_contacted, contacted, follow_up, converted, dropped"
    )
    priority: str = Field(
        default="medium",
        description="Lead priority: high, medium, low"
    )
    enquiry_date: str = Field(..., description="Date of enquiry (YYYY-MM-DD format)")
    last_contacted_date: Optional[str] = Field(
        default=None,
        description="Date the lead was last contacted (YYYY-MM-DD), null if never"
    )
    notes: Optional[str] = Field(default=None, description="Freeform notes about the lead")


class LeadUpdate(BaseModel):
    """
    Input schema for updating an existing lead.
    All fields optional for partial updates.
    """
    name: Optional[str] = None
    contact: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    enquiry_date: Optional[str] = None
    last_contacted_date: Optional[str] = None
    notes: Optional[str] = None


class LeadResponse(BaseModel):
    """
    Output schema for a single lead.
    Excludes the embedding vector (too large for API responses).
    """
    id: str
    name: str
    contact: str
    location: str
    source: str
    status: str
    priority: str
    enquiry_date: str
    last_contacted_date: Optional[str] = None
    notes: Optional[str] = None
    summary_text: Optional[str] = None
    created_at: Optional[str] = None


class BulkUploadResponse(BaseModel):
    """Response for CSV bulk upload — summarizes what happened."""
    success_count: int = Field(..., description="Number of leads successfully ingested")
    fail_count: int = Field(..., description="Number of leads that failed ingestion")
    errors: list[dict] = Field(
        default_factory=list,
        description="Details about each failure: row number and error message"
    )


# ── Chat / RAG Schemas ─────────────────────────────────────

class AskRequest(BaseModel):
    """Input for the /ask RAG endpoint."""
    question: str = Field(..., description="Natural language question about lead data")


class AskResponse(BaseModel):
    """Response from the /ask RAG endpoint."""
    answer: str = Field(..., description="AI-generated answer grounded in lead data")
    sources: list[str] = Field(
        default_factory=list,
        description="Names of leads used as context for the answer"
    )
    tokens_used: Optional[int] = Field(
        default=None,
        description="Total tokens used for this request"
    )


# ── Email Schemas ───────────────────────────────────────────

class EmailResponse(BaseModel):
    """Response for follow-up email generation."""
    subject: str = Field(..., description="Suggested email subject line")
    body: str = Field(..., description="Full email body text")


# ── Score Schemas ───────────────────────────────────────────

class ScoreResponse(BaseModel):
    """Response for lead score explanation."""
    score: int = Field(..., description="Numeric lead score from 0 to 100")
    explanation: str = Field(..., description="Plain-English explanation of the score")


# ── Anomaly Schemas ─────────────────────────────────────────

class AnomalyItem(BaseModel):
    """A single detected anomaly."""
    type: str = Field(..., description="Type of anomaly: volume_spike, volume_drop, stale_leads")
    title: str = Field(..., description="Short title for display")
    description: str = Field(..., description="AI-narrated explanation of the anomaly")
    severity: str = Field(default="medium", description="low, medium, high")


class AnomalyResponse(BaseModel):
    """Response for anomaly detection endpoint."""
    anomalies: list[AnomalyItem] = Field(
        default_factory=list,
        description="List of detected anomalies, empty if none found"
    )
