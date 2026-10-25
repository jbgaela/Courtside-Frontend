'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  RotateCcw,
  Trophy,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, newIdempotencyKey } from '@/lib/api';
import { useMatch, queryKeys } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { formatTime, relativeTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge, LiveBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Field, Input, Textarea } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { ConnectionPill } from '@/components/system/offline-banner';
import type { MatchView } from '@/lib/types';

function TeamPanel({
  team,
  label,
  score,
  gameWins,
  winner,
  onPoint,
  disabled,
  serving,
}: {
  team: MatchView['teams']['A'];
  label: 'A' | 'B';
  score: number;
  gameWins: number;
  winner: boolean;
  onPoint: () => void;
  disabled: boolean;
  serving: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.4rem] border p-4 transition-colors ${
        winner ? 'border-[#c9f56a] bg-lime-soft/70' : 'border-border bg-card'
      }`}
    >
      {serving ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-[#4d711a]">
          Serve
        </span>
      ) : null}
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Team {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="font-display text-7xl font-extrabold tabular leading-none tracking-[-0.05em]">
          {score}
        </p>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] font-bold text-muted-foreground">
          {gameWins} game{gameWins === 1 ? '' : 's'}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {team.map((player) => (
          <div key={player.displayName} className="flex items-center gap-2">
            <Avatar name={player.displayName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">
                {player.displayName}
                {player.participantType === 'GUEST' ? (
                  <span className="ml-1.5 rounded-full bg-[#e8f1f6] px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-wider text-[#245f7d]">
                    Guest
                  </span>
                ) : null}
              </p>
              <p className="text-[0.55rem] text-muted-foreground">
                {player.skillRating.toFixed(2)} skill
              </p>
            </div>
          </div>
        ))}
      </div>
      <Button
        className="mt-4 w-full"
        size="lg"
        variant={winner ? 'accent' : 'default'}
        onClick={onPoint}
        disabled={disabled}
        aria-label={`Award a point to Team ${label}`}
      >
        <Plus className="size-5" /> Point
      </Button>
    </div>
  );
}

export default function MatchScoringPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const queryClient = useQueryClient();
  const matchQuery = useMatch(matchId);
  const match = matchQuery.data;
  const [busy, setBusy] = useState<string | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionScores, setCorrectionScores] = useState<Array<{ a: string; b: string }>>([]);
  const [correctionReason, setCorrectionReason] = useState('');
  const status = useSessionEvents({
    sessionId: match?.sessionId,
    enabled: Boolean(match) && match?.status !== 'COMPLETED' && match?.status !== 'CORRECTED',
    onEvent: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.match(matchId) });
    },
    onRecover: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.match(matchId) });
    },
  });

  useEffect(() => {
    if (!match) return;
    // This intentionally seeds the correction dialog from the loaded match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCorrectionScores(match.games.map((game) => ({ a: String(game.a), b: String(game.b) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id]);

  if (matchQuery.isLoading) return <PageSkeleton />;
  if (matchQuery.isError || !match) {
    return (
      <ErrorState
        title="Match unavailable"
        error={matchQuery.error}
        onRetry={() => void matchQuery.refetch()}
      />
    );
  }

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.match(matchId) });
  };

  const start = async () => {
    setBusy('start');
    try {
      const response = await api.post<{ match: MatchView }>(`/api/v1/matches/${matchId}/start`, {});
      queryClient.setQueryData(queryKeys.match(matchId), response.match);
      toast.success('Match started');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start the match');
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const point = async (team: 'A' | 'B') => {
    setBusy(`point-${team}`);
    try {
      const response = await api.post<{ match: MatchView; awaitingCompletion: boolean }>(
        `/api/v1/matches/${matchId}/score-events`,
        { team, expectedVersion: match.version },
        { idempotencyKey: newIdempotencyKey(`point-${team}`) },
      );
      queryClient.setQueryData(queryKeys.match(matchId), response.match);
      if (response.awaitingCompletion) {
        toast.success('Winning condition reached. Confirm the result.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Point not recorded');
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const undo = async () => {
    setBusy('undo');
    try {
      const response = await api.post<{ match: MatchView }>(`/api/v1/matches/${matchId}/undo`, {
        expectedVersion: match.version,
      });
      queryClient.setQueryData(queryKeys.match(matchId), response.match);
      toast.success('Last point removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not undo the point');
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const complete = async () => {
    setBusy('complete');
    try {
      const response = await api.post<{ match: MatchView; alreadyCompleted: boolean }>(
        `/api/v1/matches/${matchId}/complete`,
        { expectedVersion: match.version },
        { idempotencyKey: newIdempotencyKey('complete') },
      );
      queryClient.setQueryData(queryKeys.match(matchId), response.match);
      toast.success('Match complete');
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not complete the match');
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const submitCorrection = async () => {
    setBusy('correction');
    try {
      const response = await api.post<{ match: MatchView }>(
        `/api/v1/matches/${matchId}/correction`,
        {
          games: correctionScores.map((game) => ({ a: Number(game.a), b: Number(game.b) })),
          reason: correctionReason,
          expectedVersion: match.version,
        },
        { idempotencyKey: newIdempotencyKey('correction') },
      );
      queryClient.setQueryData(queryKeys.match(matchId), response.match);
      setCorrectionOpen(false);
      toast.success('Result corrected');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not correct the result');
    } finally {
      setBusy(null);
    }
  };

  const finished = match.status === 'COMPLETED' || match.status === 'CORRECTED';
  const winnerA = match.winnerTeam === 'A';
  const winnerB = match.winnerTeam === 'B';
  const inProgress = match.status === 'IN_PROGRESS';
  const ready = match.status === 'READY';

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/manage/sessions/${match.sessionId}`}>
            <ArrowLeft className="size-4" /> Session board
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ConnectionPill status={status} />
          <Badge tone="neutral">{match.format === 'DOUBLES' ? 'Doubles' : 'Singles'}</Badge>
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {match.status === 'IN_PROGRESS' ? (
                <LiveBadge />
              ) : (
                <Badge tone="neutral">{match.status}</Badge>
              )}
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {match.court.name} · Round {match.round}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
              Live scoreboard
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              First to {match.scoring.targetScore} ·{' '}
              {match.scoring.winByTwo ? 'win by two' : 'win by one'}
              {match.scoring.pointCap ? ` · cap ${match.scoring.pointCap}` : ''} · best of{' '}
              {match.scoring.bestOf}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ready ? (
              <Button onClick={() => void start()} disabled={busy !== null}>
                {busy === 'start' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trophy className="size-4" />
                )}
                Start match
              </Button>
            ) : null}
            {inProgress ? (
              <Button variant="outline" onClick={() => void undo()} disabled={busy !== null}>
                {busy === 'undo' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Undo2 className="size-4" />
                )}
                Undo point
              </Button>
            ) : null}
            {finished ? (
              <Button variant="outline" onClick={() => setCorrectionOpen(true)}>
                Correct result
              </Button>
            ) : null}
          </div>
        </div>

        {match.awaitingCompletion ? (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#d9edb2] bg-lime-soft/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[#d9f39b] text-[#4d711a]">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#385513]">Winning condition reached</p>
                <p className="text-xs text-[#3e5716]">
                  Team {match.winnerTeam} leads. Confirm to send players back to the queue.
                </p>
              </div>
            </div>
            <Button onClick={() => void complete()} disabled={busy !== null}>
              {busy === 'complete' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Complete match
            </Button>
          </div>
        ) : null}

        {finished ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-forest px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-lime" />
              <span className="text-sm font-bold">Team {match.winnerTeam} wins</span>
            </div>
            <span className="text-xs text-white/50">
              {match.completedAt ? `completed ${relativeTime(match.completedAt)}` : ''}
            </span>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <TeamPanel
            team={match.teams.A}
            label="A"
            score={match.currentGame.a}
            gameWins={match.gamesWonA}
            winner={winnerA}
            serving={match.servingTeam === 'A'}
            onPoint={() => void point('A')}
            disabled={!inProgress || match.awaitingCompletion || busy !== null}
          />
          <TeamPanel
            team={match.teams.B}
            label="B"
            score={match.currentGame.b}
            gameWins={match.gamesWonB}
            winner={winnerB}
            serving={match.servingTeam === 'B'}
            onPoint={() => void point('B')}
            disabled={!inProgress || match.awaitingCompletion || busy !== null}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-secondary/60 p-3.5">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Games
          </span>
          {match.games.map((game, index) => (
            <span
              key={index}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold tabular ${
                index === match.games.length - 1 ? 'bg-primary text-primary-foreground' : 'bg-card'
              }`}
            >
              {game.a}–{game.b}
            </span>
          ))}
          <span className="ml-auto text-[0.62rem] text-muted-foreground">
            {match.startedAt ? `Started ${formatTime(match.startedAt)}` : 'Not started'}
          </span>
        </div>

        {!inProgress && !ready && !finished ? (
          <p className="mt-4 text-sm text-muted-foreground">
            This match is {match.status.toLowerCase()}.
          </p>
        ) : null}

        {ready ? (
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Start the match when both teams are on court. Points are only accepted while a match is
            in progress.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/manage/sessions/${match.sessionId}`}>
            <ChevronRight className="size-4" /> Back to live board
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/app/matches/${match.id}`}>Player view</Link>
        </Button>
        {match.awaitingCompletion ? (
          <Button variant="outline" onClick={() => void undo()} disabled={busy !== null}>
            <RotateCcw className="size-4" /> Undo final point
          </Button>
        ) : null}
      </div>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correct the result</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enter the corrected game scores. The result, player win/loss records and public
            scoreboard are updated together.
          </p>
          <div className="mt-4 space-y-3">
            {correctionScores.map((game, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr] gap-2">
                <Field label={`Game ${index + 1} · Team A`} htmlFor={`correction-a-${index}`}>
                  <Input
                    id={`correction-a-${index}`}
                    type="number"
                    min={0}
                    max={99}
                    value={game.a}
                    onChange={(event) =>
                      setCorrectionScores((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, a: event.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Team B" htmlFor={`correction-b-${index}`}>
                  <Input
                    id={`correction-b-${index}`}
                    type="number"
                    min={0}
                    max={99}
                    value={game.b}
                    onChange={(event) =>
                      setCorrectionScores((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, b: event.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
              </div>
            ))}
            <Field label="Reason" htmlFor="correction-reason">
              <Textarea
                id="correction-reason"
                value={correctionReason}
                onChange={(event) => setCorrectionReason(event.target.value)}
                placeholder="Explain the correction for the audit log."
                minLength={3}
                maxLength={300}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitCorrection()}
              disabled={busy !== null || correctionReason.trim().length < 3}
            >
              {busy === 'correction' ? <Loader2 className="size-4 animate-spin" /> : null}
              Save correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
