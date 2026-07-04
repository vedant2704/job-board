# JobMatch — AI-Powered Job Board

Candidates upload their resume → GPT extracts skills → Pinecone finds semantically matching jobs. Employers post listings and see applicants ranked by AI match score.

## Tech Stack
- **Frontend:** React 18, Vite, Zustand, Tailwind CSS
- **Backend:** FastAPI (Python), SQLAlchemy, PostgreSQL
- **AI:** OpenAI text-embedding-ada-002 + GPT-4o-mini, Pinecone vector DB
- **Infra:** Docker Compose (local), Vercel (frontend), Railway (backend)

## Local Setup

### Prerequisites
- Python 3.11+, Node.js 18+, Docker

### Backend
```bash
cd server
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
docker compose up -d   # start PostgreSQL
uvicorn main:app --reload
```
API docs → http://localhost:8000/docs

### Frontend
```bash
cd client
npm install
npm run dev
```
App → http://localhost:5173

## Build Phases
- [x] Phase 1 — Project setup & scaffolding
- [x] Phase 2 — Auth (register, login, JWT, roles)
- [x] Phase 3 — Job listings CRUD
- [ ] Phase 4 — AI matching (OpenAI + Pinecone)
- [ ] Phase 5 — Resume upload + employer view
- [ ] Phase 6 — Deploy
