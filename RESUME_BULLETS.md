# Resume Bullets — JobMatch AI Job Board

## Format (same as CollabDocs)

**JobMatch** — AI-Powered Job Board  *React.js, FastAPI, OpenAI, Pinecone, PostgreSQL, Docker*

---

## Option 1 — Focus on AI / ML pipeline
- Built an AI-powered job board where candidate resumes are embedded using **OpenAI text-embedding-ada-002** and matched to job listings via **Pinecone vector search**, returning cosine similarity scores ranked by semantic relevance
- Implemented **GPT-4o-mini skill extraction** pipeline that parses uploaded PDF resumes and returns structured JSON skill lists, stored per candidate and displayed as a side-by-side skill gap analysis for employers
- Designed a **background task architecture** using FastAPI's BackgroundTasks — job embeddings and resume processing run asynchronously so API responses stay under 200ms regardless of OpenAI latency

## Option 2 — Focus on fullstack depth
- Engineered a **dual-role fullstack platform** (candidate/employer) with FastAPI + PostgreSQL backend, JWT auth with role-based guards, and a React frontend featuring drag-and-drop PDF upload and real-time application tracking
- Built an **AI matching pipeline** that embeds job listings into Pinecone on creation and re-queries with resume embeddings at apply time, storing cosine similarity match scores on every application for employer-side ranking
- Implemented a **skills comparison view** for employers showing candidate extracted skills highlighted green/red against required job skills, enabling data-driven hiring decisions without reading full resumes

## Option 3 — Focus on architecture
- Architected a **semantic search system** using OpenAI ada-002 embeddings (1536-dim) stored in Pinecone with cosine similarity metric — queries return top-10 job matches in <500ms for any uploaded resume
- Built **role-aware protected routing** on both frontend (React ProtectedRoute with role prop) and backend (FastAPI `require_candidate` / `require_employer` dependencies), preventing cross-role data access at every layer
- Deployed on **Railway** (FastAPI + PostgreSQL) + **Vercel** (React), with nixpacks.toml build config, SQLAlchemy auto-migration on startup, and production CORS hardening

---

## Interview talking points

**"How does the AI matching work?"**
> When an employer posts a job, we combine the title, description, skills, and location into one string and call OpenAI's text-embedding-ada-002 to get a 1536-dimension vector. We upsert that to Pinecone. When a candidate uploads a resume, we do the same — embed the full resume text. At apply time, we query Pinecone with the resume vector and get cosine similarity scores against all job vectors. Cosine similarity gives us a 0–1 score for how semantically similar the resume is to the job, which we store on the application record.

**"Why Pinecone over just PostgreSQL full-text search?"**
> PostgreSQL full-text search does keyword matching — it finds exact words. Pinecone does semantic search — it understands that "software engineer" and "developer" are related, or that "React" matches a job requiring "frontend frameworks". For job matching, semantic understanding matters much more than exact keywords.

**"How do you handle OpenAI API latency in the apply flow?"**
> The job embedding happens in a FastAPI BackgroundTask — the employer gets the 201 response immediately, then the embedding runs async. For resume processing, same pattern. The only synchronous call to OpenAI is at apply time for the match score, which is acceptable since users expect a brief delay when submitting an application.

**"How would you scale this?"**
> The main bottleneck would be OpenAI API rate limits. I'd add a Redis queue (Celery) for background embedding tasks with rate limiting. For Pinecone, the free tier supports 100k vectors which handles thousands of jobs. At scale, I'd shard by industry/location in separate namespaces to keep query latency low.
