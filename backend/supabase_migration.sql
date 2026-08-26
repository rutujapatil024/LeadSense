-- ============================================================
-- LeadSense — Supabase Migration Script
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This sets up the leads table with pgvector for RAG search
-- ============================================================

-- Step 1: Enable the pgvector extension for embedding storage
-- This adds the "vector" data type to PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create the leads table
-- This is the single source of truth for all lead data
CREATE TABLE IF NOT EXISTS leads (
    -- Unique identifier, auto-generated UUID
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core lead information
    name TEXT NOT NULL,
    contact TEXT NOT NULL,           -- phone number or email
    location TEXT NOT NULL,          -- city/state
    source TEXT NOT NULL,            -- e.g. "Instagram ad", "walk-in", "referral"
    status TEXT NOT NULL DEFAULT 'not_contacted',  -- not_contacted, contacted, follow_up, converted, lost
    priority TEXT NOT NULL DEFAULT 'medium',        -- high, medium, low

    -- Dates
    enquiry_date TIMESTAMPTZ NOT NULL,
    last_contacted_date TIMESTAMPTZ,  -- nullable: null if never contacted

    -- Freeform notes
    notes TEXT,

    -- RAG / Embedding fields
    -- vector(384) matches the output dimension of all-MiniLM-L6-v2
    embedding VECTOR(384),
    -- The flattened text that was embedded, stored for debugging/traceability
    summary_text TEXT,

    -- Timestamps for record keeping
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create an HNSW index for fast cosine similarity search
-- This makes vector searches O(log n) instead of O(n)
CREATE INDEX IF NOT EXISTS leads_embedding_idx
    ON leads
    USING hnsw (embedding vector_cosine_ops);

-- Step 4: Create the RPC function for similarity search
-- The Supabase Python client calls this via supabase.rpc("match_leads", {...})
-- It finds the most similar leads to a query embedding using cosine distance
CREATE OR REPLACE FUNCTION match_leads(
    query_embedding VECTOR(384),   -- the embedded user question
    match_threshold FLOAT,          -- minimum similarity score (0 to 1)
    match_count INT                 -- max number of results to return
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    contact TEXT,
    location TEXT,
    source TEXT,
    status TEXT,
    priority TEXT,
    enquiry_date TIMESTAMPTZ,
    last_contacted_date TIMESTAMPTZ,
    notes TEXT,
    summary_text TEXT,
    similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        leads.id,
        leads.name,
        leads.contact,
        leads.location,
        leads.source,
        leads.status,
        leads.priority,
        leads.enquiry_date,
        leads.last_contacted_date,
        leads.notes,
        leads.summary_text,
        -- Cosine similarity = 1 - cosine distance
        -- The <=> operator computes cosine distance (0 = identical, 2 = opposite)
        1 - (leads.embedding <=> query_embedding) AS similarity
    FROM leads
    WHERE leads.embedding IS NOT NULL
      AND 1 - (leads.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$$;
