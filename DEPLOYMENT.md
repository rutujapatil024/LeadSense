# LeadSense — Live Deployment Guide

This guide walks you through deploying both the **Frontend** and **Backend** to free cloud hosting platforms to make LeadSense accessible on the public internet.

---

## Architecture Overview

| Component | Technology | Recommended Host | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite + Recharts | [Vercel](https://vercel.com) (or Netlify) | **Free** |
| **Backend** | FastAPI + sentence-transformers + LangChain | [Render](https://render.com) (or Railway / Koyeb) | **Free** |
| **Database** | Postgres + pgvector | [Supabase](https://supabase.com) | **Free** |
| **LLM** | Groq API (`llama-3.3-70b-versatile` / `gpt-oss-120b`) | [Groq Cloud](https://console.groq.com) | **Free** |

---

## Step 1: Push Latest Changes to GitHub

All deployment configuration files (`Dockerfile`, `vercel.json`, `render.yaml`, and environment templates) have been prepared for you.

Run the following in your terminal:
```bash
git add .
git commit -m "Configure production deployment for Vercel and Render"
git push origin main
```

---

## Step 2: Deploy the Backend (FastAPI on Render)

1. Sign up or log into [Render](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select repository: `rutujapatil024/LeadSense`.
4. Configure the settings:
   - **Name**: `leadsense-backend` (or your choice)
   - **Language**: `Docker`
   - **Root Directory**: Leave blank or set to `backend`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Context**: `./backend`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add the following keys from your `backend/.env`:
   - `SUPABASE_URL` = *(Your Supabase project URL)*
   - `SUPABASE_SERVICE_KEY` = *(Your Supabase service role secret)*
   - `GROQ_API_KEY` = *(Your Groq API key)*
   - `GROQ_MODEL` = `openai/gpt-oss-120b` (or `llama-3.3-70b-versatile`)
6. Click **Create Web Service**.
7. Once deployed, Render will provide your live backend URL:
   `https://leadsense-backend.onrender.com`
   *(Test it in your browser: `https://leadsense-backend.onrender.com/docs` to see Swagger UI)*.

> [!NOTE]
> On Render's free tier, services spin down after 15 minutes of inactivity. The first request after idle may take ~30-50 seconds to warm up.

---

## Step 3: Deploy the Frontend (React on Vercel)

1. Sign up or log into [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `rutujapatil024/LeadSense`.
4. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
5. Expand **Environment Variables**:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your Render backend URL from Step 2 (e.g. `https://leadsense-backend.onrender.com`)
6. Click **Deploy**.
7. In ~60 seconds, your site is live! You will receive a URL like `https://leadsense.vercel.app`.

---

## Step 4: Verification Checklist

1. Open your live Vercel URL.
2. Go to the **Leads** table and verify existing leads load from Supabase.
3. Add a test lead or upload a sample CSV.
4. Test the **Ask AI** natural language query feature.
5. Generate an AI follow-up email and view lead score explanations.
6. Check the **Anomaly Detection** tab to verify background scoring runs properly.

---

## Alternative: Railway (All-In-One Alternative)

If you prefer Railway:
1. Log into [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. For Backend: select `backend` directory, set the 3 environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GROQ_API_KEY`).
4. Generate a public domain under Settings.
5. For Frontend: deploy `frontend` directory with `VITE_API_BASE_URL` pointing to the backend domain.
