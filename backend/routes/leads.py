"""
routes/leads.py — Lead Management Endpoints
============================================
Handles creating, listing, updating, deleting, and bulk-uploading leads.
"""

import io
import logging
import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File
from models import LeadCreate, LeadUpdate, LeadResponse, BulkUploadResponse
from ingestion import ingest_lead, update_lead
from database import supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Leads"])


@router.post("/leads", response_model=LeadResponse)
async def create_lead(lead: LeadCreate):
    """Add a single lead to the system."""
    try:
        result = ingest_lead(lead.model_dump())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[ERROR] Lead creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
async def patch_lead(lead_id: str, lead_update: LeadUpdate):
    """
    Update an existing lead's fields (e.g. status, priority, contact info, notes).
    Automatically updates embedding vector and summary text.
    """
    try:
        update_data = lead_update.model_dump(exclude_unset=True)
        result = update_lead(lead_id, update_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=44, detail=str(e))
    except Exception as e:
        logger.error(f"[ERROR] Lead update failed for {lead_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str):
    """Delete a lead from the database."""
    try:
        res = supabase.table("leads").delete().eq("id", lead_id).execute()
        logger.info(f"[DELETE] Lead deleted: {lead_id}")
        return {"status": "success", "deleted_id": lead_id}
    except Exception as e:
        logger.error(f"[ERROR] Lead deletion failed for {lead_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/leads/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload_leads(file: UploadFile = File(...)):
    """Bulk upload leads from a CSV file."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are accepted. Please upload a .csv file."
        )

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        logger.info(f"[CSV] CSV uploaded: {file.filename} ({len(df)} rows)")
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse CSV file: {str(e)}"
        )

    success_count = 0
    fail_count = 0
    errors = []

    for index, row in df.iterrows():
        try:
            lead_data = {
                "name": str(row.get("name", "")).strip(),
                "contact": str(row.get("contact", "")).strip(),
                "location": str(row.get("location", "")).strip(),
                "source": str(row.get("source", "")).strip(),
                "status": str(row.get("status", "not_contacted")).strip(),
                "priority": str(row.get("priority", "medium")).strip(),
                "enquiry_date": str(row.get("enquiry_date", "")).strip(),
            }

            last_contacted = row.get("last_contacted_date")
            if pd.notna(last_contacted):
                lead_data["last_contacted_date"] = str(last_contacted).strip()
            
            notes = row.get("notes")
            if pd.notna(notes):
                lead_data["notes"] = str(notes).strip()

            ingest_lead(lead_data)
            success_count += 1
            
        except Exception as e:
            fail_count += 1
            errors.append({
                "row": index + 2,
                "name": str(row.get("name", "unknown")),
                "error": str(e),
            })
            logger.warning(f"[WARNING] Row {index + 2} failed: {e}")

    logger.info(
        f"[UPLOAD] Bulk upload complete: {success_count} succeeded, {fail_count} failed"
    )

    return BulkUploadResponse(
        success_count=success_count,
        fail_count=fail_count,
        errors=errors,
    )


@router.get("/leads")
async def list_leads():
    """List all leads from the database."""
    try:
        result = supabase.table("leads").select(
            "id, name, contact, location, source, status, priority, "
            "enquiry_date, last_contacted_date, notes, summary_text, created_at"
        ).order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        logger.error(f"[ERROR] Failed to list leads: {e}")
        raise HTTPException(status_code=500, detail=str(e))
