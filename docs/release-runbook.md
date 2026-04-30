# TaskBridge Release Runbook (Railway)

Use this checklist for every production release. The goal is a repeatable flow with explicit verification and rollback steps.

---

## 1) Pre-release checks

- [ ] Changes are merged to `main` and pushed to GitHub.
- [ ] `apps/api` and `apps/web` both build locally.
- [ ] Any required env var changes are prepared for Railway services.
- [ ] If database schema changed, migration files are committed under `apps/api/prisma/migrations/`.

Recommended local validation:

```bash
npm run build -w api
npm run build -w web
```

---

## 2) Deploy API service

Service: `taskbridge-api`

- [ ] Confirm Railway API settings:
  - Root Directory: `apps/api`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start:prod`
  - Pre-Deploy Command: `npm run prisma:deploy`
- [ ] Confirm API env vars are present and correct (`DATABASE_URL`, JWT secrets, URL vars).
- [ ] Trigger API deploy from latest `main`.
- [ ] Verify deploy reaches healthy state.

Post-deploy API checks:

- [ ] `GET /v1/health` returns success.
- [ ] API logs show startup without runtime exceptions.

---

## 3) Deploy web service

Service: `taskbridge-web`

- [ ] Confirm Railway web settings:
  - Root Directory: `apps/web`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start -- --hostname 0.0.0.0 --port $PORT`
  - Target/internal port matches runtime (currently `8080`).
- [ ] Confirm web env vars are correct:
  - `NEXT_PUBLIC_API_BASE_URL=https://<api-domain>/v1`
- [ ] Trigger web deploy from latest `main`.
- [ ] Verify deploy reaches healthy state.

Post-deploy web checks:

- [ ] `/login` loads.
- [ ] No repeated 5xx in web logs.

---

## 4) Smoke tests (production)

Run these in order:

- [ ] Open web app and register/login.
- [ ] Create/select a workspace.
- [ ] Create a task.
- [ ] Change task status.
- [ ] Validate API auth still works after refresh/logout cycle.

---

## 5) Monitoring and operations checks

- [ ] API and web logs are visible in Railway.
- [ ] Uptime checks are green for web and API health endpoints.
- [ ] Backup status noted (or documented plan limitation if on non-Pro).

---

## 6) Rollback procedure

If release is unhealthy:

1. Roll back API/web to the previous stable Railway deployment.
2. Re-run health checks and smoke tests.
3. If issue is migration-related, pause forward deploys and create a follow-up migration/fix branch.
4. Document incident:
   - what failed
   - impact window
   - immediate fix
   - prevention action

---

## 7) Release record template

Copy this section per release:

- Release date/time:
- Git commit SHA:
- API deployment ID:
- Web deployment ID:
- Migration applied:
- Smoke test result:
- Monitors status:
- Rollback needed (yes/no):
- Notes:
