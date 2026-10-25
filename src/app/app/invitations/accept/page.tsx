import { AcceptInvitation } from '@/components/auth/accept-invitation';

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  return <AcceptInvitation token={token} />;
}
