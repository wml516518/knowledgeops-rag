# KnowledgeOps RAG

A public technical-team knowledge base RAG demo built with React, FastAPI, Supabase pgvector, DashScope embeddings, and DeepSeek-compatible chat.

## Stack

- Frontend: React, Vite, TypeScript, Netlify
- Backend: Python, FastAPI, Render
- Database: Supabase Postgres + pgvector
- Embeddings: DashScope `text-embedding-v4`
- Chat: DeepSeek-compatible `deepseek-V4-flash`

## Local Development

Backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor before using the app.
