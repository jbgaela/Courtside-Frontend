import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverPublicRequest } from '@/lib/api';
import type { PublicSession } from '@/lib/types';
import { PublicSessionView } from '@/components/public/public-session-view';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const session = await serverPublicRequest<PublicSession>(`/api/v1/public/sessions/${publicId}`);
  if (!session) return { title: 'Public session' };
  return {
    title: `${session.name} — ${session.club.name}`,
    description: `Live scores, courts and results for ${session.name} at ${session.club.name}.`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicSessionPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const session = await serverPublicRequest<PublicSession>(`/api/v1/public/sessions/${publicId}`);
  if (!session) notFound();
  return <PublicSessionView initialData={session} />;
}
