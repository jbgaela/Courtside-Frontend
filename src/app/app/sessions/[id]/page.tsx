'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  LogOut,
  MapPin,
  Pause,
  Play,
  QrCode,
  Share2,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth, useIsAdmin } from '@/lib/auth';
import { useLive, useRotation, useSession, invalidateSessionQueries } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { formatDay, formatRange, formatShortDay, queueLabel, skillLabel } from '@/lib/format';
import { StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { SessionStatusBadge } from '@/components/session/status';
import { MatchScoreCard } from '@/components/match/score-card';
import { ConnectionPill } from '@/components/system/offline-banner';

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me } = useAuth();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const sessionQuery = useSession(id);
  const session = sessionQuery.data;
  const live = useLive(session?.status === 'LIVE' ? id : undefined);
  const rotation = useRotation(session?.status === 'LIVE' ? id : undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const status = useSessionEvents({
    sessionId: session?.status === 'LIVE' ? id : undefined,
    enabled: session?.status === 'LIVE',
    onEvent: () => invalidateSessionQueries(queryClient, id),
    onRecover: () => invalidateSessionQueries(queryClient, id),
  });

  if (sessionQuery.isLoading) return <PageSkeleton />;
  if (sessionQuery.isError || !session) {
    return (
      <ErrorState
        title="Session unavailable"
        error={sessionQuery.error}
        onRetry={() => void sessionQuery.refetch()}
      />
    );
  }

  const registration = session.viewerRegistration;
  const queueState = live.data?.queue.self?.state ?? session.viewerQueueState;
  const myMatch = live.data?.matches.find((match) =>
    [...match.teams.A, ...match.teams.B].some((player) => player.userId === me?.id),
  );
  const canSelfCheckIn =
    session.checkInPolicy === 'SELF' || session.checkInPolicy === 'SELF_AND_MANAGER';

  const act = async (label: string, operation: () => Promise<unknown>, success: string) => {
    setBusy(label);
    try {
      await operation();
      await invalidateSessionQueries(queryClient, id);
      await queryClient.invalidateQueries({ queryKey: ['upcoming'] });
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'That action did not go through');
    } finally {
      setBusy(null);
    }
  };

  const register = () =>
    act('register', () => api.post(`/api/v1/sessions/${id}/register`, {}), 'Registration saved');
  const cancelRegistration = () =>
    act('cancel', () => api.delete(`/api/v1/sessions/${id}/register`), 'Registration cancelled');
  const checkIn = () =>
    act('checkin', () => api.post(`/api/v1/sessions/${id}/checkins`, {}), 'You are checked in');
  const pause = () =>
    act(
      'pause',
      () => api.post(`/api/v1/sessions/${id}/queue/pause`, {}),
      'Queue participation paused',
    );
  const resume = () =>
    act('resume', () => api.post(`/api/v1/sessions/${id}/queue/resume`, {}), 'Back in the queue');
  const leave = () =>
    act('leave', () => api.post(`/api/v1/sessions/${id}/leave`, {}), 'You left the session');

  const share = async () => {
    const url = `${window.location.origin}/public/sessions/${session.publicId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public session link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/app/queue">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {session.status === 'LIVE' ? <ConnectionPill status={status} /> : null}
          <Button variant="outline" size="sm" onClick={() => void share()}>
            <Share2 className="size-3.5" /> Public link
          </Button>
          {isAdmin ? (
            <Button asChild size="sm">
              <Link href={`/manage/sessions/${session.id}`}>
                <ShieldCheck className="size-3.5" /> Manage
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
        <div className="relative bg-forest px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className="pickle-pattern absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <SessionStatusBadge status={session.status} />
              <Badge tone="neutral">{session.format === 'DOUBLES' ? 'Doubles' : 'Singles'}</Badge>
              <Badge tone="neutral">
                {skillLabel(session.matchmaking.minRestMinutes)} min rest
              </Badge>
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              {session.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatShortDay(session.startsAt, session.timezone)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                {formatRange(session.startsAt, session.endsAt, session.timezone)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {session.venue ?? 'Venue TBA'}
              </span>
            </p>
            <p className="mt-1 text-xs text-white/40">{session.club?.name}</p>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border/80 px-5 py-4 sm:grid-cols-4 sm:px-7">
          <StatCard
            label="Checked in"
            value={live.data?.queue.counts.checkedIn ?? session.checkedIn ?? 0}
            accent
          />
          <StatCard
            label="Waiting"
            value={live.data?.queue.counts.waiting ?? session.waiting ?? 0}
          />
          <StatCard label="Courts" value={session.courts.length} />
          <StatCard label="Capacity" value={session.capacity} />
        </div>

        <div className="flex flex-wrap items-center gap-2 p-5 sm:p-6">
          {session.status === 'CHECK_IN_OPEN' || session.status === 'LIVE' ? (
            registration?.status === 'CHECKED_IN' || queueState ? (
              <>
                <Badge tone="success" dot>
                  Checked in
                </Badge>
                {queueState === 'PLAYING' || queueState === 'RESERVED' ? (
                  <Badge tone="lime" dot>
                    On court
                  </Badge>
                ) : queueState === 'PAUSED' ? (
                  <Button size="sm" onClick={() => void resume()} disabled={busy !== null}>
                    {busy === 'resume' ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                    Resume queue
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void pause()}
                    disabled={busy !== null}
                  >
                    {busy === 'pause' ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Pause className="size-3.5" />
                    )}
                    Pause queue
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (
                      window.confirm('Leave this session? Your registration will be withdrawn.')
                    ) {
                      void leave();
                    }
                  }}
                  disabled={busy !== null || queueState === 'PLAYING' || queueState === 'RESERVED'}
                >
                  <LogOut className="size-3.5" /> Leave
                </Button>
              </>
            ) : registration?.status === 'REGISTERED' && canSelfCheckIn ? (
              <Button size="sm" onClick={() => void checkIn()} disabled={busy !== null}>
                {busy === 'checkin' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                Check in
              </Button>
            ) : registration?.status === 'PENDING' ? (
              <Badge tone="warning">Registration awaiting approval</Badge>
            ) : !registration ? (
              <Button size="sm" onClick={() => void register()} disabled={busy !== null}>
                {busy === 'register' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Users className="size-3.5" />
                )}
                Register
              </Button>
            ) : (
              <Badge tone="neutral">Awaiting Queue Master check-in</Badge>
            )
          ) : session.status === 'SCHEDULED' ? (
            registration ? (
              <>
                <Badge tone="success" dot>
                  {registration.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void cancelRegistration()}
                  disabled={busy !== null}
                >
                  Cancel registration
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => void register()} disabled={busy !== null}>
                {busy === 'register' ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Register for this session
              </Button>
            )
          ) : session.status === 'COMPLETED' ? (
            <Badge tone="neutral">Session completed</Badge>
          ) : session.status === 'CANCELLED' ? (
            <Badge tone="danger">Session cancelled</Badge>
          ) : (
            <Badge tone="neutral">Draft session</Badge>
          )}
          {session.status === 'LIVE' ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/app/queue">
                <WalletCards className="size-3.5" /> My queue
              </Link>
            </Button>
          ) : null}
          {session.published ? (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/public/sessions/${session.publicId}`} target="_blank">
                View public page <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {myMatch ? <MatchScoreCard match={myMatch} href={`/app/matches/${myMatch.id}`} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          {session.status === 'LIVE' ? (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Courts right now</h2>
                  <Badge tone="lime" dot>
                    Live
                  </Badge>
                </div>
                {live.isLoading ? (
                  <div className="mt-4 h-32 animate-pulse rounded-xl bg-secondary/60" />
                ) : live.data ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {live.data.courts.map((court) => (
                      <div
                        key={court.id}
                        className="rounded-2xl border border-border bg-background/50 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">{court.name}</p>
                          <Badge tone={court.match ? 'lime' : 'success'} dot>
                            {court.match ? 'In play' : 'Open'}
                          </Badge>
                        </div>
                        {court.match ? (
                          <div className="mt-3">
                            <div className="flex items-end justify-between">
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">
                                  {court.match.teams.A.map((player) => player.displayName).join(
                                    ' + ',
                                  )}
                                </p>
                                <p className="text-muted-foreground">
                                  {court.match.teams.B.map((player) => player.displayName).join(
                                    ' + ',
                                  )}
                                </p>
                              </div>
                              <div className="tabular font-display text-3xl font-extrabold">
                                {court.match.currentGame.a}
                                <span className="mx-1 text-muted-foreground">–</span>
                                {court.match.currentGame.b}
                              </div>
                            </div>
                            <Link
                              href={`/app/matches/${court.match.id}`}
                              className="mt-2 inline-flex min-h-6 items-center text-[0.68rem] font-bold text-primary hover:underline"
                            >
                              View scoreboard
                            </Link>
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Ready for the next rotation.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Live court state is unavailable.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-display text-lg font-bold">About this session</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {session.description ??
                    'Open play session. Register, check in, and wait for the Queue Master to start the rotation.'}
                </p>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>Registration: {session.registrationPolicy.toLowerCase()}</span>
                  <span>Check-in: {session.checkInPolicy.toLowerCase().replaceAll('_', ' ')}</span>
                  <span>Format: {session.format.toLowerCase()}</span>
                  <span>Scoring: rally to {session.scoring.targetScore}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {rotation.data ? (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Next rotation</h2>
                  <Badge tone="warning">Proposed</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {rotation.data.assignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-xl bg-secondary/60 p-3">
                      <p className="text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
                        {assignment.courtName}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {assignment.teamA.map((player) => player.displayName).join(' + ')} vs{' '}
                        {assignment.teamB.map((player) => player.displayName).join(' + ')}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[0.65rem] text-muted-foreground">
                  The Queue Master will confirm the rotation on court.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-base font-bold">Session details</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="text-right font-semibold">
                    {formatDay(session.startsAt, session.timezone)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Time</dt>
                  <dd className="text-right font-semibold">
                    {formatRange(session.startsAt, session.endsAt, session.timezone)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Venue</dt>
                  <dd className="text-right font-semibold">{session.venue ?? 'TBA'}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Your place</dt>
                  <dd className="text-right font-semibold">
                    {queueState
                      ? queueLabel(queueState)
                      : registration
                        ? registration.status
                        : 'Not registered'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-base font-bold">Courts</h2>
              <div className="mt-3 space-y-2">
                {session.courts.map((court) => (
                  <div
                    key={court.id}
                    className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2"
                  >
                    <span className="text-xs font-semibold">{court.name}</span>
                    <Badge tone={court.status === 'IN_USE' ? 'lime' : 'success'} dot>
                      {court.status === 'IN_USE' ? 'In play' : 'Available'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/60 p-5">
            <QrCode className="size-5 text-[#486b1c]" />
            <p className="mt-2 font-display text-base font-bold text-[#385513]">
              Check-in is identity-first
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
              A QR code opens the check-in page, but you still need to be signed in. Scanning alone
              never claims another player’s spot.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
