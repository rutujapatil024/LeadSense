"""
ingestion.py — Core Lead Ingestion & Update Pipeline
======================================================
This is the SINGLE entry point for all lead data operations entering the system.
Handles ingesting new leads and updating existing leads with automatic
summary text & 384-dimensional embedding vector re-generation.
"""

import logging
from datetime import datetime, timezone
from database import supabase
from embeddings import generate_embedding

logger = logging.getLogger(__name__)


def _build_summary_text(lead: dict) -> str:
    """
    Flatten lead data into a natural-language sentence for embedding.
    """
    try:
        enquiry_dt = datetime.fromisoformat(str(lead["enquiry_date"]).replace("Z", "+00:00"))
        if enquiry_dt.tzinfo is None:
            enquiry_dt = enquiry_dt.replace(tzinfo=timezone.utc)
        days_since = (datetime.now(timezone.utc) - enquiry_dt).days
    except (ValueError, TypeError):
        days_since = "unknown"

    parts = [
        f"Lead: {lead['name']}",
        f"location: {lead['location']}",
        f"source: {lead['source']}",
        f"status: {lead['status']}",
        f"priority: {lead['priority']}",
        f"enquiry date: {lead['enquiry_date']}",
        f"days since enquiry: {days_since}",
    ]

    if lead.get("contact"):
        parts.append(f"contact: {lead['contact']}")
    if lead.get("last_contacted_date"):
        parts.append(f"last contacted: {lead['last_contacted_date']}")
    if lead.get("notes"):
        parts.append(f"notes: {lead['notes']}")

    return ", ".join(parts)


def ingest_lead(lead_data: dict) -> dict:
    """
    The core ingestion function — processes ONE lead through the full pipeline.
    """
    required_fields = ["name", "contact", "location", "source", "status", "priority", "enquiry_date"]
    missing = [f for f in required_fields if not lead_data.get(f)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
    
    logger.info(f"[INGEST] Ingesting lead: {lead_data['name']} from {lead_data['location']}")

    row = {
        "name": lead_data["name"],
        "contact": lead_data["contact"],
        "location": lead_data["location"],
        "source": lead_data["source"],
        "status": lead_data["status"],
        "priority": lead_data["priority"],
        "enquiry_date": lead_data["enquiry_date"],
        "last_contacted_date": lead_data.get("last_contacted_date"),
        "notes": lead_data.get("notes"),
    }

    try:
        result = supabase.table("leads").insert(row).execute()
        inserted = result.data[0]
        lead_id = inserted["id"]
        logger.info(f"[SUCCESS] Row inserted with ID: {lead_id}")
    except Exception as e:
        logger.error(f"[ERROR] Database insert failed for {lead_data['name']}: {e}")
        raise Exception(f"Database insert failed: {str(e)}")

    summary_text = _build_summary_text(lead_data)

    try:
        embedding = generate_embedding(summary_text)
    except Exception as e:
        logger.error(f"[ERROR] Embedding generation failed for {lead_data['name']}: {e}")
        raise Exception(f"Embedding generation failed: {str(e)}")

    try:
        supabase.table("leads").update({
            "embedding": embedding,
            "summary_text": summary_text,
        }).eq("id", lead_id).execute()
        logger.info(f"[SUCCESS] Embedding stored for lead: {lead_id}")
    except Exception as e:
        logger.error(f"[ERROR] Embedding update failed for {lead_id}: {e}")
        raise Exception(f"Embedding update failed: {str(e)}")

    inserted["summary_text"] = summary_text
    return inserted


def update_lead(lead_id: str, update_fields: dict) -> dict:
    """
    Updates existing lead, re-generates summary text & embedding vector.
    """
    # Fetch current lead data
    current = supabase.table("leads").select("*").eq("id", lead_id).execute()
    if not current.data:
        raise ValueError(f"Lead with ID {lead_id} not found")
    
    existing = current.data[0]
    
    # Merge existing data with update fields (filtering out None values)
    merged = {**existing}
    for k, v in update_fields.items():
        if v is not None:
            merged[k] = v

    # Rebuild summary and embedding
    summary_text = _build_summary_text(merged)
    embedding = generate_embedding(summary_text)

    # Database payload
    update_payload = {
        "name": merged["name"],
        "contact": merged["contact"],
        "location": merged["location"],
        "source": merged["source"],
        "status": merged["status"],
        "priority": merged["priority"],
        "enquiry_date": merged["enquiry_date"],
        "last_contacted_date": merged.get("last_contacted_date"),
        "notes": merged.get("notes"),
        "summary_text": summary_text,
        "embedding": embedding,
    }

    result = supabase.table("leads").update(update_payload).eq("id", lead_id).execute()
    logger.info(f"[UPDATE] Lead updated successfully: {lead_id} ({merged['name']})")
    return result.data[0]
