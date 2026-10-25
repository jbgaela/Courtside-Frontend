'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarPlus,
  ChevronRight,
  Clock3,
  Compass,
  ListOrdered,
  MapPin,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth, useIsAdmin } from '@/lib/auth';
import { useLive, useStats, useUpcoming, invalidateSessionQueries } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { useLastSeen } from '@/hooks/use-last-seen';
import {
  firstName,
  formatDay,
  formatRange,
  formatShortDay,
  greeting,
  relativeTime,
} from '@/lib/format';
import type { LiveSnapshot } from '@/lib/types';
import { PageHeader, SectionHeading } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, LiveBadge } from '@/components/ui/badge';
import { AvatarStack } from '@/components/ui/avatar';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { UpcomingSessionCard } from '@/components/session/session-card';
import { ConnectionPill } from '@/components/system/offline-banner';

function LiveSummary({ snapshot, userId }: { snapshot: LiveSnapshot; userId: string }) {
  const { session, queue, matches, courts } = snapshot;
  const myMatch = matches.find((match) =>
    [...match.teams.A, ...match.teams.B].some((player) => player.userId === userId),
  );
  const self = queue.self;
  const myTeam = myMatch
    ? myMatch.teams.A.some((player) => player.userId === userId)
      ? myMatch.teams.A
      : myMatch.teams.B
    : [];
  const opposingTeam = myMatch
    ? myMatch.teams.A.some((player) => player.userId === userId)
      ? myMatch.teams.B
      : myMatch.teams.A
    : [];
  const partnerName = myTeam
    .filter((player) => player.userId !== userId)
    .map((player) => firstName(player.displayName))
    .join(' + ');

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-forest px-5 py-4 text-white">
        <div className="min-w-0">
          <p className="truncate text-[0.62rem] font-bold uppercase tracking-[0.16em] text-lime">
            {session.club?.name ?? 'Club session'}
          </p>
          <h2 className="mt-0.5 truncate font-display text-lg font-bold">{session.name}</h2>
        </div>
        <LiveBadge />
      </div>
      <CardContent className="p-5">
        {myMatch ? (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                You are on {myMatch.court.name}
              </p>
              <span className="text-[0.65rem] font-semibold text-success">In play</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <p className="truncate text-sm font-bold">
                  {partnerName ? `You + ${partnerName}` : 'You'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  vs {opposingTeam.map((player) => firstName(player.displayName)).join(' + ')}
                </p>
              </div>
              <div className="flex items-end gap-1.5 tabular">
                <span className="font-display text-4xl font-extrabold leading-none">
                  {myMatch.currentGame.a}
                </span>
                <span className="pb-1 text-muted-foreground">â€“</span>
                <span className="font-display text-4xl font-extrabold leading-none">
                  {myMatch.currentGame.b}
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link href={`/app/matches/${myMatch.id}`}>
                  Open match <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/sessions/${session.id}`}>Session details</Link>
              </Button>
            </div>
          </div>
        ) : self ? (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Your place in line
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-6xl font-extrabold leading-none tracking-[-0.05em] text-primary">
                    {self.position
                      ? `#${self.position}`
                      : self.state === 'PLAYING'
                        ? 'On court'
                        : 'â€”'}
                  </span>
                  {self.estimatedWaitMinutes !== null && self.position ? (
                    <span className="rounded-full bg-lime-soft px-2.5 py-1 text-[0.65rem] font-bold text-[#47641d]">
                      {self.estimatedWaitMinutes === 0
                        ? 'Next up'
                        : `~${self.estimatedWaitMinutes} min`}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {self.state === 'WAITING'
                    ? `Waiting ${self.waitingMinutes} min Â· ${self.gamesPlayed} game${self.gamesPlayed === 1 ? '' : 's'} played`
                    : self.state === 'PAUSED'
                      ? 'Your queue participation is paused'
                      : 'Waiting for the next rotation'}
                </p>
              </div>
              <div className="flex -space-x-2">
                <AvatarStack
                  names={queue.queue
                    .filter((entry) => entry.userId !== userId && entry.state === 'WAITING')
                    .slice(0, 3)
                    .map((entry) => entry.displayName)}
                  max={3}
                  size="sm"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button asChild size="sm">
                <Link href="/app/queue">
                  <ListOrdered className="size-3.5" /> View my queue
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/sessions/${session.id}`}>Session details</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-display text-lg font-bold">The session is live</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You are not in the queue yet. Open the session to register or check in.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href={`/app/sessions/${session.id}`}>Join the session</Link>
            </Button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-[0.68rem] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {queue.counts.checkedIn} checked in
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> {queue.counts.waiting} waiting
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {courts.length} courts
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveSection({ sessionId, userId }: { sessionId: string; userId: string }) {
  const queryClient = useQueryClient();
  const live = useLive(sessionId);
  const cached = useLastSeen<LiveSnapshot>(`pq.lastSeen.live.${sessionId}`, live.data);
  const status = useSessionEvents({
    sessionId,
    onEvent: () => invalidateSessionQueries(queryClient, sessionId),
    onRecover: () => invalidateSessionQueries(queryClient, sessionId),
  });

  if (live.isLoading) {
    return (
      <Card className="h-64 animate-pulse bg-card">
        <div className="h-full rounded-[1.35rem] bg-secondary/50" />
      </Card>
    );
  }
  if (live.isError && !cached) {
    return (
      <ErrorState
        title="Could not load the live session"
        error={live.error}
        onRetry={() => void live.refetch()}
      />
    );
  }
  const snapshot = live.data ?? cached?.data;
  if (!snapshot) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <ConnectionPill status={status} />
        <span className="text-[0.65rem] text-muted-foreground">
          {live.data
            ? 'Live from the courts'
            : `Last seen ${cached ? relativeTime(cached.savedAt) : 'earlier'}`}
        </span>
      </div>
      <LiveSummary snapshot={snapshot} userId={userId} />
    </div>
  );
}

export default function PlayerHomePage() {
  const { me } = useAuth();
  const isAdmin = useIsAdmin();
  const upcoming = useUpcoming();
  const stats = useStats();
  const clubs = me?.memberships ?? [];
  const liveSession = upcoming.data?.find((session) => session.status === 'LIVE');
  const checkInSession = upcoming.data?.find(
    (session) => session.status === 'CHECK_IN_OPEN' || session.registrationStatus === 'REGISTERED',
  );

  if (!me) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatDay(new Date().toISOString())}
        title={
          <>
            {greeting()},{' '}
            <span className="text-[#47671b]">{firstName(me.profile?.displayName ?? me.name)}</span>
          </>
        }
        description="Your next game, your queue, and everything happening at the club."
        actions={
          isAdmin ? (
            <Button asChild variant="outline">
              <Link href="/manage">
                <Sparkles className="size-4" /> Queue Master view
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/app/discover">
                <Compass className="size-4" /> Find a club
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          {upcoming.isLoading ? (
            <Card className="h-64 animate-pulse bg-card">
              <div className="h-full rounded-[1.35rem] bg-secondary/50" />
            </Card>
          ) : liveSession ? (
            <LiveSection sessionId={liveSession.sessionId} userId={me.id} />
          ) : (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between bg-forest px-5 py-4 text-white">
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-lime">
                    Next up
                  </p>
                  <h2 className="font-display text-lg font-bold">
                    {checkInSession ? checkInSession.name : 'No live session right now'}
                  </h2>
                </div>
                <PickleballMini />
              </div>
              <CardContent className="p-5">
                {checkInSession ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Check-in is open. Get in before the first rotation is generated.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="success" dot>
                        {checkInSession.registrationStatus}
                      </Badge>
                      <Badge tone="neutral">{checkInSession.queueState ?? 'Not checked in'}</Badge>
                    </div>
                    <Button asChild size="sm" className="mt-4">
                      <Link href={`/app/sessions/${checkInSession.sessionId}`}>
                        Open session <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Find a club or register for an upcoming session. Your queue will appear here
                      as soon as a session goes live.
                    </p>
                    <Button asChild size="sm" className="mt-4">
                      <Link href="/app/discover">
                        Discover clubs <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div>
            <SectionHeading
              title="Upcoming sessions"
              description="Your registrations across every club."
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/app/discover">
                    Discover <ChevronRight className="size-3.5" />
                  </Link>
                </Button>
              }
            />
            {upcoming.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-36 animate-pulse rounded-[1.35rem] bg-secondary/60" />
                <div className="h-36 animate-pulse rounded-[1.35rem] bg-secondary/60" />
              </div>
            ) : upcoming.data && upcoming.data.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {upcoming.data
                  .filter((session) => session.status !== 'LIVE')
                  .slice(0, 4)
                  .map((session) => (
                    <UpcomingSessionCard
                      key={session.sessionId}
                      session={session}
                      href={`/app/sessions/${session.sessionId}`}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No sessions on the calendar"
                description="Join a club to see its open play schedule, or create a club of your own."
                icon={<CalendarPlus className="size-5" />}
                action={
                  <Button asChild size="sm">
                    <Link href="/app/discover">Browse clubs</Link>
                  </Button>
                }
              />
            )}
          </div>

          {liveSession ? (
            <div>
              <SectionHeading title="Live courts" description="At your current session." />
              <div className="grid gap-3 sm:grid-cols-2">
                {(liveSession.courts ?? []).slice(0, 4).map((court) => (
                  <div
                    key={court.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold">{court.name}</p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {court.status === 'IN_USE' ? 'In play' : 'Open'}
                      </p>
                    </div>
                    <Badge tone={court.status === 'IN_USE' ? 'lime' : 'success'} dot>
                      {court.status === 'IN_USE' ? 'Live' : 'Available'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Player record
                </p>
                <Trophy className="size-4 text-[#47671b]" />
              </div>
              {stats.isLoading ? (
                <div className="mt-3 h-24 animate-pulse rounded-xl bg-secondary/60" />
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold tabular">
                      {stats.data?.winRate ?? 0}%
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">win rate</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      ['Games', stats.data?.matchesPlayed ?? 0],
                      ['Wins', stats.data?.wins ?? 0],
                      ['Sessions', stats.data?.sessionsAttended ?? 0],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-secondary/70 py-2">
                        <p className="font-display text-base font-bold tabular">{value}</p>
                        <p className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link href="/app/profile">View profile & stats</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Your clubs
                </p>
                <Users className="size-4 text-[#47671b]" />
              </div>
              {clubs.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {clubs.slice(0, 3).map((club) => (
                    <Link
                      key={club.clubId}
                      href={`/app/clubs/${club.clubSlug}`}
                      className="flex items-center justify-between rounded-xl border border-border/80 px-3 py-2.5 transition-colors hover:bg-secondary/50"
                    >
                      <div>
                        <p className="text-xs font-bold">{club.clubName}</p>
                        <p className="text-[0.6rem] text-muted-foreground">
                          {club.role === 'OWNER'
                            ? 'Owner'
                            : club.role === 'QUEUE_MASTER'
                              ? 'Queue Master'
                              : 'Player'}
                        </p>
                      </div>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  You have not joined a club yet. Discover open play near you.
                </p>
              )}
              <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                <Link href="/app/discover">
                  <Compass className="size-3.5" /> Discover clubs
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/60 p-5">
            <Sparkles className="size-5 text-[#486b1c]" />
            <p className="mt-2 font-display text-base font-bold text-[#385513]">
              How rotation works
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
              Fewest games first. Then the longest wait. Skill and balance decide the teams â€”
              never who gets left out.
            </p>
            <Link
              href="/app/queue"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#385513] hover:underline"
            >
              Open my queue <ArrowRight className="size-3" />
            </Link>
          </div>
        </aside>
      </div>

      {upcoming.data && upcoming.data.length > 0 ? (
        <div className="rounded-[1.35rem] border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
                <Clock3 className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold">Session timing</p>
                <p className="text-xs text-muted-foreground">
                  {formatShortDay(upcoming.data[0]!.startsAt, upcoming.data[0]!.timezone)} Â·{' '}
                  {formatRange(
                    upcoming.data[0]!.startsAt,
                    upcoming.data[0]!.endsAt,
                    upcoming.data[0]!.timezone,
                  )}
                </p>
              </div>
            </div>
            <Badge tone="neutral">{upcoming.data[0]!.club.name}</Badge>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PickleballMini() {
  return (
    <span className="grid size-10 place-items-center rounded-full bg-lime/15">
      <span className="relative block size-6 rounded-full bg-lime">
        <span className="absolute left-1.5 top-1.5 size-1 rounded-full bg-forest/30" />
        <span className="absolute right-1 top-2.5 size-1 rounded-full bg-forest/25" />
        <span className="absolute bottom-1.5 left-2.5 size-1 rounded-full bg-forest/25" />
      </span>
    </span>
  );
}
