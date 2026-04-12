# TaskBridge API (NestJS)

Health check: `GET /v1/health` (after `npm run dev:api` from repo root).

## Prisma

- Schema: `prisma/schema.prisma`
- Apply migrations: `npm run prisma:deploy` (from repo root: `npm run prisma:deploy` uses workspace `api`)
- Generate client: `npm run prisma:generate` (also runs on `postinstall`)

`DATABASE_URL` must be set (see repo root `.env.example` or `apps/api/.env.example`). The API loads `.env` from the current working directory, one level up, or two levels up (monorepo root).

## Auth

- Global route prefix: `v1` — health is `GET /v1/health`
- `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/refresh`, `GET /v1/auth/me` (Bearer JWT), `GET /v1/auth/google`, `GET /v1/auth/google/callback`
- Secrets: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`; optional Google OAuth vars in `.env.example`

## Workspaces

- `GET/POST /v1/workspaces` — list / create (creator becomes admin)
- `GET /v1/workspaces/:workspaceId/members` — active members (member JWT)
- `POST /v1/workspaces/:workspaceId/invitations` — admin only; max **5** seats = active members + pending invites (`WORKSPACE_LIMIT_REACHED`)
- `POST /v1/invitations/accept` — body `{ "token": "..." }`; user’s email must match the invite
- Optional `PUBLIC_WEB_URL` in `.env` for `inviteLink` returned when creating an invite

See `docs/task-5-scaffold.md` for full setup and curl examples.
