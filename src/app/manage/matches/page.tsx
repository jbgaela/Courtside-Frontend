'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useClubSessions, useLive, useSessionMatches } from '@/lib/queries';
import { relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { MatchScoreCard } from '@/components/match/score-card';

export default function ManageMatchesPage() {
  const { me } = useAuth();
  const adminClubs = useMemo(
    () =>
      me?.memberships.filter((membership) => membership.canManage) ?? [],
    [me],
  );
  const [clubId, setClubId] = useState(() => adminClubs[0]?.clubId ?? '');
  const sessions = useClubSessions(clubId || undefined);
  const liveSession = sessions.data?.find((session) => session.status === 'LIVE');
  const completedSession = sessions.data?.find((session) => session.status === 'COMPLETED');
  const live = useLive(liveSession?.id);
  const results = useSessionMatches(completedSession?.id ?? liveSession?.id, true);

  if (sessions.isLoading) return <PageSkeleton />;
  if (sessions.isError) {
    return <ErrorState error={sessions.error} onRetry={() => void sessions.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Matches"
        title="Live scores & results"
        description="Record points on any tablet. Every point is versioned and idempotent."
        actions={
          adminClubs.length > 1 ? (
            <select
              value={clubId}
              onChange={(event) => setClubId(event.target.value)}
              className="h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold"
              aria-label="Select club"
            >
              {adminClubs.map((membership) => (
                <option key={membership.clubId} value={membership.clubId}>
                  {membership.clubName}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      {liveSession ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">Live on {liveSession.name}</h2>
              <p className="text-xs text-muted-foreground">
                Scores update across every connected device.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/manage/sessions/${liveSession.id}`}>
                Live board <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          {live.data && live.data.matches.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {live.data.matches.map((match) => (
                <MatchScoreCard key={match.id} match={match} href={`/manage/matches/${match.id}`} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matches in progress"
              description="Generate a rotation from the live board."
            />
          )}
        </div>
      ) : (
        <EmptyState
          title="No live session"
          description="Start a session to see live matches here."
          icon={<Trophy className="size-5" />}
        />
      )}

      <div>
        <h2 className="mb-2 font-display text-xl font-bold">Completed results</h2>
        {results.isLoading ? (
          <div className="h-28 animate-pulse rounded-2xl bg-secondary/60" />
        ) : results.data && results.data.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-border/70 p-2">
              {results.data.map((match) => (
                <Link
                  key={match.id}
                  href={`/manage/matches/${match.id}`}
                  className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/40"
                >
                  <div className="grid size-9 place-items-center rounded-full bg-secondary text-primary">
                    <Trophy className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {match.court.name} · Round {match.round}
                    </p>
                    <p className="text-[0.62rem] text-muted-foreground">
                      Team {match.winnerTeam} won ·{' '}
                      {match.completedAt ? relativeTime(match.completedAt) : ''}
                    </p>
                  </div>
                  <div className="tabular font-display text-xl font-extrabold">
                    {match.games[match.games.length - 1]?.a ?? 0}
                    <span className="mx-1 text-muted-foreground">–</span>
                    {match.games[match.games.length - 1]?.b ?? 0}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No results yet"
            description="Completed matches appear here with corrections and audit history."
            icon={<CalendarDays className="size-5" />}
          />
        )}
      </div>
    </div>
  );
}
