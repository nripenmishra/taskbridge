# TaskBridge — personal to-do tracker

Update this file whenever you want. Use `- [ ]` for open items and `- [x]` for done.

---

## Google OAuth setup

- [X] Create a project in [Google Cloud Console](https://console.cloud.google.com/) (or pick an existing one).
- [ ] Enable **Google+ API** / **Google Identity** APIs if the console prompts you (OAuth consent screen may be required first).
- [ ] Configure **OAuth consent screen** (External or Internal; add app name, support email, developer contact).
- [ ] Create **OAuth 2.0 Client ID** credentials:
  - Application type: **Web application** (or the type that matches your local redirect).
  - **Authorized redirect URIs** — add exactly what you use in `.env` as `GOOGLE_CALLBACK_URL`, for example:
    - `http://localhost:4000/v1/auth/google/callback`
- [ ] Copy **Client ID** and **Client Secret** into your **`.env`** (not committed to git):
  - `GOOGLE_CLIENT_ID=...`
  - `GOOGLE_CLIENT_SECRET=...`
  - Confirm `GOOGLE_CALLBACK_URL` matches the URI you registered in Google Cloud.
- [ ] Start the API (`npm run dev:api`) and test:
  - Open `http://localhost:4000/v1/auth/google` in a browser (should redirect to Google, then back to your callback).
- [ ] (Optional) Add production redirect URIs later when you deploy (same value pattern, different host).

**Notes**

- Email/password auth works without Google; Google is optional until the steps above are done.
- If Google shows “redirect_uri_mismatch”, the URI in Google Cloud and `GOOGLE_CALLBACK_URL` must match **character for character** (including `http` vs `https` and path).

---

## P0 launch checklist (Phase 1 — dashboard-first web)

- [x] P0-1: Verify email auth + workspace creation work end to end from the web
- [x] P0-2: Validate unified dashboard views and basic filters/sorting against PRD
- [x] P0-3: Validate task lifecycle rules (status changes, cancel with reason) via UI
- [x] P0-4: Verify workspace isolation and membership guards (no cross-workspace access)
- [x] P0-5: Verify JWT expiry + refresh, logout, and basic password/security behavior
- [x] P0-6: Prepare and provision production infra (API, web, Postgres [+ Redis if used])
- [x] P0-7: Configure HTTPS for production web and API (Railway default domains)
- [ ] P0-8: Set up backups, logging, monitoring/health checks for production
- [x] P0-9: Define and test a repeatable build + deploy pipeline (including migrations)

## Other tasks

_Add bullets below; copy the checkbox pattern._

- [ ] **Push to GitHub** — create an empty repo on GitHub, then from this project run `git remote add origin <repo-url>` and `git push -u origin main` (local commits are already version control; this publishes them).
- [ ] Example: run `npm run prisma:deploy` after pulling DB changes
- [ ] P1.5 fast follow-up: Add custom branded domains (e.g., `app.<domain>` and `api.<domain>`) and repoint env vars
- [ ] P0 blocker: Upgrade Railway plan to enable Postgres backups/snapshots for production recovery
- [ ] P1.5 decision: Use Railway Pro custom domains instead of migrating web hosting to Vercel
- [ ] P1.5 follow-up: Upgrade monitoring plan for unified API + web uptime checks and alerting

---

## Done (archive)

_Move finished items here if you like a paper trail._

- [ ] _(none yet)_
