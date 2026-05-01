'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, ApiError } from '@/lib/api';
import {
  clearAuthSession,
  getStoredUser,
  getStoredWorkspaceId,
  setWorkspaceId,
  type StoredUser,
} from '@/lib/auth-storage';

type MembershipRole = 'admin' | 'member';

type WorkspaceRow = {
  id: string;
  name: string;
  role: MembershipRole;
};

type MemberRow = {
  userId: string;
  email: string;
  name: string;
  role: MembershipRole;
  status: string;
};

type InvitationResponse = {
  id: string;
  workspaceId: string;
  email: string;
  status: string;
  expiresAt: string;
  token: string;
  inviteLink: string;
};

type TaskRow = {
  id: string;
  title: string;
  description?: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueAt: string | null;
  assigneeUserId: string;
  creatorUserId: string;
  cancelReason?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type TaskActivityRow = {
  id: string;
  taskId: string;
  actorUserId: string;
  eventType:
    | 'created'
    | 'updated'
    | 'assigned'
    | 'status_changed'
    | 'priority_changed'
    | 'due_changed'
    | 'completed'
    | 'reopened'
    | 'cancelled';
  meta: Record<string, unknown>;
  createdAt: string;
};

type TaskView = 'assigned_to_me' | 'assigned_by_me' | 'completed' | 'all';

const PRIORITIES: TaskRow['priority'][] = [
  'critical',
  'high',
  'medium',
  'low',
];

export function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [total, setTotal] = useState(0);
  const [view, setView] = useState<TaskView>('assigned_to_me');
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [newWsName, setNewWsName] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [priority, setPriority] = useState<TaskRow['priority']>('medium');
  const [dueAt, setDueAt] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const [cancelTaskId, setCancelTaskId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [activityTaskId, setActivityTaskId] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityItems, setActivityItems] = useState<TaskActivityRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<InvitationResponse | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const currentRole = useMemo(() => {
    const w = workspaces.find((x) => x.id === workspaceId);
    return w?.role ?? 'member';
  }, [workspaces, workspaceId]);

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'active'),
    [members],
  );

  const loadWorkspaces = useCallback(async () => {
    const res = await apiRequest<{ items: WorkspaceRow[] }>('/workspaces', {
      method: 'GET',
    });
    setWorkspaces(res.items);
    const saved = getStoredWorkspaceId();
    const pick =
      (saved && res.items.some((w) => w.id === saved) && saved) ||
      res.items[0]?.id ||
      null;
    setWorkspaceIdState(pick);
    if (pick) setWorkspaceId(pick);
    else setWorkspaceId(null);
  }, []);

  const loadMembers = useCallback(
    async (wid: string) => {
      const res = await apiRequest<{ items: MemberRow[] }>(
        `/workspaces/${wid}/members`,
        { method: 'GET' },
      );
      setMembers(res.items);
      const actives = res.items.filter((m) => m.status === 'active');
      const u = getStoredUser();
      if (u && actives.some((m) => m.userId === u.id)) {
        setAssigneeUserId(u.id);
      } else if (actives[0]) {
        setAssigneeUserId(actives[0].userId);
      }
    },
    [],
  );

  const loadTasks = useCallback(
    async (wid: string, v: TaskView) => {
      const q = new URLSearchParams({ view: v, page: '1', pageSize: '100' });
      const res = await apiRequest<{
        items: TaskRow[];
        total: number;
      }>(`/workspaces/${wid}/tasks?${q.toString()}`, { method: 'GET' });
      setTasks(res.items);
      setTotal(res.total);
    },
    [],
  );

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace('/login');
      return;
    }
    setUser(u);
    let cancelled = false;
    (async () => {
      try {
        await loadWorkspaces();
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 401) {
            clearAuthSession();
            router.replace('/login');
          } else {
            setListError(e instanceof Error ? e.message : 'Failed to load');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadWorkspaces, router]);

  useEffect(() => {
    if (!workspaceId || !user) return;
    let cancelled = false;
    setListError(null);
    (async () => {
      try {
        await loadMembers(workspaceId);
        await loadTasks(workspaceId, view);
      } catch (e) {
        if (!cancelled) {
          setListError(
            e instanceof Error ? e.message : 'Failed to load workspace data',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, view, user, loadMembers, loadTasks]);

  function logout() {
    clearAuthSession();
    router.replace('/login');
  }

  function onWorkspaceChange(id: string) {
    setWorkspaceIdState(id);
    setWorkspaceId(id);
  }

  async function createWorkspace(e: FormEvent) {
    e.preventDefault();
    const name = newWsName.trim();
    if (!name) return;
    setCreatingWs(true);
    setActionError(null);
    try {
      const created = await apiRequest<{ id: string }>('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setNewWsName('');
      await loadWorkspaces();
      onWorkspaceChange(created.id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not create workspace',
      );
    } finally {
      setCreatingWs(false);
    }
  }

  async function createTask(e: FormEvent) {
    e.preventDefault();
    if (!workspaceId || !title.trim() || !assigneeUserId) return;
    setCreatingTask(true);
    setActionError(null);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        assigneeUserId,
        priority,
      };
      if (description.trim()) body.description = description.trim();
      if (dueAt) body.dueAt = new Date(dueAt).toISOString();

      await apiRequest(`/workspaces/${workspaceId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setTitle('');
      setDescription('');
      await loadTasks(workspaceId, view);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not create task',
      );
    } finally {
      setCreatingTask(false);
    }
  }

  async function findPendingInvitationByEmail(
    wid: string,
    email: string,
  ): Promise<InvitationResponse | null> {
    const res = await apiRequest<{ items: InvitationResponse[] }>(
      `/workspaces/${wid}/invitations`,
      { method: 'GET' },
    );
    const target = email.trim().toLowerCase();
    return (
      res.items.find((x) => x.email.trim().toLowerCase() === target) ?? null
    );
  }

  async function createInvitation(e: FormEvent) {
    e.preventDefault();
    if (!workspaceId || !inviteEmail.trim()) return;
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    setInviting(true);
    setActionError(null);
    setInviteMessage(null);
    try {
      const res = await apiRequest<InvitationResponse>(
        `/workspaces/${workspaceId}/invitations`,
        {
          method: 'POST',
          body: JSON.stringify({ email: normalizedEmail }),
        },
      );
      setInviteResult(res);
      setInviteEmail('');
      setInviteMessage('Invitation created successfully.');
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.code === 'INVITE_PENDING' &&
        workspaceId
      ) {
        try {
          const existing = await findPendingInvitationByEmail(
            workspaceId,
            normalizedEmail,
          );
          if (existing) {
            setInviteResult(existing);
            setInviteMessage(
              'Invitation already pending. Re-share the existing link.',
            );
            return;
          }
        } catch {
          // If lookup fails, fall back to default error below.
        }
      }
      setInviteResult(null);
      setActionError(
        err instanceof Error ? err.message : 'Could not create invitation',
      );
    } finally {
      setInviting(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteResult?.inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteResult.inviteLink);
      setInviteMessage('Invite link copied.');
    } catch {
      setInviteMessage('Could not copy link. Copy it manually.');
    }
  }

  async function changeStatus(
    task: TaskRow,
    status: TaskRow['status'],
    reason?: string,
  ) {
    if (!workspaceId) return;
    setActionError(null);
    try {
      const body: { status: string; reason?: string } = { status };
      if (status === 'cancelled' && reason) body.reason = reason;
      await apiRequest(
        `/workspaces/${workspaceId}/tasks/${task.id}/status`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
      setCancelTaskId(null);
      setCancelReason('');
      await loadTasks(workspaceId, view);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Status update failed',
      );
    }
  }

  function confirmCancel() {
    if (!cancelTaskId || !cancelReason.trim()) return;
    const task = tasks.find((t) => t.id === cancelTaskId);
    if (task) void changeStatus(task, 'cancelled', cancelReason.trim());
  }

  async function openActivity(taskId: string) {
    if (!workspaceId) return;
    setActivityTaskId(taskId);
    setActivityError(null);
    setActivityLoading(true);
    try {
      const res = await apiRequest<{ items: TaskActivityRow[] }>(
        `/workspaces/${workspaceId}/tasks/${taskId}/activity`,
        { method: 'GET' },
      );
      setActivityItems(res.items);
    } catch (err) {
      setActivityItems([]);
      setActivityError(
        err instanceof Error ? err.message : 'Could not load activity',
      );
    } finally {
      setActivityLoading(false);
    }
  }

  function closeActivity() {
    setActivityTaskId(null);
    setActivityItems([]);
    setActivityError(null);
  }

  const membersById = useMemo(() => {
    const map = new Map<string, MemberRow>();
    for (const m of members) map.set(m.userId, m);
    return map;
  }, [members]);

  if (loading || !user) {
    return (
      <main className="dashboard-page">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dash-header">
        <div>
          <h1>TaskBridge</h1>
          <p className="muted small">
            Signed in as <strong>{user.name}</strong> ({user.email})
          </p>
        </div>
        <div className="dash-header-actions">
          <Link href="/">Home</Link>
          <button type="button" className="linkish" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      {listError && <p className="error banner">{listError}</p>}
      {actionError && <p className="error banner">{actionError}</p>}

      <section className="panel">
        <h2>Workspace</h2>
        {workspaces.length > 0 ? (
          <label className="inline">
            Active workspace
            <select
              value={workspaceId ?? ''}
              onChange={(e) => onWorkspaceChange(e.target.value)}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.role})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="muted">No workspaces yet — create one below.</p>
        )}
        <form className="row-form" onSubmit={createWorkspace}>
          <input
            placeholder="New workspace name"
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
          />
          <button type="submit" disabled={creatingWs || !newWsName.trim()}>
            {creatingWs ? 'Creating…' : 'Create workspace'}
          </button>
        </form>
        {workspaceId && (
          <div className="invite-panel">
            <h3>Invitations</h3>
            {currentRole === 'admin' ? (
              <>
                <form className="row-form" onSubmit={createInvitation}>
                  <input
                    type="email"
                    placeholder="Invite by email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                  >
                    {inviting ? 'Sending…' : 'Send invite'}
                  </button>
                </form>
                {inviteResult && (
                  <div className="invite-result">
                    <p className="muted small">
                      Invite for <strong>{inviteResult.email}</strong>
                    </p>
                    <input readOnly value={inviteResult.inviteLink} />
                    <div className="task-actions">
                      <button type="button" onClick={copyInviteLink}>
                        Copy link
                      </button>
                      <Link href={inviteResult.inviteLink}>Open link</Link>
                    </div>
                  </div>
                )}
                {inviteMessage && <p className="muted small">{inviteMessage}</p>}
              </>
            ) : (
              <p className="muted small">
                Only workspace admins can send invitations.
              </p>
            )}
          </div>
        )}
      </section>

      {workspaceId && (
        <>
          <section className="panel">
            <h2>Create task</h2>
            <form className="task-form" onSubmit={createTask}>
              <label>
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                />
              </label>
              <label>
                Description (optional)
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </label>
              <div className="row-2">
                <label>
                  Assignee
                  <select
                    value={assigneeUserId}
                    onChange={(e) => setAssigneeUserId(e.target.value)}
                    required
                  >
                    <option value="">Select member</option>
                    {activeMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TaskRow['priority'])
                    }
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Due (optional)
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </label>
              <button type="submit" disabled={creatingTask}>
                {creatingTask ? 'Creating…' : 'Create task'}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Tasks ({total})</h2>
              <label className="inline">
                View
                <select
                  value={view}
                  onChange={(e) => setView(e.target.value as TaskView)}
                >
                  <option value="assigned_to_me">Assigned to me</option>
                  <option value="assigned_by_me">Assigned by me</option>
                  <option value="completed">Completed</option>
                  <option value="all">All</option>
                </select>
              </label>
            </div>

            {tasks.length === 0 ? (
              <p className="muted">No tasks in this view.</p>
            ) : (
              <ul className="task-list">
                {tasks.map((task) => (
                  <li key={task.id} className="task-card">
                    <div className="task-main">
                      <strong>{task.title}</strong>
                      <span className="badges">
                        <span className="badge">{task.status}</span>
                        <span className="badge subtle">{task.priority}</span>
                      </span>
                    </div>
                    {task.dueAt && (
                      <p className="muted small">
                        Due {new Date(task.dueAt).toLocaleString()}
                      </p>
                    )}
                    <TaskActions
                      task={task}
                      userId={user.id}
                      role={currentRole}
                      onStatus={changeStatus}
                      onOpenActivity={openActivity}
                      onCancelClick={(id) => {
                        setCancelTaskId(id);
                        setCancelReason('');
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {cancelTaskId && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal">
            <h3>Cancel task</h3>
            <p className="muted small">A reason is required to cancel.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason"
              rows={3}
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setCancelTaskId(null)}>
                Close
              </button>
              <button
                type="button"
                className="danger"
                onClick={confirmCancel}
                disabled={!cancelReason.trim()}
              >
                Cancel task
              </button>
            </div>
          </div>
        </div>
      )}

      {activityTaskId && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal activity-modal">
            <h3>Task activity</h3>
            {activityLoading ? (
              <p className="muted small">Loading activity…</p>
            ) : activityError ? (
              <p className="error">{activityError}</p>
            ) : activityItems.length === 0 ? (
              <p className="muted small">No activity recorded yet.</p>
            ) : (
              <ul className="activity-list">
                {activityItems.map((item) => (
                  <li key={item.id} className="activity-item">
                    <strong>{eventLabel(item.eventType)}</strong>
                    <p className="muted small">
                      {membersById.get(item.actorUserId)?.name || item.actorUserId}
                      {' · '}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <p className="muted small">{formatMeta(item.meta)}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions">
              <button type="button" onClick={closeActivity}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function TaskActions({
  task,
  userId,
  role,
  onStatus,
  onOpenActivity,
  onCancelClick,
}: {
  task: TaskRow;
  userId: string;
  role: MembershipRole;
  onStatus: (task: TaskRow, status: TaskRow['status'], reason?: string) => void;
  onOpenActivity: (taskId: string) => void;
  onCancelClick: (taskId: string) => void;
}) {
  const isAssignee = task.assigneeUserId === userId;
  const isCreator = task.creatorUserId === userId;
  const creatorOrAdmin = isCreator || role === 'admin';

  if (task.status === 'cancelled') {
    return <p className="muted small">Cancelled</p>;
  }

  return (
    <div className="task-actions">
      <button type="button" onClick={() => onOpenActivity(task.id)}>
        View activity
      </button>
      {isAssignee && task.status === 'open' && (
        <>
          <button
            type="button"
            onClick={() => onStatus(task, 'in_progress')}
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => onStatus(task, 'completed')}
          >
            Complete
          </button>
        </>
      )}
      {isAssignee && task.status === 'in_progress' && (
        <>
          <button type="button" onClick={() => onStatus(task, 'open')}>
            To do
          </button>
          <button
            type="button"
            onClick={() => onStatus(task, 'completed')}
          >
            Complete
          </button>
        </>
      )}
      {creatorOrAdmin && task.status === 'completed' && (
        <button type="button" onClick={() => onStatus(task, 'open')}>
          Reopen
        </button>
      )}
      {creatorOrAdmin &&
        (task.status === 'open' || task.status === 'in_progress') && (
          <button
            type="button"
            className="danger-outline"
            onClick={() => onCancelClick(task.id)}
          >
            Cancel
          </button>
        )}
    </div>
  );
}

function eventLabel(eventType: TaskActivityRow['eventType']): string {
  switch (eventType) {
    case 'created':
      return 'Task created';
    case 'updated':
      return 'Task updated';
    case 'assigned':
      return 'Assignee changed';
    case 'status_changed':
      return 'Status changed';
    case 'priority_changed':
      return 'Priority changed';
    case 'due_changed':
      return 'Due date changed';
    case 'completed':
      return 'Task completed';
    case 'reopened':
      return 'Task reopened';
    case 'cancelled':
      return 'Task cancelled';
    default:
      return eventType;
  }
}

function formatMeta(meta: Record<string, unknown>): string {
  const pairs = Object.entries(meta || {});
  if (pairs.length === 0) return 'No additional details.';
  return pairs
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' · ');
}
