'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  MapPin,
  Play,
  Radio,
  RefreshCw,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, newIdempotencyKey } from '@/lib/api';
import {
  invalidateSessionQueries,
  useLive,
  useRegistrations,
  useRotation,
  useSession,
  useSessionMatches,
} from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { formatDay, formatRange, relativeTime, sessionLabel } from '@/lib/format';
import { StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Field, Input, Select } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { SessionStatusBadge } from '@/components/session/status';
import { MatchScoreCard } from '@/components/match/score-card';
import { ConnectionPill } from '@/components/system/offline-banner';

export default function ManageSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const queryClient = useQueryClient();
  const sessionQuery = useSession(sessionId);
  const session = sessionQuery.data;
  const live = useLive(sessionId);
  const rotation = useRotation(sessionId);
  const registrations = useRegistrations(sessionId);
  const results = useSessionMatches(sessionId, true);
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapAssignmentId, setSwapAssignmentId] = useState<string | null>(null);
  const [swapOutUserId, setSwapOutUserId] = useState('');
  const [swapInUserId, setSwapInUserId] = useState('');
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  const status = useSessionEvents({
    sessionId,
    onEvent: () => invalidateSessionQueries(queryClient, sessionId),
    onRecover: () => invalidateSessionQueries(queryClient, sessionId),
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

  const refreshAll = async () => {
    await Promise.all([
      invalidateSessionQueries(queryClient, sessionId),
      queryClient.invalidateQueries({ queryKey: ['rotation', sessionId] }),
      queryClient.invalidateQueries({ queryKey: ['registrations', sessionId] }),
      queryClient.invalidateQueries({ queryKey: ['matches', sessionId] }),
    ]);
  };

  const act = async (label: string, operation: () => Promise<unknown>, success: string) => {
    setBusy(label);
    try {
      await operation();
      await refreshAll();
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'That action did not go through');
      await refreshAll();
    } finally {
      setBusy(null);
    }
  };

  const transition = (next: string, extra: Record<string, unknown> = {}) =>
    act(
      `status-${next}`,
      () =>
        api.post(`/api/v1/sessions/${sessionId}/status`, {
          status: next,
          expectedVersion: session.version,
          ...extra,
        }),
      `Session moved to ${sessionLabel(next)}`,
    );

  const publish = (published: boolean) =>
    act(
      'publish',
      () =>
        api.post(`/api/v1/sessions/${sessionId}/publish`, {
          published,
          expectedVersion: session.version,
        }),
      published ? 'Public link enabled' : 'Public link disabled',
    );

  const generate = () =>
    act(
      'preview',
      () => api.post(`/api/v1/sessions/${sessionId}/rotations/preview`, {}),
      'Rotation preview generated',
    );

  const commit = async () => {
    const preview = rotation.data;
    if (!preview) return;
    await act(
      'commit',
      () =>
        api.post(
          `/api/v1/sessions/${sessionId}/rotations/commit`,
          {
            rotationId: preview.rotationId,
            expectedSessionVersion: preview.sessionVersion,
          },
          { idempotencyKey: newIdempotencyKey('rotation') },
        ),
      'Rotation committed — players are on court',
    );
  };

  const cancelPreview = () => {
    const preview = rotation.data;
    if (!preview) return;
    void act(
      'cancel-preview',
      () => api.post(`/api/v1/sessions/${sessionId}/rotations/${preview.rotationId}/cancel`, {}),
      'Preview cancelled',
    );
  };

  const openSwap = (assignmentId: string) => {
    const assignment = rotation.data?.assignments.find((entry) => entry.id === assignmentId);
    if (!assignment) return;
    setSwapAssignmentId(assignmentId);
    setSwapOutUserId(assignment.teamA[0]?.userId ?? assignment.teamB[0]?.userId ?? '');
    setSwapInUserId(rotation.data?.bench[0]?.userId ?? '');
    setSwapOpen(true);
  };

  const swapPlayers = async () => {
    const preview = rotation.data;
    if (!preview || !swapAssignmentId) return;
    setBusy('swap');
    try {
      await api.patch(`/api/v1/sessions/${sessionId}/rotations/${preview.rotationId}/players`, {
        playerUserId: swapOutUserId,
        replacementUserId: swapInUserId,
      });
      await refreshAll();
      setSwapOpen(false);
      toast.success('Rotation overridden');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not swap players');
    } finally {
      setBusy(null);
    }
  };

  const startMatch = (matchId: string) =>
    act('start-match', () => api.post(`/api/v1/matches/${matchId}/start`, {}), 'Match started');

  const cancelSession = async () => {
    setBusy('cancel-session');
    try {
      await api.post(`/api/v1/sessions/${sessionId}/status`, {
        status: 'CANCELLED',
        force: true,
        reason: cancelReason || 'Cancelled by Queue Master',
        expectedVersion: session.version,
      });
      setCancelOpen(false);
      await refreshAll();
      toast.success('Session cancelled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not cancel the session');
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/public/sessions/${session.publicId}`,
      );
      toast.success('Public session link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const pending = registrations.data?.registrations.filter((row) => row.status === 'PENDING') ?? [];
  const activeMatches = live.data?.matches ?? [];
  const waiting = live.data?.queue.queue.filter((entry) => entry.state === 'WAITING') ?? [];
  const checkedIn = live.data?.queue.counts.checkedIn ?? session.checkedIn ?? 0;
  const previewExpiresAt = rotation.data ? new Date(rotation.data.expiresAt).getTime() : 0;
  const previewExpired = Boolean(rotation.data && previewExpiresAt <= nowTick);
  const previewSeconds = rotation.data
    ? Math.max(0, Math.round((previewExpiresAt - nowTick) / 1000))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/manage/sessions">
            <ArrowLeft className="size-4" /> Sessions
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ConnectionPill status={status} />
          <Button variant="outline" size="sm" onClick={() => void share()}>
            <Share2 className="size-3.5" /> Public link
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/manage/sessions/${sessionId}/settings`}>
              <Settings2 className="size-3.5" /> Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-soft">
        <div className="relative bg-forest px-5 py-6 text-white sm:px-7">
          <div className="pickle-pattern absolute inset-0 opacity-30" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SessionStatusBadge status={session.status} />
                <Badge tone="neutral">{session.format === 'DOUBLES' ? 'Doubles' : 'Singles'}</Badge>
                {session.published ? (
                  <Badge tone="success">Public</Badge>
                ) : (
                  <Badge tone="warning">Private</Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                {session.name}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />{' '}
                  {formatDay(session.startsAt, session.timezone)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />{' '}
                  {formatRange(session.startsAt, session.endsAt, session.timezone)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {session.venue ?? 'Venue TBA'}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.status === 'DRAFT' ? (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => void transition('SCHEDULED')}
                  disabled={busy !== null}
                >
                  {busy === 'status-SCHEDULED' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CalendarDays className="size-3.5" />
                  )}
                  Schedule session
                </Button>
              ) : null}
              {session.status === 'SCHEDULED' ? (
                <>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => void transition('CHECK_IN_OPEN')}
                    disabled={busy !== null}
                  >
                    Open check-in
                  </Button>
                  {!session.published ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                      onClick={() => void publish(true)}
                      disabled={busy !== null}
                    >
                      Publish
                    </Button>
                  ) : null}
                </>
              ) : null}
              {session.status === 'CHECK_IN_OPEN' ? (
                <>
                  <Button asChild variant="accent" size="sm">
                    <Link href={`/manage/sessions/${sessionId}/check-in`}>
                      <ClipboardCheck className="size-3.5" /> Check-in board
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void transition('LIVE')}
                    disabled={busy !== null}
                  >
                    <Radio className="size-3.5" /> Go live
                  </Button>
                </>
              ) : null}
              {session.status === 'LIVE' ? (
                <>
                  <Button asChild variant="accent" size="sm">
                    <Link href={`/manage/sessions/${sessionId}/check-in`}>
                      <ClipboardCheck className="size-3.5" /> Check-in
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      if (window.confirm('Complete this session? All players must be off court.')) {
                        void transition('COMPLETED');
                      }
                    }}
                    disabled={busy !== null || activeMatches.length > 0}
                  >
                    <CheckCircle2 className="size-3.5" /> Complete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:bg-white/10 hover:text-white"
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel session
                  </Button>
                </>
              ) : null}
              {['DRAFT', 'SCHEDULED', 'CHECK_IN_OPEN'].includes(session.status) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:bg-white/10 hover:text-white"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancel session
                </Button>
              ) : null}
              {session.status === 'COMPLETED' ? (
                <Badge tone="success">Session complete</Badge>
              ) : null}
              {session.status === 'CANCELLED' ? (
                <Badge tone="danger">Session cancelled</Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-6">
          <StatCard
            label="Checked in"
            value={checkedIn}
            accent
            icon={<Users className="size-4" />}
          />
          <StatCard
            label="Waiting"
            value={live.data?.queue.counts.waiting ?? session.waiting ?? 0}
            icon={<Clock3 className="size-4" />}
          />
          <StatCard
            label="On court"
            value={live.data?.queue.counts.playing ?? session.playing ?? 0}
            icon={<Trophy className="size-4" />}
          />
          <StatCard
            label="Pending"
            value={pending.length || session.pending || 0}
            icon={<ClipboardCheck className="size-4" />}
          />
        </div>

        {pending.length > 0 ? (
          <div className="mx-5 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] p-3.5 text-xs text-[#7a520c] sm:mx-6">
            <span>
              <strong>{pending.length}</strong> registration{pending.length === 1 ? '' : 's'}{' '}
              waiting for approval.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={`/manage/sessions/${sessionId}/check-in`}>Review now</Link>
            </Button>
          </div>
        ) : null}
      </div>

      {session.status === 'LIVE' ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Courts</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void generate()}
                  disabled={busy !== null}
                >
                  {busy === 'preview' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Generate rotation
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void refreshAll()}
                  aria-label="Refresh"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>
            {live.isLoading ? (
              <div className="h-64 animate-pulse rounded-2xl bg-secondary/60" />
            ) : live.data ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {live.data.courts.map((court) => (
                  <Card key={court.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display text-base font-bold">{court.name}</p>
                          <p className="text-[0.62rem] text-muted-foreground">
                            {court.match ? `Round ${court.match.round}` : 'No active match'}
                          </p>
                        </div>
                        <Badge tone={court.match ? 'lime' : 'success'} dot>
                          {court.match
                            ? court.match.status === 'IN_PROGRESS'
                              ? 'Live'
                              : 'Ready'
                            : 'Open'}
                        </Badge>
                      </div>
                      {court.match ? (
                        <div className="mt-3 rounded-xl bg-secondary/50 p-3">
                          <div className="flex items-end justify-between gap-2">
                            <div className="min-w-0 text-xs">
                              <p className="truncate font-semibold">
                                {court.match.teams.A.map((player) => player.displayName).join(
                                  ' + ',
                                )}
                              </p>
                              <p className="mt-0.5 truncate text-muted-foreground">
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
                          <div className="mt-3 flex gap-2">
                            {court.match.status === 'READY' ? (
                              <Button
                                size="sm"
                                variant="accent"
                                onClick={() => void startMatch(court.match!.id)}
                                disabled={busy !== null}
                              >
                                <Play className="size-3.5" /> Start
                              </Button>
                            ) : null}
                            <Button asChild size="sm" variant="dark" className="flex-1">
                              <Link href={`/manage/matches/${court.match.id}`}>
                                <Trophy className="size-3.5" /> Scoreboard
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                          Call the next rotation to fill this court.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <ErrorState error={live.error} onRetry={() => void live.refetch()} />
            )}

            {live.data && live.data.matches.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold">Matches in progress</h2>
                  <Badge tone="lime">{live.data.matches.length} live</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {live.data.matches.map((match) => (
                    <MatchScoreCard
                      key={match.id}
                      match={match}
                      href={`/manage/matches/${match.id}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Next rotation</h2>
                  {rotation.data ? (
                    <Badge tone={rotation.data.stale || previewExpired ? 'warning' : 'info'}>
                      {previewExpired ? 'Expired' : rotation.data.stale ? 'Stale' : 'Preview'}
                    </Badge>
                  ) : null}
                </div>
                {rotation.isLoading ? (
                  <div className="mt-3 h-36 animate-pulse rounded-xl bg-secondary/60" />
                ) : rotation.data ? (
                  <div className="mt-3 space-y-3">
                    {rotation.data.assignments.length === 0 ? (
                      <div className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] p-3 text-xs leading-relaxed text-[#7a520c]">
                        No match can be formed from the current eligibility pool. The bench
                        explanations below show why. Check in more players or wait for a court to
                        open, then generate again.
                      </div>
                    ) : null}
                    {previewExpired ? (
                      <div className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] p-3 text-xs text-[#7a520c]">
                        This preview expired before it was committed. Generate a fresh rotation to
                        revalidate the queue and courts.
                      </div>
                    ) : rotation.data.stale ? (
                      <div className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] p-3 text-xs text-[#7a520c]">
                        Eligibility changed since this preview. Generate a fresh rotation before
                        committing.
                      </div>
                    ) : (
                      <p className="text-[0.62rem] text-muted-foreground">
                        Preview expires in {previewSeconds}s. Commitment revalidates every player
                        and court.
                      </p>
                    )}
                    {rotation.data.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="rounded-xl border border-border bg-background/50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                            {assignment.courtName}
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="text-[0.6rem] text-muted-foreground">
                              {assignment.teamBalance.toFixed(1)} balance
                            </span>
                            {!rotation.data?.stale &&
                            !previewExpired &&
                            rotation.data?.bench.length ? (
                              <button
                                type="button"
                                onClick={() => openSwap(assignment.id)}
                                className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                                aria-label={`Swap a player on ${assignment.courtName}`}
                              >
                                <ArrowLeftRight className="size-3" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold">
                              {assignment.teamA.map((player) => player.displayName).join(' + ')}
                            </p>
                            <span className="text-xs font-bold tabular">
                              {assignment.teamRatingA.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold">
                              {assignment.teamB.map((player) => player.displayName).join(' + ')}
                            </p>
                            <span className="text-xs font-bold tabular">
                              {assignment.teamRatingB.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        {assignment.reasons.length > 0 ? (
                          <p className="mt-2 text-[0.6rem] leading-relaxed text-muted-foreground">
                            {assignment.reasons.slice(0, 2).join(' · ')}
                          </p>
                        ) : null}
                      </div>
                    ))}
                    {rotation.data.warnings.length > 0 ? (
                      <div className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] p-3 text-[0.65rem] leading-relaxed text-[#7a520c]">
                        {rotation.data.warnings.join(' ')}
                      </div>
                    ) : null}
                    <div className="rounded-xl bg-secondary/60 p-3 text-[0.62rem] text-muted-foreground">
                      {rotation.data.metrics.assignedPlayers} players · avg wait{' '}
                      {rotation.data.metrics.averageWaitMinutes}m · max spread{' '}
                      {rotation.data.metrics.averageSkillSpread}
                    </div>
                    {rotation.data.bench.length > 0 ? (
                      <div>
                        <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          Waiting ({rotation.data.bench.length})
                        </p>
                        <p className="mt-1 text-[0.65rem] text-muted-foreground">
                          {rotation.data.bench.map((entry) => entry.displayName).join(', ')}
                        </p>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => void commit()}
                        disabled={
                          busy !== null ||
                          rotation.data.stale ||
                          previewExpired ||
                          rotation.data.assignments.length === 0
                        }
                      >
                        {busy === 'commit' ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {previewExpired ? 'Preview expired' : 'Commit rotation'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void cancelPreview()}
                        disabled={busy !== null}
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-border p-5 text-center">
                    <Sparkles className="mx-auto size-5 text-[#47671b]" />
                    <p className="mt-2 text-sm font-semibold">No preview yet</p>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      Generate a rotation to see the next fair matches before committing.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => void generate()}
                      disabled={busy !== null}
                    >
                      <Sparkles className="size-3.5" /> Generate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Waiting queue</h2>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/manage/sessions/${sessionId}/check-in`}>Manage</Link>
                  </Button>
                </div>
                <div className="mt-3 space-y-1.5">
                  {waiting.slice(0, 8).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2.5 rounded-lg bg-secondary/50 px-2.5 py-2"
                    >
                      <span className="w-5 text-xs font-bold tabular text-muted-foreground">
                        {entry.position}
                      </span>
                      <Avatar name={entry.displayName} size="xs" />
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="truncate text-xs font-semibold">{entry.displayName}</span>
                        {entry.participantType === 'GUEST' ? (
                          <Badge tone="info" className="shrink-0 px-1.5 py-0.5 text-[0.5rem]">
                            Guest
                          </Badge>
                        ) : null}
                      </span>
                      <span className="text-[0.6rem] text-muted-foreground">
                        {entry.waitingMinutes}m
                      </span>
                    </div>
                  ))}
                  {waiting.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No one waiting.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">Session readiness</h2>
              <div className="mt-4 space-y-3">
                {[
                  {
                    label: 'Courts selected',
                    done: session.courts.length > 0,
                    detail: `${session.courts.length} courts`,
                  },
                  {
                    label: 'Registration policy',
                    done: true,
                    detail: session.registrationPolicy.toLowerCase(),
                  },
                  {
                    label: 'Check-in policy',
                    done: true,
                    detail: session.checkInPolicy.toLowerCase().replaceAll('_', ' '),
                  },
                  {
                    label: 'Enough players to go live',
                    done: checkedIn >= (session.format === 'SINGLES' ? 2 : 4),
                    detail: `${checkedIn} checked in · minimum ${session.format === 'SINGLES' ? 2 : 4}`,
                  },
                  {
                    label: 'Public page',
                    done: session.published,
                    detail: session.published ? 'Published' : 'Private',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3.5 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`grid size-6 place-items-center rounded-full ${item.done ? 'bg-lime-soft text-[#4d711a]' : 'bg-secondary text-muted-foreground'}`}
                      >
                        {item.done ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <Clock3 className="size-3.5" />
                        )}
                      </span>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.detail}</span>
                  </div>
                ))}
              </div>
              {session.status === 'DRAFT' ? (
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Schedule the session first, then open check-in. Changes to rules and courts are
                  locked once the session goes live.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h2 className="font-display text-base font-bold">Participants</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {registrations.data?.participants.length ??
                    registrations.data?.registrations.length ??
                    0}{' '}
                  total · {registrations.data?.guests.length ?? 0} guest
                  {(registrations.data?.guests.length ?? 0) === 1 ? '' : 's'} · {pending.length}{' '}
                  pending approval
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                  <Link href={`/manage/sessions/${sessionId}/check-in`}>
                    <ClipboardCheck className="size-3.5" /> Open check-in board
                  </Link>
                </Button>
              </CardContent>
            </Card>
            {results.data && results.data.length > 0 ? (
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-display text-base font-bold">Latest results</h2>
                  <div className="mt-2 space-y-2">
                    {results.data.slice(0, 3).map((match) => (
                      <Link
                        key={match.id}
                        href={`/manage/matches/${match.id}`}
                        className="block rounded-xl bg-secondary/50 px-3 py-2 text-xs hover:bg-secondary"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {match.court.name} · R{match.round}
                          </span>
                          <span className="tabular font-bold">
                            {match.games[match.games.length - 1]?.a ?? 0}–
                            {match.games[match.games.length - 1]?.b ?? 0}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[0.6rem] text-muted-foreground">
                          Team {match.winnerTeam} won ·{' '}
                          {match.completedAt ? relativeTime(match.completedAt) : ''}
                        </p>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
            <div className="rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/60 p-5">
              <ShieldCheck className="size-5 text-[#486b1c]" />
              <p className="mt-2 font-display text-sm font-bold text-[#385513]">
                Check-in is separate from registration
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
                Only checked-in players enter the rotation. Queue Masters can add walk-ins on the
                check-in board.
              </p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override the rotation</DialogTitle>
            <DialogDescription>
              Swap a selected player with an eligible player from the bench. Commit still
              revalidates every player and court.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const assignment = rotation.data?.assignments.find(
              (entry) => entry.id === swapAssignmentId,
            );
            const bench = rotation.data?.bench ?? [];
            if (!assignment) return null;
            return (
              <div className="space-y-3">
                <Field label="Player to replace" htmlFor="swapOut">
                  <Select
                    id="swapOut"
                    value={swapOutUserId}
                    onChange={(event) => setSwapOutUserId(event.target.value)}
                  >
                    {[...assignment.teamA, ...assignment.teamB].map((player) => (
                      <option key={player.userId} value={player.userId}>
                        {player.displayName} · {player.skill.toFixed(2)} · {player.gamesPlayed}{' '}
                        games
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Replacement from bench" htmlFor="swapIn">
                  <Select
                    id="swapIn"
                    value={swapInUserId}
                    onChange={(event) => setSwapInUserId(event.target.value)}
                  >
                    {bench.map((entry) => (
                      <option key={entry.userId} value={entry.userId}>
                        {entry.displayName} · {entry.gamesPlayed} games · {entry.reason}
                      </option>
                    ))}
                  </Select>
                </Field>
                <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
                  The swapped-out player returns to the bench and can be assigned in a later
                  rotation.
                </p>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwapOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void swapPlayers()}
              disabled={
                busy !== null || !swapOutUserId || !swapInUserId || swapOutUserId === swapInUserId
              }
            >
              {busy === 'swap' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowLeftRight className="size-4" />
              )}
              Apply override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this session?</DialogTitle>
            <DialogDescription>
              Active matches and assignments will be cancelled, and every checked-in player will be
              removed from the queue. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Field label="Reason" htmlFor="cancelReason">
            <Input
              id="cancelReason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Weather, venue closure…"
              maxLength={300}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep session
            </Button>
            <Button
              variant="destructive"
              onClick={() => void cancelSession()}
              disabled={busy !== null}
            >
              {busy === 'cancel-session' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              Cancel session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
