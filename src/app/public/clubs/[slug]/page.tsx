import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { serverPublicRequest } from '@/lib/api';
import { formatRange, formatShortDay } from '@/lib/format';
import { Badge, LiveBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicFooter, PublicHeader } from '@/components/public/public-shell';

interface PublicClub {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  sessions: Array<{
    publicId: string;
    name: string;
    startsAt: string;
    endsAt: string;
    status: string;
    format: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const club = await serverPublicRequest<PublicClub>(`/api/v1/public/clubs/${slug}`);
  return {
    title: club ? `${club.name} — Sessions` : 'Club sessions',
    description: club?.description ?? undefined,
  };
}

export default async function PublicClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await serverPublicRequest<PublicClub>(`/api/v1/public/clubs/${slug}`);
  if (!club) notFound();

  return (
    <div className="min-h-dvh bg-background">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
        <div className="relative overflow-hidden rounded-[1.8rem] bg-forest px-6 py-9 text-white sm:px-8">
          <div className="pickle-pattern absolute inset-0 opacity-30" />
          <div className="relative">
            <Badge tone="lime">Public club page</Badge>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">
              {club.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              {club.description ?? 'Join this club’s open play sessions.'}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/45">
              <MapPin className="size-3.5" /> {club.location ?? 'Location to be confirmed'}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-2xl font-bold">Sessions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Published sessions from this club.</p>
          {club.sessions.length > 0 ? (
            <div className="mt-4 space-y-3">
              {club.sessions.map((session) => (
                <Link
                  key={session.publicId}
                  href={`/public/sessions/${session.publicId}`}
                  className="group flex flex-wrap items-center gap-4 rounded-[1.35rem] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="grid size-11 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
                    <CalendarDays className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {session.status === 'LIVE' ? (
                        <LiveBadge />
                      ) : (
                        <Badge tone="neutral">{session.status.toLowerCase()}</Badge>
                      )}
                      <Badge tone="neutral">
                        {session.format === 'DOUBLES' ? 'Doubles' : 'Singles'}
                      </Badge>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-bold">{session.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDay(session.startsAt)} ·{' '}
                      {formatRange(session.startsAt, session.endsAt)}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.35rem] border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
              No published sessions right now. Check back soon.
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/50 p-5">
          <p className="text-sm font-semibold text-[#385513]">
            Want a public session page for your club?
          </p>
          <Button asChild variant="dark" size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
