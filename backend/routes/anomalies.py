"""
routes/anomalies.py — Anomaly Detection Endpoint
=================================================
"""

import logging
from fastapi import APIRouter, HTTPException
from models import AnomalyResponse, AnomalyItem
from anomalies import detect_anomalies

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Anomalies"])


@router.get("/anomalies", response_model=AnomalyResponse)
async def get_anomalies():
    """
    Detect and return anomalies in lead conversion patterns.
    
    Checks for:
    - Stale high-priority leads (not contacted in 5+ days)
    - Unusual lead volume spikes/drops by region
    - Unusual lead volume spikes/drops by source
    
    Each anomaly is narrated in plain English by the AI.
    """
    try:
        anomaly_list = await detect_anomalies()
        return AnomalyResponse(
            anomalies=[AnomalyItem(**a) for a in anomaly_list]
        )
    except Exception as e:
        logger.error(f"[ERROR] Anomaly detection endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
