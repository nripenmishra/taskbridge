# Product Requirements Document

## TaskBridge — Team Task Coordination Platform

| Field | Value |
|-------|--------|
| **Document Version** | 2.0 — MVP scope refinements |
| **Date** | April 2026 |
| **Status** | Draft — Pending Stakeholder Review |
| **Product Owner** | [Your Name / Team] |
| **Target Release** | v1.0 MVP (Phase 1) |
| **Platforms** | Web, iOS, Android |

**v2.0 summary:** All workspace members can see all tasks in the workspace; each workspace is limited to **5** members; MVP sends a **single deadline reminder at 24 hours** before due (48-hour advance reminder deferred).

---

## Version history

| Version | Date | Summary |
|---------|------|---------|
| 2.0 | April 2026 | Task visibility (all members); max 5 members per workspace; MVP reminders: 24h before due only; 48h reminder moved to future scope |
| 1.0 | March 2026 | Initial PRD (see `PRD.docx` origin); snapshot preserved conceptually as pre–v2.0 |

**Frozen snapshot:** [PRD_v2.md](PRD_v2.md) matches this document at v2.0 (update the snapshot when you cut v2.1, or maintain only `PRD.md`).

---

## 1. Executive Summary

TaskBridge is a lightweight, intuitive task coordination platform designed for teams and business partners who need to manage day-to-day responsibilities together. Unlike heavyweight project management tools, TaskBridge focuses on the interpersonal layer of task delegation — making it effortless to assign work, track accountability, set priorities, and get timely reminders, all within a single unified view.

The platform addresses a core pain point: important tasks assigned across partners and colleagues fall through the cracks because they live in emails, chat threads, and verbal conversations with no central place to track status, deadlines, or ownership.

Future iterations will extend TaskBridge with AI-powered capabilities — automatically creating tasks from emails and messages, and generating calendar invites for task deadlines — making coordination nearly frictionless.

---

## 2. Problem Statement

### 2.1 Background

Small teams and business partners operating without enterprise project management infrastructure often coordinate via email, chat (Slack, WhatsApp, Teams), or verbal communication. This creates several recurring problems:

- Tasks assigned informally are forgotten or deprioritized with no accountability mechanism.
- There is no single source of truth — each person tracks their own to-do list in isolation.
- Deadlines go unnoticed until after the fact.
- It is impossible to get a quick read on what you have assigned to others vs. what others have assigned to you.
- Completed work is invisible — there is no record of what has been done.

### 2.2 Target Users

TaskBridge is built for the following user profiles:

- Business partners co-running a company or venture (2–10 people)
- Small departmental teams within larger organizations (5–20 people)
- Cross-functional project squads needing lightweight coordination
- Freelancers managing work relationships with clients or collaborators

**v2.0 note:** MVP enforces a **maximum of 5 members per workspace** (see Section 4.1). Larger teams may split across workspaces until limits are revisited.

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

- Reduce missed deadlines by providing proactive, timely notifications as task due dates approach.
- Create a single shared view of all tasks — assigned to me, assigned by me, and completed — in one place, with **full visibility of workspace tasks to all members** (v2.0).
- Make task assignment and delegation as fast as sending a message.
- Enable priority signaling so that critical tasks are never buried.
- Establish an auditable history of completed work for retrospectives and accountability.

### 3.2 Success Metrics (v1.0)

| Metric | Target (90 Days Post-Launch) |
|--------|------------------------------|
| Daily Active Users (DAU / MAU ratio) | > 40% |
| Tasks completed on time | > 70% of all closed tasks |
| User retention (Week 4) | > 60% |
| Avg. time to create & assign a task | < 60 seconds |
| User satisfaction (NPS) | > 40 |

---

## 4. Product Scope

### 4.1 In Scope — Phase 1 (MVP)

- User authentication and team/workspace management
- **Workspace size:** maximum **5** members per workspace (including the creator/admin); invites blocked at cap with clear messaging
- **Task visibility:** **every member** of a workspace can see **all tasks** in that workspace (not limited to creator + assignee)
- Task creation with title, description, assignee, due date, and priority
- Unified task dashboard (assigned to me + assigned by me + completed)
- Deadline proximity notifications (push + email): **MVP sends one reminder at 24 hours before due** (see Section 7)
- Task status management (Open → In Progress → Completed)
- Completed task history with filters
- Basic activity feed / task audit trail

