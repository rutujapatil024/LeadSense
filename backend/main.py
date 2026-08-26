"""
main.py — FastAPI Application Entry Point
==========================================
This is where the FastAPI app is created, middleware is configured,
and all route modules are registered.

Run with: uvicorn main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Configure logging for the entire application
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events for the FastAPI app.
    The embedding model and database client are loaded when their
    modules are first imported (by the routes below).
    """
    logger.info("[STARTUP] LeadSense API starting up...")
    logger.info("[STARTUP] Loading route modules (this triggers model + DB init)...")
    yield
    logger.info("[SHUTDOWN] LeadSense API shutting down.")


# ── Create the FastAPI app ──────────────────────────────────
app = FastAPI(
    title="LeadSense API",
    description=(
        "GenAI-powered Lead Intelligence Copilot. "
        "Query leads with natural language, get AI-generated follow-up emails, "
        "explainable lead scores, and anomaly alerts."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ─────────────────────────────────────────
# Allow all origins during development. The React frontend runs on
# a different port (5173) and needs to call our API on port 8000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Allow all origins (restrict in production)
    allow_credentials=True,
    allow_methods=["*"],       # Allow all HTTP methods
    allow_headers=["*"],       # Allow all headers
)

# ── Register Route Modules ─────────────────────────────────
# Each route file defines its own APIRouter; we include them here.
from routes.leads import router as leads_router
from routes.ask import router as ask_router
from routes.email import router as email_router
from routes.scoring import router as scoring_router
from routes.anomalies import router as anomalies_router

app.include_router(leads_router)
app.include_router(ask_router)
app.include_router(email_router)
app.include_router(scoring_router)
app.include_router(anomalies_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "app": "LeadSense API",
        "version": "1.0.0",
        "docs": "/docs",
    }
