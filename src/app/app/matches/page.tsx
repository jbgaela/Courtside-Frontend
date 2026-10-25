'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronRight, History, Trophy } from 'lucide-react';
import { useLive, useMatchHistory, useUpcoming, invalidateSessionQueries } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { formatShortDay, relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { Segmented } from '@/components/ui/segmented';
import { MatchScoreCard } from '@/components/match/score-card';
import { ConnectionPill } from '@/components/system/offline-banner';
import { useAuth } from '@/lib/auth';

function HistoryRow({
  item,
}: {
  item: NonNullable<ReturnType<typeof useMatchHistory>['data']>['items'][number];
}) {
  const scoreA = item.games[item.games.length - 1]?.a ?? 0;
  const scoreB = item.games[item.games.length - 1]?.b ?? 0;
  return (
    <Link
      href={`/app/matches/${item.matchId}`}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
          item.won ? 'bg-lime-soft text-[#4d711a]' : 'bg-secondary text-muted-foreground'
        }`}
      >
        {item.won ? 'W' : 'L'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold">{item.session.name}</p>
          <span className="text-[0.6rem] text-muted-foreground">R{item.round}</span>
        </div>
        <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">
          {item.partnerNames.length > 0 ? `with ${item.partnerNames.join(' + ')} · ` : ''}
          vs {item.opponentNames.join(' + ')}
        </p>
        <p className="mt-0.5 text-[0.6rem] text-muted-foreground">
          {formatShortDay(item.playedAt)} · {item.court.name} · {relativeTime(item.playedAt)}
        </p>
      </div>
      <div className="text-right">
        <p className="tabular font-display text-xl font-extrabold">
          {scoreA}
          <span className="mx-1 text-muted-foreground">–</span>
          {scoreB}
        </p>
        <p className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {item.won ? 'Win' : 'Loss'}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function MatchesPage() {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'live' | 'history'>('live');
  const upcoming = useUpcoming();
  const liveSession = upcoming.data?.find((session) => session.status === 'LIVE');
  const live = useLive(liveSession?.sessionId);
  const history = useMatchHistory();
  const status = useSessionEvents({
    sessionId: liveSession?.sessionId,
    enabled: Boolean(liveSession),
    onEvent: () => liveSession && invalidateSessionQueries(queryClient, liveSession.sessionId),
    onRecover: () => liveSession && invalidateSessionQueries(queryClient, liveSession.sessionId),
  });

  if (upcoming.isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Matches"
        title="Every point, every court"
        description="Follow live scores and review the games you have played."
        actions={liveSession ? <ConnectionPill status={status} /> : null}
      />

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'live', label: 'Live now', count: live.data?.matches.length ?? 0 },
          { value: 'history', label: 'My history', count: history.data?.items.length },
        ]}
      />

      {tab === 'live' ? (
        liveSession ? (
          live.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2].map((index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-secondary/60" />
              ))}
            </div>
          ) : live.isError ? (
            <ErrorState error={live.error} onRetry={() => void live.refetch()} />
          ) : live.data && live.data.matches.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">
                  {live.data.session.name}
                </p>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/app/sessions/${live.data.session.id}`}>Session</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {live.data.matches.map((match) => (
                  <MatchScoreCard key={match.id} match={match} href={`/app/matches/${match.id}`} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No matches on court yet"
              description="The Queue Master will publish the first rotation when the session is ready."
              icon={<Trophy className="size-5" />}
            />
          )
        ) : (
          <EmptyState
            title="No live session right now"
            description="When a session you are part of goes live, its matches appear here."
            icon={<CalendarDays className="size-5" />}
            action={
              <Button asChild size="sm">
                <Link href="/app/discover">Find open play</Link>
              </Button>
            }
          />
        )
      ) : history.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      ) : history.isError ? (
        <ErrorState error={history.error} onRetry={() => void history.refetch()} />
      ) : history.data && history.data.items.length > 0 ? (
        <div className="space-y-3">
          {history.data.items.map((item) => (
            <HistoryRow key={item.matchId} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`${me?.profile?.displayName ?? 'You'} has not played yet`}
          description="Completed matches and corrections will appear here."
          icon={<History className="size-5" />}
        />
      )}
    </div>
  );
}
