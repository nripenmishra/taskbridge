import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="dashboard-page">
      <h1 style={{ marginTop: 0 }}>TaskBridge</h1>
      <p className="muted">
        Local test dashboard: sign in, pick or create a workspace, then create
        and move tasks through the API.
      </p>
      <p>
        <Link href="/login">Sign in</Link>
        {' · '}
        <Link href="/register">Register</Link>
        {' · '}
        <Link href="/dashboard">Dashboard</Link> (requires login)
      </p>
    </main>
  );
}
