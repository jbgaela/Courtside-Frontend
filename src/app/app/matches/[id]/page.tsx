'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock3, ExternalLink, Trophy } from 'lucide-react';
import { useMatch, invalidateSessionQueries } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { useAuth } from '@/lib/auth';
import { formatDateTime, matchLabel, matchTone, relativeTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge, LiveBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { ConnectionPill } from '@/components/system/offline-banner';
import type { MatchPlayer } from '@/lib/types';

function TeamColumn({
  label,
  players,
  score,
  winner,
  isViewerTeam,
}: {
  label: string;
  players: MatchPlayer[];
  score: number;
  winner: boolean;
  isViewerTeam: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        winner ? 'border-[#d9edb2] bg-lime-soft/55' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Team {label}
        </p>
        {winner ? (
          <Badge tone="lime">Winner</Badge>
        ) : isViewerTeam ? (
          <Badge tone="info">You</Badge>
        ) : null}
      </div>
      <p className="mt-2 font-display text-5xl font-extrabold tabular leading-none">{score}</p>
      <div className="mt-4 space-y-2">
        {players.map((player) => (
          <div key={`${label}-${player.displayName}`} className="flex items-center gap-2">
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
              <p className="text-[0.58rem] text-muted-foreground">
                {player.skillRating.toFixed(2)} skill
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const matchQuery = useMatch(id);
  const match = matchQuery.data;
  const status = useSessionEvents({
    sessionId: match?.sessionId,
    enabled: Boolean(match) && (match?.status === 'IN_PROGRESS' || match?.status === 'READY'),
    onEvent: () => {
      if (match) invalidateSessionQueries(queryClient, match.sessionId);
      void queryClient.invalidateQueries({ queryKey: ['match', id] });
    },
    onRecover: () => {
      if (match) invalidateSessionQueries(queryClient, match.sessionId);
      void queryClient.invalidateQueries({ queryKey: ['match', id] });
    },
  });

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

  const viewerInA = match.teams.A.some((player) => player.userId === me?.id);
  const viewerInB = match.teams.B.some((player) => player.userId === me?.id);
  const winnerA = match.winnerTeam === 'A';
  const winnerB = match.winnerTeam === 'B';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/app/matches">
            <ArrowLeft className="size-4" /> Matches
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {status === 'live' ? <ConnectionPill status={status} /> : null}
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/sessions/${match.sessionId}`}>Session</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
        <div className="relative bg-forest px-5 py-6 text-white sm:px-7">
          <div className="pickle-pattern absolute inset-0 opacity-30" />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {match.status === 'IN_PROGRESS' ? (
                  <LiveBadge />
                ) : (
                  <Badge tone={matchTone(match.status) as never}>{matchLabel(match.status)}</Badge>
                )}
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white/50">
                  Round {match.round} · {match.format === 'DOUBLES' ? 'Doubles' : 'Singles'}
                </span>
              </div>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
                {match.court.name}
              </h1>
              <p className="mt-1 text-xs text-white/55">
                {match.startedAt ? `Started ${relativeTime(match.startedAt)}` : 'Waiting to start'}{' '}
                · {match.scoring.targetScore} points, win by{' '}
                {match.scoring.winByTwo ? 'two' : 'one'}
              </p>
            </div>
            <Badge tone="neutral">{match.status}</Badge>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <TeamColumn
              label="A"
              players={match.teams.A}
              score={match.currentGame.a}
              winner={winnerA}
              isViewerTeam={viewerInA}
            />
            <TeamColumn
              label="B"
              players={match.teams.B}
              score={match.currentGame.b}
              winner={winnerB}
              isViewerTeam={viewerInB}
            />
          </div>

          <div className="mt-5 rounded-2xl bg-secondary/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Game score
              </p>
              <p className="text-[0.65rem] font-semibold text-muted-foreground">
                Games {match.gamesWonA}–{match.gamesWonB}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {match.games.map((game, index) => (
                <span
                  key={index}
                  className={`rounded-lg px-2.5 py-1 text-sm font-bold tabular ${
                    index === match.games.length - 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card'
                  }`}
                >
                  {game.a}–{game.b}
                </span>
              ))}
            </div>
            {match.awaitingCompletion ? (
              <p className="mt-3 text-xs font-semibold text-warning">
                Winning condition reached. Waiting for the Queue Master to confirm the result.
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {match.startedAt ? formatDateTime(match.startedAt) : 'Not started'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {match.completedAt ? `Completed ${relativeTime(match.completedAt)}` : 'In progress'}
            </span>
          </div>

          {match.source?.correctedAt ? (
            <div className="mt-4 rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] px-3.5 py-2.5 text-xs text-[#7a520c]">
              This result was corrected by a Queue Master.
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/app/matches">
            <Trophy className="size-4" /> All matches
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/app/sessions/${match.sessionId}`}>
            <ExternalLink className="size-4" /> Session details
          </Link>
        </Button>
      </div>
    </div>
  );
}
