import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MatchStatusBadge } from '@/components/session/status';
import type { MatchView } from '@/lib/types';
import { cn } from '@/lib/utils';
import { firstName } from '@/lib/format';

function TeamRow({
  players,
  score,
  winner,
  tone,
}: {
  players: MatchView['teams']['A'];
  score: number;
  winner: boolean;
  tone: 'light' | 'dark';
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            winner ? 'bg-[#71b51b]' : tone === 'dark' ? 'bg-white/20' : 'bg-border',
          )}
        />
        <p
          className={cn(
            'truncate text-xs font-semibold',
            tone === 'dark'
              ? winner
                ? 'text-white'
                : 'text-white/60'
              : winner
                ? 'text-foreground'
                : 'text-muted-foreground',
          )}
        >
          {players.map((player) => firstName(player.displayName)).join(' + ')}
        </p>
      </div>
      <span
        className={cn(
          'w-7 text-right font-display text-2xl font-extrabold tabular leading-none',
          winner
            ? tone === 'dark'
              ? 'text-lime'
              : 'text-primary'
            : tone === 'dark'
              ? 'text-white/45'
              : 'text-muted-foreground',
        )}
      >
        {score}
      </span>
    </div>
  );
}

export function MatchScoreCard({
  match,
  href,
  tone = 'light',
  className,
}: {
  match: MatchView;
  href: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const scoreA = match.currentGame?.a ?? 0;
  const scoreB = match.currentGame?.b ?? 0;
  const winnerA = match.winnerTeam === 'A' || (match.status === 'IN_PROGRESS' && scoreA > scoreB);
  const winnerB = match.winnerTeam === 'B' || (match.status === 'IN_PROGRESS' && scoreB > scoreA);
  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-[1.25rem] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift',
        tone === 'dark'
          ? 'border-white/10 bg-white/[0.055] text-white'
          : 'border-border bg-card shadow-soft',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[0.6rem] font-bold uppercase tracking-[0.12em]',
              tone === 'dark' ? 'text-white/45' : 'text-muted-foreground',
            )}
          >
            {match.court.name} · R{match.round}
          </span>
          <MatchStatusBadge status={match.status} />
        </div>
        <ChevronRight
          className={cn(
            'size-4 transition-transform group-hover:translate-x-0.5',
            tone === 'dark' ? 'text-white/35' : 'text-muted-foreground',
          )}
        />
      </div>

      <div className="mt-3 divide-y divide-border/50">
        <TeamRow players={match.teams.A} score={scoreA} winner={winnerA} tone={tone} />
        <TeamRow players={match.teams.B} score={scoreB} winner={winnerB} tone={tone} />
      </div>
      {match.gamesWonA + match.gamesWonB > 0 ? (
        <p
          className={cn(
            'mt-2 text-[0.58rem] font-semibold uppercase tracking-wider',
            tone === 'dark' ? 'text-white/30' : 'text-muted-foreground',
          )}
        >
          Games {match.gamesWonA}–{match.gamesWonB}
        </p>
      ) : null}
    </Link>
  );
}
