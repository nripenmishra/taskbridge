# TaskBridge

TaskBridge is a web-first task coordination platform. This repository contains product docs and implementation scaffolding aligned with `PRD.md`.

## Selected Stack (Task 4)
- Frontend: Next.js (React + TypeScript)
- Backend API: NestJS (TypeScript)
- Database: PostgreSQL + Prisma ORM
- Cache/Jobs: Redis + BullMQ
- Realtime: Socket.IO (NestJS gateway)
- Auth: JWT + Google OAuth
- Email: Postmark or SendGrid adapter
- Infra (dev): Docker Compose (Postgres + Redis)

See `docs/stack-selection.md` for rationale and trade-offs.

## Repository Layout
- `docs/` design and planning artifacts
- `apps/api/` NestJS API (health endpoint; expand per OpenAPI)
- `apps/web/` Next.js App Router UI shell
- `packages/shared/` shared types/constants
- `infra/` local infrastructure config

## Run locally
See `docs/task-5-scaffold.md` for `npm install`, `npm run infra:up`, `npm run prisma:deploy`, `npm run dev:api`, and `npm run dev:web`.

**Test dashboard (web):** with both servers running, open `http://localhost:3000/register` or `/login`, then `http://localhost:3000/dashboard` — create a workspace, add tasks, and exercise status actions (assignee vs creator/admin rules match the API).

## Database (Prisma)
- Schema: `apps/api/prisma/schema.prisma`
- Migrations: `apps/api/prisma/migrations/`
- **`DATABASE_URL`** must be available when Prisma runs. Scripts load **repo root** `.env` and then `apps/api/.env` (see `apps/api/package.json` `prisma:*` scripts). Keep `DATABASE_URL` in the root `.env` you created from `.env.example`.
- After Postgres is up: `npm run prisma:generate` (runs on `npm install` via `postinstall` in `apps/api`) and `npm run prisma:deploy` to apply migrations.

## Next Steps
1. Implement vertical slices: auth → workspaces → tasks → notifications → realtime.
