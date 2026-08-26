"""
database.py — Supabase Client Initialization
=============================================
Creates a singleton Supabase client used by all modules.
Uses the service_role key for full admin access to the database.
"""

from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

# Create the Supabase client once at module load time.
# Every module that does `from database import supabase` gets the same instance.
# We use the service_role key (not the anon key) because:
#   1. We need to bypass Row Level Security for server-side operations
#   2. This key should NEVER be exposed to the frontend
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print(f"[SUCCESS] Supabase client initialized for: {SUPABASE_URL}")
