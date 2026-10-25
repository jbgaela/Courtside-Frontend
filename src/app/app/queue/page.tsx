'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  ListOrdered,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Trophy,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useLive, useUpcoming, invalidateSessionQueries } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { useLastSeen } from '@/hooks/use-last-seen';
import type { LiveSnapshot } from '@/lib/types';
import { formatRange, formatShortDay, queueLabel, relativeTime } from '@/lib/format';
import { PageHeader, StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, LiveBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { UpcomingSessionCard } from '@/components/session/session-card';
import { ConnectionPill } from '@/components/system/offline-banner';

function QueueBoard({ snapshot, sessionId }: { snapshot: LiveSnapshot; sessionId: string }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const self = snapshot.queue.self;
  const myMatch = snapshot.matches.find((match) =>
    [...match.teams.A, ...match.teams.B].some((player) => player.userId === self?.userId),
  );

  const toggle = async (paused: boolean) => {
    setBusy(true);
    try {
      await api.post(`/api/v1/sessions/${sessionId}/queue/${paused ? 'pause' : 'resume'}`, {});
      await invalidateSessionQueries(queryClient, sessionId);
      toast.success(paused ? 'Queue paused' : 'Back in the queue');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update your queue');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between bg-forest px-5 py-4 text-white">
          <div className="min-w-0">
            <p className="truncate text-[0.62rem] font-bold uppercase tracking-[0.16em] text-lime">
              {snapshot.session.club?.name}
            </p>
            <h2 className="truncate font-display text-lg font-bold">{snapshot.session.name}</h2>
          </div>
          <LiveBadge />
        </div>
        <CardContent className="p-5 sm:p-6">
          {myMatch ? (
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                You are playing now
              </p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-bold">{myMatch.court.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[...myMatch.teams.A, ...myMatch.teams.B]
                      .filter((player) => player.userId !== self?.userId)
                      .map((player) => player.displayName)
                      .join(' Â· ')}
                  </p>
                </div>
                <div className="tabular font-display text-5xl font-extrabold">
                  {myMatch.currentGame.a}
                  <span className="mx-1.5 text-xl text-muted-foreground">â€“</span>
                  {myMatch.currentGame.b}
                </div>
              </div>
              <Button asChild size="sm" className="mt-4">
                <Link href={`/app/matches/${myMatch.id}`}>
                  View match <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          ) : self ? (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Your position
                  </p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span
                      className={
                        self.state === 'PAUSED'
                          ? 'font-display text-4xl font-extrabold leading-none tracking-[-0.04em] text-muted-foreground'
                          : 'font-display text-7xl font-extrabold leading-none tracking-[-0.055em] text-primary'
                      }
                    >
                      {self.state === 'PAUSED'
                        ? 'Paused'
                        : self.position
                          ? `#${self.position}`
                          : 'â€”'}
                    </span>
                    {self.estimatedWaitMinutes !== null ? (
                      <div>
                        <p className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
                          Estimated wait
                        </p>
                        <p className="font-display text-lg font-extrabold text-[#47671b]">
                          {self.estimatedWaitMinutes === 0
                            ? 'Next up'
                            : `${self.estimatedWaitMinutes} min`}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {self.gamesPlayed} game{self.gamesPlayed === 1 ? '' : 's'} played Â· waiting{' '}
                    {self.waitingMinutes} min
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void toggle(self.state !== 'PAUSED')}
                    disabled={busy || !['WAITING', 'RESTING', 'PAUSED'].includes(self.state)}
                  >
                    {busy ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : self.state === 'PAUSED' ? (
                      <Play className="size-3.5" />
                    ) : (
                      <Pause className="size-3.5" />
                    )}
                    {self.state === 'PAUSED' ? 'Resume' : 'Pause'}
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/app/sessions/${sessionId}`}>Session</Link>
                  </Button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Queue progress</span>
                  <Badge
                    tone={
                      self.state === 'PAUSED' ? 'warning' : self.position === 1 ? 'lime' : 'info'
                    }
                    dot
                  >
                    {queueLabel(self.state)}
                  </Badge>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-[#8ecb3a] transition-all"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.min(
                          100,
                          self.position && snapshot.queue.counts.waiting > 0
                            ? 100 - ((self.position - 1) / snapshot.queue.counts.waiting) * 100
                            : 15,
                        ),
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[0.65rem] text-muted-foreground">
                  {self.position
                    ? `${Math.max(0, self.position - 1)} player${self.position === 2 ? '' : 's'} ahead of you`
                    : 'Waiting for the next match assignment'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-display text-lg font-bold">You are not in this queue</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open the session to register and check in.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href={`/app/sessions/${sessionId}`}>Open session</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          label="Checked in"
          value={snapshot.queue.counts.checkedIn}
          accent
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Waiting"
          value={snapshot.queue.counts.waiting}
          icon={<ListOrdered className="size-4" />}
        />
        <StatCard
          label="On court"
          value={snapshot.queue.counts.playing}
          icon={<Trophy className="size-4" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Waiting list</h2>
              <Badge tone="neutral">
                {snapshot.queue.queue.filter((entry) => entry.state === 'WAITING').length} players
              </Badge>
            </div>
            <div className="mt-3 space-y-1.5">
              {snapshot.queue.queue
                .filter((entry) => entry.state === 'WAITING')
                .map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                      entry.userId === self?.userId ? 'bg-lime-soft/70' : 'bg-secondary/50'
                    }`}
                  >
                    <span className="w-7 font-display text-sm font-extrabold text-muted-foreground tabular">
                      {entry.position}
                    </span>
                    <Avatar name={entry.displayName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">
                        {entry.displayName}
                        {entry.userId === self?.userId ? ' (you)' : ''}
                      </p>
                      <p className="text-[0.6rem] text-muted-foreground">
                        {entry.gamesPlayed} games Â· {entry.waitingMinutes}m wait
                      </p>
                    </div>
                    <Badge tone="neutral">{entry.skillRating.toFixed(2)}</Badge>
                  </div>
                ))}
              {snapshot.queue.queue.filter((entry) => entry.state === 'WAITING').length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  The waiting list is clear.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-display text-lg font-bold">Courts</h2>
            <div className="mt-3 space-y-2">
              {snapshot.courts.map((court) => (
                <div
                  key={court.id}
                  className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-bold">{court.name}</p>
                    <p className="text-[0.6rem] text-muted-foreground">
                      {court.match
                        ? court.match.teams.A.map(
                            (player) => player.displayName.split(' ')[0],
                          ).join(' + ') +
                          ' vs ' +
                          court.match.teams.B.map(
                            (player) => player.displayName.split(' ')[0],
                          ).join(' + ')
                        : 'Ready for next match'}
                    </p>
                  </div>
                  <Badge tone={court.match ? 'lime' : 'success'} dot>
                    {court.match ? 'Live' : 'Open'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function MyQueuePage() {
  const queryClient = useQueryClient();
  const upcoming = useUpcoming();
  const liveSession = upcoming.data?.find((session) => session.status === 'LIVE');
  const live = useLive(liveSession?.sessionId);
  const cached = useLastSeen<LiveSnapshot>(
    liveSession ? `pq.lastSeen.live.${liveSession.sessionId}` : 'pq.lastSeen.live.none',
    live.data,
  );
  const status = useSessionEvents({
    sessionId: liveSession?.sessionId,
    enabled: Boolean(liveSession),
    onEvent: () => {
      if (liveSession) invalidateSessionQueries(queryClient, liveSession.sessionId);
    },
    onRecover: () => {
      if (liveSession) invalidateSessionQueries(queryClient, liveSession.sessionId);
    },
  });

  if (upcoming.isLoading) return <PageSkeleton />;
  if (upcoming.isError && !cached) {
    return <ErrorState error={upcoming.error} onRetry={() => void upcoming.refetch()} />;
  }

  if (!liveSession) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="My Queue"
          title="No live session right now"
          description="When your session goes live, your position, wait estimate and court assignment appear here."
        />
        {upcoming.data && upcoming.data.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.data.map((session) => (
              <UpcomingSessionCard
                key={session.sessionId}
                session={session}
                href={`/app/sessions/${session.sessionId}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No sessions in your queue"
            description="Register for open play to join the rotation."
            icon={<CalendarCheck className="size-5" />}
            action={
              <Button asChild size="sm">
                <Link href="/app/discover">Discover clubs</Link>
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const snapshot = live.data ?? cached?.data;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My Queue"
        title="Your place in line"
        description={`${liveSession.name} Â· ${formatShortDay(liveSession.startsAt, liveSession.timezone)} Â· ${formatRange(liveSession.startsAt, liveSession.endsAt, liveSession.timezone)}`}
        actions={
          <div className="flex items-center gap-2">
            <ConnectionPill status={status} />
            <Button variant="outline" size="sm" onClick={() => void live.refetch()}>
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          </div>
        }
      />

      {!snapshot ? (
        <ErrorState error={live.error} onRetry={() => void live.refetch()} />
      ) : (
        <>
          {!live.data && cached ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] px-4 py-3 text-xs font-medium text-[#7a520c]">
              <Clock3 className="size-4" /> Offline snapshot from {relativeTime(cached.savedAt)}.
              Scores and positions may have changed.
            </div>
          ) : null}
          <QueueBoard snapshot={snapshot} sessionId={liveSession.sessionId} />
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="outline">
          <Link href={`/app/sessions/${liveSession.sessionId}`}>
            <MapPin className="size-4" /> Session details
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/matches">
            <Trophy className="size-4" /> Live matches
          </Link>
        </Button>
      </div>
    </div>
  );
}
