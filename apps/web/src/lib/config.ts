export function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
    'http://localhost:4000/v1'
  );
}
