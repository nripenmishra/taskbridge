'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { getStoredUser } from '@/lib/auth-storage';

type AcceptResponse = {
  workspaceId: string;
};

export default function AcceptInvitationPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [tokenReady, setTokenReady] = useState(false);
  const [status, setStatus] = useState<
    'missing_token' | 'needs_auth' | 'loading' | 'success' | 'error'
  >('loading');
  const [message, setMessage] = useState<string>('');

  const nextUrl = useMemo(
    () => `/invitations/accept?token=${encodeURIComponent(token)}`,
    [token],
  );

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') ?? '';
    setToken(t);
    setTokenReady(true);
  }, []);

  useEffect(() => {
    if (!tokenReady) return;
    if (!token) {
      setStatus('missing_token');
      setMessage('Invite token is missing.');
      return;
    }

    const user = getStoredUser();
    if (!user) {
      setStatus('needs_auth');
      setMessage('Please sign in or register to accept this invitation.');
      return;
    }

    let cancelled = false;
    (async () => {
      setStatus('loading');
      setMessage('Accepting invitation…');
      try {
        await apiRequest<AcceptResponse>('/invitations/accept', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        if (!cancelled) {
          setStatus('success');
          setMessage('Invitation accepted. You can now open your dashboard.');
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setMessage(
            e instanceof Error ? e.message : 'Could not accept invitation.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, tokenReady]);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Workspace invitation</h1>
        <p className="muted">{message}</p>

        {status === 'needs_auth' && (
          <div className="task-actions">
            <Link href={`/login?next=${encodeURIComponent(nextUrl)}`}>
              Sign in
            </Link>
            <Link href={`/register?next=${encodeURIComponent(nextUrl)}`}>
              Register
            </Link>
          </div>
        )}

        {status === 'success' && (
          <div className="task-actions">
            <button type="button" onClick={() => router.replace('/dashboard')}>
              Open dashboard
            </button>
          </div>
        )}

        {(status === 'error' || status === 'missing_token') && (
          <p className="muted small">
            If this looks wrong, ask your workspace admin to send a new invite.
          </p>
        )}
      </div>
    </main>
  );
}
