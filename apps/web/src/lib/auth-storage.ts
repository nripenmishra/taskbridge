'use client';

const ACCESS = 'tb_access_token';
const REFRESH = 'tb_refresh_token';
const USER = 'tb_user';
const WORKSPACE = 'tb_workspace_id';

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
};

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function getStoredWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(WORKSPACE);
}

export function setAuthSession(data: {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
}): void {
  localStorage.setItem(ACCESS, data.accessToken);
  localStorage.setItem(REFRESH, data.refreshToken);
  localStorage.setItem(USER, JSON.stringify(data.user));
}

export function setWorkspaceId(id: string | null): void {
  if (id) localStorage.setItem(WORKSPACE, id);
  else localStorage.removeItem(WORKSPACE);
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
  localStorage.removeItem(WORKSPACE);
}
