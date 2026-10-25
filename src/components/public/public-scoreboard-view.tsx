'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock3, MonitorPlay } from 'lucide-react';
import { usePublicSession, queryKeys } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import type { PublicSession } from '@/lib/types';
import { formatRange } from '@/lib/format';
import { Logo } from '@/components/brand/logo';
import { LiveBadge } from '@/components/ui/badge';

export function PublicScoreboardView({ initialData }: { initialData: PublicSession }) {
  const queryClient = useQueryClient();
  const session = usePublicSession(initialData.id, initialData);
  const status = useSessionEvents({
    publicId: initialData.id,
    onEvent: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.publicSession(initialData.id) });
    },
    onRecover: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.publicSession(initialData.id) });
    },
  });
  const data = session.data ?? initialData;
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const live = data.matches.filter((match) => match.status === 'IN_PROGRESS');
  const courts = data.courts;

  return (
    <div className="min-h-dvh bg-forest text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
        <Logo tone="light" compact />
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold text-white/45">
            <span
              className={`size-1.5 rounded-full ${status === 'live' ? 'bg-lime live-dot' : 'bg-white/25'}`}
            />
            {status === 'live' ? 'Live' : 'Reconnecting'}
          </span>
          <span className="hidden text-[0.62rem] text-white/35 sm:inline">
            {data.club.name} · {formatRange(data.startsAt, data.endsAt, data.timezone)}
          </span>
          <Link
            href={`/public/sessions/${data.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-3.5" /> Exit
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LiveBadge />
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-lime">
                PickleQueue live scoreboard
              </span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.05em] sm:text-6xl">
              {data.name}
            </h1>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-extrabold tabular">
              {new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: data.timezone,
              }).format(now)}
            </p>
            <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/35">
              {data.counts.checkedIn} players · {live.length} live
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courts.map((court) => {
            const match = court.match;
            return (
              <div
                key={court.id}
                data-testid="public-court"
                data-court={court.name}
                className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.06]"
              >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <p className="font-display text-lg font-bold">{court.name}</p>
                  <span className="inline-flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white/45">
                    <span
                      className={`size-1.5 rounded-full ${match ? 'bg-lime live-dot' : 'bg-white/20'}`}
                    />
                    {match ? 'Live' : 'Open'}
                  </span>
                </div>
                {match ? (
                  <div className="px-5 py-5">
                    {(['A', 'B'] as const).map((team) => {
                      const players = match.teams[team];
                      const score = team === 'A' ? match.currentGame.a : match.currentGame.b;
                      const leading =
                        team === 'A'
                          ? match.currentGame.a > match.currentGame.b
                          : match.currentGame.b > match.currentGame.a;
                      return (
                        <div key={team} className="flex items-center gap-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-lg font-bold ${leading ? 'text-white' : 'text-white/60'}`}
                            >
                              {players.map((player) => player.name).join(' + ')}
                            </p>
                            <p className="text-[0.6rem] text-white/30">
                              {players.map((player) => player.skillRating.toFixed(2)).join(' / ')}
                            </p>
                          </div>
                          <span
                            data-testid={`score-${team.toLowerCase()}`}
                            className={`font-display text-6xl font-extrabold tabular leading-none ${leading ? 'text-lime' : 'text-white/40'}`}
                          >
                            {score}
                          </span>
                        </div>
                      );
                    })}
                    <p className="mt-3 text-[0.6rem] uppercase tracking-[0.12em] text-white/30">
                      First to {match.scoring.targetScore}
                      {match.games.length > 1
                        ? ` · games ${match.gamesWonA}–${match.gamesWonB}`
                        : ''}
                    </p>
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center px-5 text-center">
                    <MonitorPlay className="size-6 text-white/25" />
                    <p className="mt-2 text-sm font-semibold text-white/60">Next rotation</p>
                    <p className="mt-1 text-[0.65rem] text-white/30">Stay close to the court.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Players', data.counts.checkedIn],
            ['Waiting', data.counts.waiting],
            ['Completed', data.results.length],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4"
            >
              <p className="font-display text-3xl font-extrabold tabular">{value}</p>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-white/35">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between text-[0.62rem] text-white/30">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> Scores update automatically after each point.
          </span>
          <Link href={`/public/sessions/${data.id}`} className="hover:text-white/60">
            Upcoming & results
          </Link>
        </div>
      </main>
    </div>
  );
}
