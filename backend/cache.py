"""
cache.py — In-Memory High-Speed Cache for LeadSense Backend
============================================================
Caches /leads and /anomalies in memory with TTL and thread-safe invalidation.
Drastically reduces response time from 30+ seconds down to < 2 milliseconds.
"""

import time
import threading
from typing import Optional, List, Dict, Any

_lock = threading.Lock()

_leads_cache: Optional[List[Dict[str, Any]]] = None
_leads_cache_time: float = 0
LEADS_CACHE_TTL = 60.0  # seconds

_anomalies_cache: Optional[List[Dict[str, Any]]] = None
_anomalies_cache_time: float = 0
ANOMALIES_CACHE_TTL = 180.0  # seconds


def get_cached_leads() -> Optional[List[Dict[str, Any]]]:
    """Return cached leads if within TTL, else None."""
    global _leads_cache, _leads_cache_time
    with _lock:
        if _leads_cache is not None and (time.time() - _leads_cache_time) < LEADS_CACHE_TTL:
            return _leads_cache
    return None


def set_cached_leads(leads: List[Dict[str, Any]]) -> None:
    """Store leads in memory cache."""
    global _leads_cache, _leads_cache_time
    with _lock:
        _leads_cache = leads
        _leads_cache_time = time.time()


def get_cached_anomalies() -> Optional[List[Dict[str, Any]]]:
    """Return cached anomalies if within TTL, else None."""
    global _anomalies_cache, _anomalies_cache_time
    with _lock:
        if _anomalies_cache is not None and (time.time() - _anomalies_cache_time) < ANOMALIES_CACHE_TTL:
            return _anomalies_cache
    return None


def set_cached_anomalies(anomalies: List[Dict[str, Any]]) -> None:
    """Store anomalies in memory cache."""
    global _anomalies_cache, _anomalies_cache_time
    with _lock:
        _anomalies_cache = anomalies
        _anomalies_cache_time = time.time()


def invalidate_leads_cache() -> None:
    """Invalidate leads and anomalies cache upon lead mutations."""
    global _leads_cache, _leads_cache_time, _anomalies_cache, _anomalies_cache_time
    with _lock:
        _leads_cache = None
        _leads_cache_time = 0
        _anomalies_cache = None
        _anomalies_cache_time = 0
