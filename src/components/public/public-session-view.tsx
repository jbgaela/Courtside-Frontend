'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  MonitorPlay,
  Share2,
  Trophy,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePublicSession, queryKeys } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { useLastSeen } from '@/hooks/use-last-seen';
import type { PublicSession } from '@/lib/types';
import { formatDay, formatRange, relativeTime } from '@/lib/format';
import { Badge, LiveBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicHeader, PublicFooter } from './public-shell';
import { PublicMatchCard } from './public-match-card';

export function PublicSessionView({ initialData }: { initialData: PublicSession }) {
  const queryClient = useQueryClient();
  const session = usePublicSession(initialData.id, initialData);
  const cached = useLastSeen<PublicSession>(`pq.lastSeen.public.${initialData.id}`, session.data);
  const status = useSessionEvents({
    publicId: initialData.id,
    onEvent: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.publicSession(initialData.id) });
    },
    onRecover: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.publicSession(initialData.id) });
    },
  });
  const data = session.data ?? cached?.data ?? initialData;
  const liveMatches = data.matches.filter((match) => match.status === 'IN_PROGRESS');
  const upcoming = data.matches.filter((match) => match.status !== 'IN_PROGRESS');

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Session link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span
              className={`size-1.5 rounded-full ${status === 'live' ? 'bg-[#71b51b] live-dot' : 'bg-muted-foreground/50'}`}
            />
            {status === 'live'
              ? 'Live updates on'
              : status === 'offline'
                ? 'Connection lost'
                : 'Connecting'}
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/public/sessions/${data.id}/scoreboard`}>
                <MonitorPlay className="size-3.5" /> Scoreboard
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void share()}>
              <Share2 className="size-3.5" /> Share
            </Button>
          </div>
        </div>

        {!session.data && cached ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] px-3.5 py-2.5 text-xs text-[#7a520c]">
            <WifiOff className="size-3.5" /> Offline â€” showing the last snapshot from{' '}
            {relativeTime(cached.savedAt)}. Scores may have changed.
          </div>
        ) : null}

        <div className="relative mt-3 overflow-hidden rounded-[1.8rem] bg-forest px-5 py-7 text-white sm:px-8 sm:py-9">
          <div className="pickle-pattern absolute inset-0 opacity-30" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {data.status === 'LIVE' ? (
                  <LiveBadge />
                ) : (
                  <Badge tone="neutral">{data.status.toLowerCase()}</Badge>
                )}
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-lime">
                  {data.club.name}
                </span>
              </div>
              <h1 className="mt-3 text-balance font-display text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">
                {data.name}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" /> {formatDay(data.startsAt, data.timezone)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />{' '}
                  {formatRange(data.startsAt, data.endsAt, data.timezone)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {data.venue ?? data.club.location ?? 'Venue TBA'}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Players', data.counts.checkedIn],
                ['Waiting', data.counts.waiting],
                ['Courts', data.counts.courts],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-20 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-center"
                >
                  <p className="font-display text-2xl font-extrabold tabular">{value}</p>
                  <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-white/40">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.courts.map((court) => (
            <div
              key={court.id}
              className="rounded-[1.35rem] border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-bold">{court.name}</p>
                <Badge tone={court.match ? 'lime' : 'success'} dot>
                  {court.match ? 'Live' : 'Open'}
                </Badge>
              </div>
              {court.match ? (
                <div className="mt-3">
                  {(['A', 'B'] as const).map((team) => (
                    <div key={team} className="flex items-center gap-2 py-0.5">
                      <p className="min-w-0 flex-1 truncate text-xs font-semibold">
                        {court.match!.teams[team].map((player) => player.name).join(' + ')}
                      </p>
                      <span className="tabular font-display text-2xl font-extrabold">
                        {team === 'A' ? court.match!.currentGame.a : court.match!.currentGame.b}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">Waiting for the next rotation.</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Live scores</h2>
              {liveMatches.length > 0 ? <Badge tone="lime">{liveMatches.length} live</Badge> : null}
            </div>
            {liveMatches.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {liveMatches.map((match) => (
                  <PublicMatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-border bg-card/60 p-8 text-center">
                <Trophy className="mx-auto size-5 text-[#47671b]" />
                <p className="mt-2 text-sm font-bold">No matches in progress</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The next rotation will appear here as soon as it is committed.
                </p>
              </div>
            )}

            {upcoming.length > 0 ? (
              <div className="mt-6">
                <h2 className="mb-3 font-display text-xl font-bold">Upcoming matches</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {upcoming.map((match) => (
                    <PublicMatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Results</h2>
              <Badge tone="neutral">{data.results.length}</Badge>
            </div>
            {data.results.length > 0 ? (
              <div className="space-y-3">
                {data.results.slice(0, 6).map((match) => (
                  <PublicMatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-border bg-card/60 p-6 text-center text-xs text-muted-foreground">
                Completed results will appear here.
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[1.5rem] border border-[#d9edb2] bg-lime-soft/50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-bold text-[#385513]">
              Run open play like this.
            </p>
            <p className="mt-0.5 text-xs text-[#3e5716]">
              Fair rotations, live scores and public links, built for clubs.
            </p>
          </div>
          <Button asChild variant="dark">
            <Link href="/sign-up">
              Create your club <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
