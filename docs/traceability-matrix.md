# TaskBridge Traceability Matrix (PRD -> Design Artifacts)

This matrix links PRD features to implementation design artifacts:
- Domain model: `docs/domain-model.md`
- API interface: `docs/api/openapi.yaml`
- Behavioral rules: `docs/api-contract.md`

## How to use this file
- During implementation: confirm each feature has both data model coverage and API coverage.
- During QA: derive test cases from "Key Contract Rules".
- During scope changes: update the matrix first, then the three design docs.

## Matrix

| PRD Feature | Domain Entities / Rules | OpenAPI Endpoints | Key Contract Rules |
|---|---|---|---|
| **F-01 User Auth** | `User` entity, auth provider (`email`, `google`) | Implemented: `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/refresh`, `GET /v1/auth/me`, `GET /v1/auth/google`, `GET /v1/auth/google/callback` (see `apps/api/src/auth/`) | JWT required for protected routes; consistent `401/403` behavior |
| **F-02 Workspace Management** | `Workspace`, `Membership`, `Invitation`; workspace cap **<= 5** | Implemented: `GET/POST /v1/workspaces`, `GET /v1/workspaces/{workspaceId}/members`, `POST /v1/workspaces/{workspaceId}/invitations`, `POST /v1/invitations/accept` (see `apps/api/src/workspace/`) | Admin-only invites; `WORKSPACE_LIMIT_REACHED` on cap |
| **F-03 Task Creation** | `Task` with required fields (title, assignee, priority) + optional description/due date | `GET/POST /v1/workspaces/{workspaceId}/tasks` | Only workspace members can create tasks; validate payloads |
| **F-04 Priority Levels** | `Task.priority` enum (`critical`, `high`, `medium`, `low`) | Task schemas in all task endpoints | Reject invalid enum values with `VALIDATION_ERROR` |
| **F-05 Task Assignment** | `Task.assignee_user_id`, `Task.creator_user_id`; all members can read all tasks | `POST /v1/workspaces/{workspaceId}/tasks`, `PATCH /v1/workspaces/{workspaceId}/tasks/{taskId}` | Assignee must be a workspace member; visibility model is workspace-wide |
| **F-06 Unified Dashboard** | Query model over `Task` by assignee/creator/status | `GET /v1/workspaces/{workspaceId}/tasks?view=assigned_to_me\\|assigned_by_me\\|completed\\|all` | Pagination/filter conventions; default sort by due date (active) and completion date (completed) |
| **F-07 Task Status Lifecycle** | `Task.status` enum + transition matrix; `Task.cancel_reason`; `Task.completed_at` | `POST /v1/workspaces/{workspaceId}/tasks/{taskId}/status` | Enforce allowed transitions; invalid transitions -> `422 INVALID_STATUS_TRANSITION` |
| **F-08 Push Notifications** | `NotificationPreference.channel_push`, trigger events from task lifecycle | Indirect: task/status endpoints trigger notification workflows | Push on assignment, due-24h, overdue, completion per preferences |
| **F-09 Email Notifications** | `NotificationPreference.channel_email`; due-24h only for MVP | Indirect: task/status endpoints + scheduler | MVP includes **24h** reminder, overdue, assignment; 48h deferred |
| **F-10 Completed Task History** | `Task.status=completed`, `Task.completed_at` | `GET /v1/workspaces/{workspaceId}/tasks?view=completed` | Completed lists sorted by `completedAt desc`; filter by date range |
| **F-11 Activity Feed / Audit Trail** | `TaskActivity` events with actor, event type, metadata | `GET /v1/workspaces/{workspaceId}/tasks/{taskId}/activity` | Write activity event on create/update/assignment/status actions |
| **F-12 Notification Preferences** | `NotificationPreference` unique per (`workspace_id`, `user_id`) | `GET/PUT /v1/workspaces/{workspaceId}/notification-preferences` | User updates only their own preferences in workspace context |
| **F-13 Task Comments (optional / later)** | Not modeled in MVP docs yet; add `Comment` entity when pulled in | Not yet in OpenAPI | Add eventing + permissions before enabling |

## Cross-cutting non-functional mapping

| Requirement Area | Where Captured |
|---|---|
| Workspace data isolation | `domain-model.md` access rules + `api-contract.md` auth rules |
| API consistency and error shape | `openapi.yaml` schemas + `api-contract.md` error format |
| Realtime payload contract | `api-contract.md` realtime event section |
| MVP reminder policy (24h only) | `domain-model.md` notification triggers + `api-contract.md` reminder contract |

## Gaps / next updates
- Add F-13 comments to all three docs if comments move into MVP scope.
- Add explicit endpoint for invitation acceptance once auth flow is selected.
- Add SLA-oriented error/retry policy for notification jobs when job queue is finalized.
