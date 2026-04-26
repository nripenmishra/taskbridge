'use client';

import { getApiBase } from './config';
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthSession,
  type StoredUser,
} from './auth-storage';

type ApiErrorBody = {
  message?: string;
  code?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: unknown;

  constructor(
    message: string,
    status: number,
    options?: { code?: string; body?: unknown },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code;
    this.body = options?.body;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  const b = body as ApiErrorBody | undefined;
  const msg =
    (typeof b?.message === 'string' && b.message) ||
    res.statusText ||
    `Request failed (${res.status})`;
  return new ApiError(msg, res.status, {
    code: typeof b?.code === 'string' ? b.code : undefined,
    body,
  });
}

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
};

async function tryRefresh(): Promise<string | null> {
  const refresh = getStoredRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${getApiBase()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    clearAuthSession();
    return null;
  }
  const data = (await res.json()) as AuthResponse;
  setAuthSession(data);
  return data.accessToken;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${getApiBase()}${path.startsWith('/') ? '' : '/'}${path}`;
  const token = getStoredAccessToken();

  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401 && retry && getStoredRefreshToken()) {
    const next = await tryRefresh();
    if (next) {
      return apiRequest<T>(path, init, false);
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
