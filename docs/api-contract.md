# TaskBridge API Contract Notes (MVP)

This file captures API behavior that should stay stable even if framework or database implementation changes.

## 1) Protocol and Conventions
- Base path: `/v1`
- Authentication: Bearer JWT
- Content type: `application/json`
- Time format: ISO-8601 UTC
- IDs: UUID v4

## 2) Workspace Authorization Rules
- Every workspace endpoint must verify active membership for `{workspaceId}`.
- Cross-workspace access returns `404` or `403` consistently based on your security strategy.
- Admin-only actions:
  - create/revoke invitations
  - manage workspace settings

## 3) Task Visibility and Permissions (MVP)
- Visibility: all active members in a workspace can view all tasks in that workspace.
- Task create: any active member.
- Task edit fields (title/description/due/priority/assignee): creator (or admin if policy added).
- Status updates:
  - assignee: `open <-> in_progress`, `in_progress -> completed`
  - creator: `completed -> open` (reopen), `open|in_progress -> cancelled`

## 4) Workspace Cap Enforcement
- Maximum members per workspace = 5 (active + invited).
- Invitation creation should fail with:
  - HTTP `409 Conflict`
  - `code: WORKSPACE_LIMIT_REACHED`

## 5) Task Status Transition Contract
Allowed:
- `open -> in_progress`
- `open -> completed`
- `open -> cancelled`
- `in_progress -> open`
- `in_progress -> completed`
- `in_progress -> cancelled`
- `completed -> open`

Disallowed:
- any transition from `cancelled` in MVP

Invalid transitions return:
- HTTP `422 Unprocessable Entity`
- `code: INVALID_STATUS_TRANSITION`

## 6) List, Filtering, and Pagination
- `/tasks` supports `view=assigned_to_me|assigned_by_me|completed|all`
- Additional filters: `status`, `priority`, `assigneeUserId`, `dueFrom`, `dueTo`
- Pagination: `page`, `pageSize`
- Recommended defaults:
  - active tasks: sort by `dueAt asc`
  - completed tasks: sort by `completedAt desc`

## 7) Error Response Format
```json
{
  "code": "FORBIDDEN",
  "message": "You are not allowed to update this task",
  "requestId": "req_123456"
}
```

Common error codes:
- `UNAUTHORIZED`
- `FORBIDDEN`
- `WORKSPACE_NOT_FOUND`
- `WORKSPACE_LIMIT_REACHED`
- `TASK_NOT_FOUND`
- `INVALID_STATUS_TRANSITION`
- `VALIDATION_ERROR`

## 8) Realtime Event Contract (for Web + future mobile)
Transport can be WebSocket or SSE, payload contract should remain stable.

Event types:
- `task.created`
- `task.updated`
- `task.status_changed`
- `task.completed`
- `task.reopened`
- `task.cancelled`

Envelope:
```json
{
  "event": "task.status_changed",
  "workspaceId": "9f0d7d57-4f4f-4d8d-89a0-7a8fae9f3cf0",
  "occurredAt": "2026-04-08T10:00:00Z",
  "data": {
    "taskId": "f8d6c8b3-5f8a-4a0d-9733-0f2d5d7cb27f",
    "fromStatus": "open",
    "toStatus": "in_progress"
  }
}
```

## 9) Notification Trigger Contract (MVP)
- Assignment notification: immediate (push/email based on preference)
- Due reminder: 24h before due (push/email based on preference)
- Overdue reminder: at due time + daily until task closed
- Completion notification: immediate to task creator

Deferred from MVP:
- 48h pre-deadline reminder

## 10) Implementation Readiness Checklist
- [ ] Add request/response validation using OpenAPI schemas
- [ ] Add authorization middleware that requires workspace membership
- [ ] Add service guard for workspace cap before invitation create
- [ ] Add status transition validator with explicit matrix
- [ ] Add `TaskActivity` write on create/update/status actions
- [ ] Add notification job scheduler for 24h and overdue events
- [ ] Add integration tests for cross-workspace isolation
