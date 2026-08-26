"""
config.py — Configuration & Environment Variable Loader
========================================================
Loads all required secrets from the .env file.
Validates that nothing is missing before the app starts.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file in the backend directory
load_dotenv()


def _get_required_env(key: str) -> str:
    """
    Fetch a required environment variable.
    Raises a clear error if it's missing — helps debug deployment issues.
    """
    value = os.getenv(key)
    if not value:
        raise EnvironmentError(
            f"Missing required environment variable: {key}. "
            f"Please set it in your .env file. See .env.example for reference."
        )
    return value


# ── Supabase Configuration ──────────────────────────────────
# Project URL — found in Supabase Dashboard > Settings > API
SUPABASE_URL: str = _get_required_env("SUPABASE_URL")

# Service Role Key — full admin access, keep this SECRET
# Found in Supabase Dashboard > Settings > API > service_role key
SUPABASE_SERVICE_KEY: str = _get_required_env("SUPABASE_SERVICE_KEY")

# ── Groq LLM Configuration ─────────────────────────────────
# Free API key from https://console.groq.com
GROQ_API_KEY: str = _get_required_env("GROQ_API_KEY")

# Which Groq model to use for all LLM calls (follow-up emails, score
# explanations, anomaly narration, and RAG answers)
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