### 4.2 In Scope — Phase 2 (Future Iterations)

- **48-hour advance deadline reminder** (in addition to the 24h reminder) — explicitly **deferred** from MVP (v2.0)
- AI-powered calendar invite auto-creation when a task with a deadline is assigned
- AI task extraction from emails (Gmail / Outlook integration)
- AI task extraction from messages (Slack / Teams integration)
- Recurring tasks
- Task dependencies and subtasks
- Analytics dashboard (completion rates, overdue trends)

### 4.3 Out of Scope

- Full project management (Gantt charts, resource allocation, budgeting)
- Time tracking
- Client billing or invoicing
- Document collaboration

---

## 5. User Stories

### 5.1 Authentication & Onboarding

- As a new user, I can sign up with email or a social login (Google) so I can start using TaskBridge quickly.
- As a user, I can create or join a workspace so my team or partners can collaborate in a shared environment.
- As a workspace admin, I can invite team members via email link so they can join without a manual setup process, **subject to the workspace member limit (5)**.

### 5.2 Task Creation & Assignment

- As a user, I can create a task with a title, description, assignee, due date, and priority level so the assignee has all the context they need.
- As a user, I can assign a task to any member of my workspace so accountability is clearly established.
- As a user, I can set priority as Critical, High, Medium, or Low so the assignee knows what to focus on first.
- As a user, I can add optional notes or attachments to a task so additional context is preserved.
- As a user, I can assign a task to myself to track personal commitments visible to my teammates.
- **As any workspace member, I can see all tasks in the workspace** so we share one source of truth (v2.0).

### 5.3 Unified Task Dashboard

- As a user, I can see all tasks assigned TO me in one view so I never miss what I owe others.
- As a user, I can see all tasks I have assigned TO others so I can follow up proactively.
- As a user, I can filter and sort tasks by due date, priority, assignee, or status.
- As a user, I can switch to a 'Completed Tasks' view to review what has already been done.

### 5.4 Notifications & Reminders

- As an assignee, I receive a push notification and email when a new task is assigned to me.
- As an assignee, I receive a **reminder notification 24 hours before a task is due** (push and/or email per my preferences).
- As an assignee, I receive an overdue notification if a task passes its deadline without being marked complete.
- As a task creator, I receive a notification when an assignee marks my task complete.
- As a user, I can configure my notification preferences (push, email, or both) in settings.

**v2.0 note:** The **48-hour-before-due** reminder is **not** in MVP; it is planned for a later release (see Section 4.2).

### 5.5 Task Status Management

- As an assignee, I can update the status of my task (Open → In Progress → Completed) so the assigner knows where things stand.
- As a task creator, I can reopen a completed task if follow-up is required.
- As a task creator, I can mark a task as cancelled and provide a reason.

### 5.6 Completed Task History

- As a user, I can view a history of all completed tasks filtered by date range, person, or priority.
- As a user, I can see who completed a task and when it was marked complete.

---

## 6. Feature Requirements

| ID | Feature | Description | Priority | Phase |
|----|---------|-------------|----------|-------|
| F-01 | User Auth | Email + Google OAuth sign-up/login with secure session management | P0 | 1 |
| F-02 | Workspace Management | Create/join workspaces; invite via email link; admin role; **max 5 members per workspace** | P0 | 1 |
| F-03 | Task Creation | Title, description, assignee, due date, priority, optional notes | P0 | 1 |
| F-04 | Priority Levels | Four levels: Critical, High, Medium, Low with visual indicators | P0 | 1 |
| F-05 | Task Assignment | Assign to any workspace member; self-assignment supported; **all members see all workspace tasks** | P0 | 1 |
| F-06 | Unified Dashboard | Single view: Assigned To Me, Assigned By Me, tabs/filters | P0 | 1 |
| F-07 | Task Status | Status lifecycle: Open → In Progress → Completed / Cancelled | P0 | 1 |
| F-08 | Push Notifications | In-app + push on new assignment, **24h deadline reminder**, overdue | P0 | 1 |
| F-09 | Email Notifications | Email on assignment, **24h reminder**, overdue | P1 | 1 |
| F-10 | Completed History | Filterable archive of all completed tasks with timestamps | P1 | 1 |
| F-11 | Activity Feed | Per-task audit trail: status changes, edits, comments | P1 | 1 |
| F-12 | Notification Prefs | User-level toggle: push, email, or both per notification type | P1 | 1 |
| F-13 | Task Comments | Threaded comments on a task for back-and-forth context | P2 | 1 |
| F-14 | Calendar Invite | Auto-create calendar event (Google / Outlook) when task assigned | P0 | 2 |
| F-15 | Email → Task AI | Parse emails and suggest tasks with pre-filled fields | P1 | 2 |
| F-16 | Message → Task AI | Parse Slack/Teams messages and extract actionable tasks | P1 | 2 |
| F-17 | Recurring Tasks | Set repeat cadence (daily, weekly, monthly) on any task | P2 | 2 |
| F-18 | Analytics Dashboard | Completion rate, overdue rate, individual workload charts | P2 | 2 |

