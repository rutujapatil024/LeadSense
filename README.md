# LeadSense — GenAI Lead Intelligence Copilot

A full-stack RAG-powered application that lets sales/franchise teams query lead data using natural language, get AI-generated follow-up emails, see explainable lead scores, and receive anomaly alerts.

## Tech Stack

- **Backend**: Python + FastAPI
- **Database**: Supabase (Postgres) with pgvector
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2) — runs locally, free
- **LLM**: Groq API (free tier) via LangChain
- **Frontend**: React (Vite) + Recharts

## Quick Start

### 1. Database Setup

Run the SQL in `backend/supabase_migration.sql` in your Supabase SQL Editor.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env with your credentials (see .env.example)
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Seed Data

Upload `backend/data/synthetic_leads.csv` through the frontend CSV upload page, or via curl:

```bash
curl -X POST http://localhost:8000/leads/bulk-upload -F "file=@backend/data/synthetic_leads.csv"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /leads | Add a single lead |
| POST | /leads/bulk-upload | Upload CSV of leads |
| GET | /leads | List all leads |
| POST | /ask | Ask a natural language question |
| POST | /leads/{id}/follow-up-email | Generate follow-up email |
| GET | /leads/{id}/score-explanation | Get lead score + explanation |
| GET | /anomalies | Get anomaly alerts |

## Project Structure

```
LeadSense/
├── backend/           # Python FastAPI backend
│   ├── main.py        # App entry point
│   ├── ingestion.py   # Core ingestion pipeline
│   ├── rag.py         # RAG query pipeline
│   ├── scoring.py     # Lead scoring engine
│   ├── anomalies.py   # Anomaly detection
│   ├── routes/        # API endpoints
│   └── data/          # Synthetic test data
├── frontend/          # React (Vite) frontend
│   └── src/
│       ├── components/  # Reusable UI components
│       └── pages/       # Page-level components
└── README.md
```
