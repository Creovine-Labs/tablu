# Tablu — Deployment Guide

Repo: `github.com/Creovine-Labs/tablu` · Backend → Railway · Frontend → Vercel
(Both deploy from the same repo using a **Root Directory** setting.)

---

## Step 1 — Backend on Railway

1. Go to **railway.app** → **New Project** → **Deploy from GitHub repo**.
2. Authorize Railway for the **Creovine-Labs** org, pick **tablu**.
3. Open the service → **Settings**:
   - **Root Directory:** `backend`
   - Build/start are auto (Nixpacks runs `npm run build` then `npm run start`).
4. **Variables** tab → add these (copy values from your local `backend/.env`):
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MUX_TOKEN_ID`
   - `MUX_TOKEN_SECRET`
   - `MOMO_TARGET_ENVIRONMENT` = `sandbox`
   - (later) `MOMO_SUBSCRIPTION_KEY`, `MOMO_API_USER`, `MOMO_API_KEY`
   - Do NOT set `PORT` — Railway provides it.
5. **Settings → Networking → Generate Domain.** Copy the URL, e.g.
   `https://tablu-backend-production.up.railway.app` → this is your **BACKEND_URL**.

## Step 2 — Frontend on Vercel

1. Go to **vercel.com** → **Add New → Project** → import **Creovine-Labs/tablu**.
2. **Root Directory:** `frontend` (framework auto-detects as Vite).
3. **Environment Variables:** add
   - `VITE_API_URL` = your **BACKEND_URL** (from step 1.5)
4. **Deploy.** Copy the resulting URL, e.g. `https://tablu.vercel.app` → your **APP_URL**.

## Step 3 — Connect them (back on Railway)

Add two more Variables on the Railway backend, then it redeploys:
- `CLIENT_ORIGIN` = **APP_URL**  (allows the app through CORS + sockets)
- `PUBLIC_MENU_BASE` = **APP_URL**  (so QR codes encode the real menu address)

## Step 4 — Verify

- Open **APP_URL/admin** → your restaurants load.
- Open a restaurant → **QR Code** tab → **Download** → the QR now points to `APP_URL/r/{slug}`.
- **Scan it from a phone** → opens that restaurant's menu → order → it appears on
  **APP_URL/kitchen/{id}** live.

## Notes
- Same Supabase DB is used in prod and local — schema is already there, no migration step.
- Redeploys happen automatically on every `git push` to `main`.
- MoMo stays in safe simulated mode until the 3 MoMo vars are set on Railway.