---

## 7. Notification Specification

| Trigger | Recipient | Timing | Push | Email |
|---------|-----------|--------|------|-------|
| Task assigned to user | Assignee | Immediately | ✓ | ✓ |
| Task deadline in 24 hours | Assignee | 24h before due | ✓ | ✓ |
| Task is overdue | Assignee + Creator | At due time + daily until closed | ✓ | ✓ |
| Task marked complete | Creator | Immediately | ✓ | Optional |
| Task commented on | Creator + Assignee | Immediately | ✓ | Optional |
| Task reopened | Assignee | Immediately | ✓ | ✓ |

**Deferred (post-MVP):** Reminder **48 hours before due** — not included in v2.0 MVP; may be added in a later release (see Section 4.2).

---

## 8. UX & Design Requirements

### 8.1 Core Design Principles

- **Speed first**: creating and assigning a task should take under 60 seconds.
- **Zero cognitive overhead**: the dashboard must show everything without needing to navigate sub-menus.
- **Mobile-first**: the majority of task updates (status changes, comments) will happen on mobile.
- **Clarity over density**: prioritize readability of task cards over packing in information.

### 8.2 Dashboard Layout

The main dashboard should present tasks in a tab-based or segmented view with the following sections:

- **My Tasks (Assigned to Me)** — default landing view, sorted by due date ascending
- **Delegated Tasks (Assigned by Me)** — tasks I have given to others, sorted by due date
- **Completed** — archive view, reverse-chronological, with date range filter

Each task card in the list must surface at minimum: task title, assignee avatar, due date, priority badge, and current status.

**v2.0:** Because all workspace members see all tasks, optional navigation or filters may surface **“All workspace tasks”** in addition to the segments above; MVP may implement this as filters on a shared list rather than a fourth tab — product decision during design.

### 8.3 Task Priority Visuals

- **Critical** — Red badge with exclamation icon
- **High** — Orange badge
- **Medium** — Yellow badge
- **Low** — Green badge

### 8.4 Responsive Design

- **Web**: full sidebar + main panel layout
- **Tablet**: collapsible sidebar with swipe navigation
- **Mobile**: bottom tab bar navigation, full-screen task cards

---

## 9. Technical Requirements

### 9.1 Platform Support

- **Web Application**: modern browsers (Chrome, Safari, Firefox, Edge — latest 2 versions)
- **iOS**: iOS 16+
- **Android**: Android 12+

### 9.2 Architecture Considerations

- **Real-time updates**: task status changes and new assignments should reflect instantly across all active sessions (WebSocket or equivalent).
- **Offline capability (Phase 2)**: mobile apps should queue status updates when offline and sync on reconnect.
- **Notification infrastructure**: push via APNs (iOS) and FCM (Android); transactional email via a provider such as SendGrid or Postmark.
- **Data storage**: tasks, comments, and activity logs must be persisted with full audit trail capability.

### 9.3 Security & Privacy

- All data in transit must use TLS 1.2 or higher.
- Task data must be scoped to the workspace — cross-workspace data leakage is a critical defect.
- **Within a workspace (v2.0):** any authenticated member may read all tasks in that workspace; writes (status changes, edits) remain governed by product rules (e.g. assignee updates status, creator cancels).
- Authentication tokens must expire and support refresh flows.
- User passwords must be hashed with bcrypt or equivalent.
- GDPR-compliant data deletion: workspace admins must be able to export and delete all workspace data.

