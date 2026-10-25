import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverPublicRequest } from '@/lib/api';
import type { PublicSession } from '@/lib/types';
import { PublicScoreboardView } from '@/components/public/public-scoreboard-view';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const session = await serverPublicRequest<PublicSession>(`/api/v1/public/sessions/${publicId}`);
  return { title: session ? `${session.name} — Live scoreboard` : 'Live scoreboard' };
}

export default async function PublicScoreboardPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const session = await serverPublicRequest<PublicSession>(`/api/v1/public/sessions/${publicId}`);
  if (!session) notFound();
  return <PublicScoreboardView initialData={session} />;
}
