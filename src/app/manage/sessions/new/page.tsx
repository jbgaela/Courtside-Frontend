import { SessionWizard } from '@/components/manage/session-wizard';

export const metadata = { title: 'New session' };

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string | string[] }>;
}) {
  const params = await searchParams;
  const club = typeof params.club === 'string' ? params.club : undefined;
  return <SessionWizard initialClubId={club} />;
}