### 9.4 Performance Requirements

- Dashboard load time: < 2 seconds on a standard 4G connection.
- Notification delivery: push notifications must arrive within 60 seconds of trigger event.
- API response time (P95): < 300ms for all read operations.

---

## 10. Future Roadmap (Phase 2+)

### 10.1 AI-Powered Calendar Invite Creation

When a task with a deadline is created and assigned, TaskBridge will automatically generate and send a calendar invite to the assignee's connected calendar (Google Calendar or Outlook Calendar). The invite will include the task title, description, and a link to the task in TaskBridge.

- User connects their calendar via OAuth during onboarding (optional)
- On task assignment, system creates a calendar event at the due date/time
- Assignee receives both a TaskBridge notification and a calendar invite
- If the task due date is updated, the calendar event is automatically updated

### 10.2 AI Task Extraction from Email

TaskBridge will connect to users' email accounts (Gmail, Outlook) with explicit permission and analyze incoming emails for actionable requests. The AI will identify emails containing task-like language ("Can you send me the report by Friday?") and present a suggested task to the user for one-click confirmation or editing before creation.

- Email integration requires explicit OAuth consent with read-only access
- Suggested tasks are previewed before being added — never auto-created without user approval
- Users can train the system by accepting or rejecting suggestions to improve accuracy

### 10.3 AI Task Extraction from Messages

A parallel integration with messaging platforms (Slack, Microsoft Teams) will monitor channels and direct messages the user has connected, surfacing action items and suggested tasks in real time.

- Slack App integration: TaskBridge appears as a bot that users can trigger with a shortcut
- Teams integration via Microsoft Power Platform connectors
- Tasks extracted from messages link back to the original message thread for context

---

## 11. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Low user adoption if onboarding is too complex | High | Invest in a guided onboarding flow with sample tasks pre-populated. Target < 3 minutes to first task created. |
| Notification fatigue leading to users disabling alerts | Medium | Allow granular notification control per task type and allow 'quiet hours' configuration. |
| Email extraction AI surfaces too many false positives | Medium | Always require user confirmation before task creation. Provide feedback loop to improve model accuracy. |
| Workspace data isolation failure | Critical | Enforce workspace-scoped access control at the API layer with comprehensive integration test coverage. |
| Calendar integration OAuth complexity | Low | Phase this feature; provide a manual fallback (copy-to-clipboard of .ics file) until OAuth is stable. |

---

## 12. Open Questions & Resolved Decisions

### 12.1 Resolved decisions (v2.0)

| Topic | Decision |
|-------|----------|
| Task visibility | **All workspace members** can see **all tasks** in the workspace. |
| Workspace size at launch | **Maximum 5 members** per workspace. |
| Deadline reminders (MVP) | **24 hours before due** only (push + email per prefs). **48-hour** reminder **deferred** to a later release. |

### 12.2 Open questions

- Pricing model: free tier with limited workspaces, or freemium with seat-based pricing?
- Should task creators be able to set custom reminder intervals (e.g., 7 days before)?
- For the AI email/message integration, should the system process retroactively or only from the integration date forward?
- What analytics, if any, should workspace admins see about team task completion rates in Phase 1?

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Task** | A discrete unit of work with a title, assignee, due date, priority, and status. |
| **Workspace** | A shared environment containing team members and their tasks. **v2.0:** up to **5** members. |
| **Assignee** | The person responsible for completing a task. |
| **Creator** | The person who created and delegated a task. |
| **Priority** | A signal of urgency/importance: Critical, High, Medium, or Low. |
| **Overdue** | A task whose due date has passed without being marked Complete. |
| **Phase 1 / MVP** | The initial product launch including all P0 and P1 features. |
| **Phase 2** | The AI-enhanced iteration following Phase 1 GA launch. |
| **Workspace task visibility (v2.0)** | Any member of a workspace may view every task in that workspace. |

---

*End of document*

*Source: evolved from `PRD.docx` v1.0; **PRD.md** is the living requirements doc. **PRD_v2.md** is a named snapshot of version 2.0. Update both when requirements change materially, or maintain only `PRD.md` and bump version history.*
