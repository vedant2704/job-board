# Deployment Guide

## Services needed (all free tier)
| Service | Purpose | URL |
|---------|---------|-----|
| Railway | Python backend + PostgreSQL | railway.app |
| Vercel | React frontend | vercel.com |
| OpenAI | Embeddings + skill extraction | platform.openai.com |
| Pinecone | Vector database | pinecone.io |

---

## Step 1 — OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy it — you'll add it to Railway env vars

---

## Step 2 — Pinecone Setup
1. Go to https://pinecone.io → create free account
2. Create a new Index:
   - **Name:** `job-board`
   - **Dimensions:** `1536`
   - **Metric:** `cosine`
3. Copy your **API Key** from the project dashboard

---

## Step 3 — Deploy Backend to Railway

1. Push your repo to GitHub (`git push`)
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo → set **Root Directory** to `server`
4. Railway auto-detects Python via nixpacks.toml
5. Add a **PostgreSQL** plugin: click + → Database → PostgreSQL
   - Railway auto-sets `DATABASE_URL` for you
6. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | `production` |
| `JWT_SECRET` | run: `openssl rand -hex 32` |
| `JWT_EXPIRES_MINUTES` | `10080` |
| `OPENAI_API_KEY` | your OpenAI key |
| `PINECONE_API_KEY` | your Pinecone key |
| `PINECONE_INDEX` | `job-board` |
| `CLIENT_URL` | your Vercel URL (add after step 4) |

7. Deploy → wait ~2 min → visit `https://your-app.up.railway.app/health`
   Should return: `{"status":"ok","environment":"production"}`

---

## Step 4 — Deploy Frontend to Vercel

1. Go to https://vercel.com → New Project → Import your repo
2. Set **Root Directory** to `client`
3. Framework: **Vite**
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.up.railway.app`
5. Deploy → copy your Vercel URL (e.g. `https://job-board.vercel.app`)

---

## Step 5 — Connect them

1. Go back to Railway → add `CLIENT_URL` = your Vercel URL
2. Railway auto-redeploys in ~1 min

---

## Step 6 — Verify end-to-end

```bash
# 1. Health check
curl https://your-backend.up.railway.app/health

# 2. Register employer
curl -X POST https://your-backend.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","email":"hr@acme.com","password":"test123","role":"employer","company_name":"Acme Corp"}'

# 3. Open the app → register candidate → upload a PDF resume → wait 10s → view matches
```

---

## Troubleshooting

**`OPENAI_API_KEY` error on Railway**
→ Make sure you added it under Variables, not as a secret

**Pinecone no matches**
→ You need to post at least one job first (it embeds on creation)
→ Then upload a resume → wait 10s for background processing → check /matches

**CORS error on frontend**
→ `CLIENT_URL` on Railway must exactly match your Vercel URL (no trailing slash)

**PDF text extraction returns empty**
→ Your PDF may be a scanned image — use a text-based PDF instead

---

## Generate JWT_SECRET

```bash
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Free tier limits

| Service | Limit |
|---------|-------|
| Railway | $5 free credit/month (~500 hrs) |
| PostgreSQL on Railway | 1GB storage |
| Pinecone | 1 index, 100k vectors (enough for thousands of jobs) |
| OpenAI | Pay-per-use (~$0.0001 per embedding) |
| Vercel | Unlimited deploys |
