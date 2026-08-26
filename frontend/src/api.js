/**
 * api.js — Centralized API Client
 * ================================
 * All backend API calls go through this file.
 * Points to http://localhost:8000 (the FastAPI backend).
 */

const API_BASE = 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ── Lead Endpoints ───────────────────────────────────────

/** Add a single lead */
export async function addLead(leadData) {
  return apiFetch('/leads', {
    method: 'POST',
    body: JSON.stringify(leadData),
  });
}

/** Update an existing lead */
export async function updateLead(leadId, leadData) {
  return apiFetch(`/leads/${leadId}`, {
    method: 'PATCH',
    body: JSON.stringify(leadData),
  });
}

/** Delete a lead by ID */
export async function deleteLead(leadId) {
  return apiFetch(`/leads/${leadId}`, {
    method: 'DELETE',
  });
}

/** Bulk upload leads from a CSV file */
export async function bulkUpload(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/leads/bulk-upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed: HTTP ${response.status}`);
  }

  return await response.json();
}

/** Get all leads */
export async function getLeads() {
  return apiFetch('/leads');
}

// ── Chat / RAG Endpoint ──────────────────────────────────

/** Ask a natural language question about lead data */
export async function askQuestion(question) {
  return apiFetch('/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

// ── Email Endpoint ───────────────────────────────────────

/** Generate a follow-up email for a specific lead */
export async function generateEmail(leadId) {
  return apiFetch(`/leads/${leadId}/follow-up-email`, {
    method: 'POST',
  });
}

// ── Score Endpoint ───────────────────────────────────────

/** Get lead score and AI explanation */
export async function getScoreExplanation(leadId) {
  return apiFetch(`/leads/${leadId}/score-explanation`);
}

// ── Anomaly Endpoint ─────────────────────────────────────

/** Get detected anomalies */
export async function getAnomalies() {
  return apiFetch('/anomalies');
}
