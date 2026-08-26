"""
anomalies.py — Anomaly Detection Engine
========================================
Detects unusual patterns in lead data using simple statistical methods:

1. Volume anomalies — lead counts by region/source that deviate 
   significantly from the historical weekly average (> 1.5 std deviations)
2. Stale leads — high-priority leads that haven't been contacted 
   in 5+ days since enquiry

Detected anomalies are narrated in plain English by the Groq LLM
so the sales team gets actionable insights, not just raw numbers.
"""

import logging
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from config import GROQ_API_KEY, GROQ_MODEL
from database import supabase

logger = logging.getLogger(__name__)

# LLM for narrating anomalies
llm = ChatGroq(
    model=GROQ_MODEL,
    api_key=GROQ_API_KEY,
    temperature=0.5,
)

ANOMALY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a data analyst for a franchise sales team.
Summarize the given anomaly in ONE single concise sentence under 20 words.
RULES:
- Be direct, specific with numbers, and actionable.
- Do NOT use markdown asterisks like **bold** or *italic* anywhere in your output.
"""),
    ("human", "{anomaly_description}"),
])


def _get_week_number(dt: datetime) -> str:
    """Get ISO year-week string like '2026-W33'."""
    return f"{dt.isocalendar()[0]}-W{dt.isocalendar()[1]:02d}"


async def detect_anomalies() -> list[dict]:
    """
    Run all anomaly detection checks and return a list of detected anomalies.
    
    Returns:
        List of dicts, each with: type, title, description, severity
    """
    anomalies = []
    now = datetime.now(timezone.utc)

    # ── Fetch all leads from Supabase ───────────────────────
    try:
        result = supabase.table("leads").select(
            "id, name, location, source, status, priority, enquiry_date, last_contacted_date"
        ).execute()
        all_leads = result.data
    except Exception as e:
        logger.error(f"[ERROR] Failed to fetch leads for anomaly detection: {e}")
        return []

    if not all_leads:
        return []

    # ── Check 1: Stale High-Priority Leads ──────────────────
    # These are leads marked as "not_contacted" with enquiry_date > 5 days ago
    stale_leads = []
    for lead in all_leads:
        if lead["status"] == "not_contacted" and lead["priority"] in ("high", "medium"):
            try:
                enquiry_dt = datetime.fromisoformat(
                    str(lead["enquiry_date"]).replace("Z", "+00:00")
                )
                if enquiry_dt.tzinfo is None:
                    enquiry_dt = enquiry_dt.replace(tzinfo=timezone.utc)
                days_since = (now - enquiry_dt).days
                if days_since >= 5:
                    stale_leads.append({
                        "name": lead["name"],
                        "location": lead["location"],
                        "priority": lead["priority"],
                        "days_since": days_since,
                    })
            except (ValueError, TypeError):
                continue

    if stale_leads:
        examples_list = [f"{l['name']} ({l['location']}, {l['days_since']} days)" for l in stale_leads[:5]]
        examples_str = ", ".join(examples_list)
        stale_desc = (
            f"Found {len(stale_leads)} {'/'.join(set(l['priority'] for l in stale_leads))}-priority leads "
            f"that have NOT been contacted despite enquiring 5+ days ago. "
            f"Examples: {examples_str}"
        )
        # Get AI narration
        try:
            chain = ANOMALY_PROMPT | llm
            resp = await chain.ainvoke({"anomaly_description": stale_desc})
            narration = resp.content
        except Exception:
            narration = stale_desc

        anomalies.append({
            "type": "stale_leads",
            "title": f"{len(stale_leads)} Stale Leads Need Attention",
            "description": narration,
            "severity": "high" if len(stale_leads) > 5 else "medium",
        })

    # ── Check 2: Volume Anomalies by Region ─────────────────
    # Group leads by week + region, compare this week vs historical average
    region_by_week = defaultdict(lambda: defaultdict(int))
    for lead in all_leads:
        try:
            dt = datetime.fromisoformat(str(lead["enquiry_date"]).replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            week = _get_week_number(dt)
            region_by_week[lead["location"]][week] += 1
        except (ValueError, TypeError):
            continue

    current_week = _get_week_number(now)
    for region, week_counts in region_by_week.items():
        weeks = sorted(week_counts.keys())
        if len(weeks) < 2:
            continue  # Need at least 2 weeks of data

        # Historical average (all weeks except current)
        historical = [week_counts[w] for w in weeks if w != current_week]
        if not historical:
            continue
        
        import statistics
        avg = statistics.mean(historical)
        if len(historical) >= 2:
            std = statistics.stdev(historical)
        else:
            std = avg * 0.3  # Rough estimate if only 1 historical week

        current_count = week_counts.get(current_week, 0)
        
        # Check for significant deviation (> 1.5 standard deviations)
        if std > 0 and abs(current_count - avg) > 1.5 * std:
            direction = "spike" if current_count > avg else "drop"
            pct_change = ((current_count - avg) / avg * 100) if avg > 0 else 0
            
            desc = (
                f"Lead volume in {region} this week ({current_count} leads) is "
                f"{'up' if direction == 'spike' else 'down'} {abs(pct_change):.0f}% "
                f"compared to the historical average ({avg:.1f} leads/week)."
            )
            try:
                chain = ANOMALY_PROMPT | llm
                resp = await chain.ainvoke({"anomaly_description": desc})
                narration = resp.content
            except Exception:
                narration = desc

            anomalies.append({
                "type": f"volume_{direction}",
                "title": f"Lead Volume {'Spike' if direction == 'spike' else 'Drop'} in {region}",
                "description": narration,
                "severity": "high" if abs(pct_change) > 50 else "medium",
            })

    # ── Check 3: Volume Anomalies by Source ─────────────────
    source_by_week = defaultdict(lambda: defaultdict(int))
    for lead in all_leads:
        try:
            dt = datetime.fromisoformat(str(lead["enquiry_date"]).replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            week = _get_week_number(dt)
            source_by_week[lead["source"]][week] += 1
        except (ValueError, TypeError):
            continue

    for source, week_counts in source_by_week.items():
        weeks = sorted(week_counts.keys())
        if len(weeks) < 2:
            continue

        historical = [week_counts[w] for w in weeks if w != current_week]
        if not historical:
            continue
        
        import statistics
        avg = statistics.mean(historical)
        if len(historical) >= 2:
            std = statistics.stdev(historical)
        else:
            std = avg * 0.3

        current_count = week_counts.get(current_week, 0)
        
        if std > 0 and abs(current_count - avg) > 1.5 * std:
            direction = "spike" if current_count > avg else "drop"
            pct_change = ((current_count - avg) / avg * 100) if avg > 0 else 0
            
            desc = (
                f"Leads from '{source}' this week ({current_count}) is "
                f"{'up' if direction == 'spike' else 'down'} {abs(pct_change):.0f}% "
                f"vs. average ({avg:.1f}/week)."
            )
            try:
                chain = ANOMALY_PROMPT | llm
                resp = await chain.ainvoke({"anomaly_description": desc})
                narration = resp.content
            except Exception:
                narration = desc

            anomalies.append({
                "type": f"volume_{direction}",
                "title": f"{'📈' if direction == 'spike' else '📉'} {source} leads {direction}",
                "description": narration,
                "severity": "medium",
            })

    logger.info(f"[ANOMALY] Anomaly detection complete: {len(anomalies)} anomalies found")
    return anomalies
