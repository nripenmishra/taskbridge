import { redirect } from 'next/navigation';

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  redirect(`/invitations/accept?token=${encodeURIComponent(token)}`);
}
