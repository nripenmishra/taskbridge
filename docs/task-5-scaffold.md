# Task 5 — Application scaffold (started)

This repo now contains runnable **NestJS** (`apps/api`) and **Next.js** (`apps/web`) baselines plus a shared package (`packages/shared`).

## What was added

- **API:** NestJS 11 app with global prefix `v1`:
  - `GET /v1/health` → `{ ok: true, service: "taskbridge-api" }`
  - **Auth:** JWT access + refresh, email register/login, Google OAuth, `GET /v1/auth/me` (see below)
  - CORS enabled for local web dev; `ValidationPipe` enabled globally
  - Port from `API_PORT` (default `4000`)
  - **Prisma** + PostgreSQL schema in `apps/api/prisma/schema.prisma`
  - First migration: `apps/api/prisma/migrations/20260412120000_init/`
  - `PrismaModule` / `PrismaService` registered globally in `AppModule`

### Auth endpoints (`apps/api/src/auth/`)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/v1/auth/register` | Body: `email`, `password`, `name` — bcrypt hash stored |
| `POST` | `/v1/auth/login` | Body: `email`, `password` |
| `POST` | `/v1/auth/refresh` | Body: `refreshToken` |
| `GET` | `/v1/auth/me` | Header: `Authorization: Bearer <accessToken>` |
| `GET` | `/v1/auth/google` | Starts Google OAuth (configure `GOOGLE_*` in `.env`) |
| `GET` | `/v1/auth/google/callback` | Completes OAuth; returns tokens + user JSON |

Set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and (for Google) `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` (must match Google Cloud “Authorized redirect URIs”, e.g. `http://localhost:4000/v1/auth/google/callback`).

### Workspace endpoints (`apps/api/src/workspace/`)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/workspaces` | Lists workspaces where the user has an **active** membership |
| `POST` | `/v1/workspaces` | Body: `{ "name": "..." }` — creator becomes **admin** |
| `GET` | `/v1/workspaces/:workspaceId/members` | JWT + must be active member |
| `POST` | `/v1/workspaces/:workspaceId/invitations` | **Admin only**; body `{ "email": "..." }`; max **5** seats (active + pending invites); returns `token` + `inviteLink` |
| `POST` | `/v1/invitations/accept` | Body `{ "token": "..." }`; logged-in user’s **email** must match the invitation |

Optional: `PUBLIC_WEB_URL` in `.env` controls the host in `inviteLink` (defaults to `http://localhost:3000`).

- **Web:** Next.js 15 App Router placeholder home page on port `3000`
- **Shared:** Minimal `TaskStatus` / `TaskPriority` constants for both apps

## Local setup

Prerequisites: Node.js 20+ and npm.

```bash
cd "/path/to/Task Management App"
cp .env.example .env
npm install
npm run infra:up
```

**`DATABASE_URL`:** Prisma CLI runs inside `apps/api` and needs this variable. The `prisma:*` npm scripts load env from **both** the **repo root** `.env` and **`apps/api/.env`** (later file wins). Put `DATABASE_URL` in the **repo root** `.env` (recommended), or copy that line into `apps/api/.env`.

Apply the database schema (empty Postgres):

```bash
npm run prisma:deploy
```

Or from `apps/api`: `npx prisma migrate deploy` (applies `20260412120000_init`).

For iterative schema changes in development, use `npm run prisma:migrate` (creates new migrations).

Terminal A (API):

```bash
npm run dev:api
```

Terminal B (web):

```bash
npm run dev:web
```

- API: `http://localhost:4000/v1/health`
- Web: `http://localhost:3000`

### Quick auth checks (curl)

```bash
curl -s -X POST http://localhost:4000/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"yourpassword","name":"You"}'

ACCESS_TOKEN='<paste accessToken from response>'

curl -s http://localhost:4000/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Next implementation slices (vertical)

1. ~~Prisma schema + migrations aligned with `docs/domain-model.md`~~ (initial migration added; evolve with `prisma migrate dev`)
2. ~~Auth module (JWT + Google OAuth) + `GET /v1/auth/me`~~ — implemented in `apps/api/src/auth/`
3. ~~Workspace module (cap 5, invites)~~ — implemented in `apps/api/src/workspace/`
4. Task module + activity log
5. Notification jobs (24h + overdue) via BullMQ
6. Realtime gateway (Socket.IO)

Use `docs/api/openapi.yaml` and `docs/api-contract.md` as the contract while coding.
