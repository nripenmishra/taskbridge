# Stack Selection (Task 4 Complete)

## Decision
Adopt a TypeScript-first stack for faster delivery and lower context switching across frontend and backend.

## Chosen Stack
- **Web frontend:** Next.js (React, TypeScript, App Router)
- **Backend API:** NestJS (TypeScript)
- **Database:** PostgreSQL
- **ORM/migrations:** Prisma
- **Queue/cache:** Redis + BullMQ
- **Realtime:** Socket.IO via NestJS gateways
- **Auth:** JWT access/refresh + Google OAuth
- **Email provider abstraction:** Postmark (primary) with provider adapter interface
- **Local infrastructure:** Docker Compose (Postgres, Redis)

## Why this stack fits PRD v2
1. **Fast MVP delivery:** Next.js + NestJS have mature ecosystem and conventions.
2. **Realtime updates (PRD 9.2):** Socket.IO support is first-class in NestJS.
3. **Auditability and relational model:** PostgreSQL + Prisma fit tasks, memberships, activities.
4. **Notification scheduling:** BullMQ handles 24h reminders and overdue recurring jobs.
5. **Future mobile support:** REST API remains framework-agnostic for iOS/Android clients.
6. **Security needs:** Well-supported JWT/OAuth patterns and middleware for workspace isolation.

## Alternatives considered

### Option A: FastAPI + React
- Pros: excellent backend performance, strong typing with Pydantic.
- Cons: split language stack (Python + TypeScript) increases cognitive load early.

### Option B: Supabase-first backend
- Pros: very fast setup for auth + DB.
- Cons: tighter platform coupling; custom workflow rules may become complex.

### Option C: Django + DRF
- Pros: batteries-included, robust auth/admin.
- Cons: slower frontend/API iteration compared to TS-only workflow for this team.

## Constraints enforced from PRD
- Workspace member cap: **5** max.
- Task visibility: all workspace members can read all workspace tasks.
- Reminder policy (MVP): **24h only** (48h deferred).

## Service Boundaries (MVP)
- **Auth module:** sign-in, token refresh, Google OAuth callback.
- **Workspace module:** create workspace, invite users, enforce member cap.
- **Task module:** CRUD, assignment, status transitions.
- **Activity module:** immutable task events.
- **Notification module:** preference checks + push/email dispatch.
- **Realtime module:** task and status event fan-out.

## API Style
- REST under `/v1`
- JSON payloads
- UUID identifiers
- ISO-8601 UTC timestamps
- Error envelope: `{ code, message, requestId }`

## Definition of Done for Task 4
- [x] Single stack selected with rationale.
- [x] Local infra strategy selected.
- [x] API style and module boundaries documented.
- [x] Decision aligned with PRD v2 constraints.
- [x] Scaffolding plan provided in `infra/`, `apps/`, and `packages/`.
