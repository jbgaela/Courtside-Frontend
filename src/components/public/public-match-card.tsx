import { cn } from '@/lib/utils';
import type { PublicMatch } from '@/lib/types';

export function PublicMatchCard({
  match,
  tone = 'light',
  className,
}: {
  match: PublicMatch;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const scoreA = match.currentGame.a;
  const scoreB = match.currentGame.b;
  const aWins = match.winnerTeam === 'A' || (match.status === 'IN_PROGRESS' && scoreA > scoreB);
  const bWins = match.winnerTeam === 'B' || (match.status === 'IN_PROGRESS' && scoreB > scoreA);
  return (
    <div
      className={cn(
        'rounded-[1.3rem] border p-4',
        tone === 'dark'
          ? 'border-white/10 bg-white/[0.055] text-white'
          : 'border-border bg-card shadow-soft',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            'text-[0.6rem] font-bold uppercase tracking-[0.13em]',
            tone === 'dark' ? 'text-white/40' : 'text-muted-foreground',
          )}
        >
          {match.court.name} Â· Round {match.round}
        </p>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider',
            match.status === 'IN_PROGRESS'
              ? 'bg-lime-soft text-[#4d711a]'
              : tone === 'dark'
                ? 'bg-white/10 text-white/50'
                : 'bg-secondary text-muted-foreground',
          )}
        >
          {match.status === 'IN_PROGRESS' ? 'Live' : match.status.toLowerCase()}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {(['A', 'B'] as const).map((team) => {
          const players = match.teams[team];
          const winner = team === 'A' ? aWins : bWins;
          const score = team === 'A' ? scoreA : scoreB;
          return (
            <div key={team} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-xs font-semibold',
                    tone === 'dark'
                      ? winner
                        ? 'text-white'
                        : 'text-white/55'
                      : winner
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {players.map((player) => player.name).join(' + ')}
                </p>
                <p
                  className={cn(
                    'text-[0.55rem]',
                    tone === 'dark' ? 'text-white/30' : 'text-muted-foreground',
                  )}
                >
                  {players.map((player) => player.skillRating.toFixed(2)).join(' / ')}
                </p>
              </div>
              <span
                className={cn(
                  'font-display text-3xl font-extrabold tabular leading-none',
                  winner
                    ? tone === 'dark'
                      ? 'text-lime'
                      : 'text-primary'
                    : tone === 'dark'
                      ? 'text-white/50'
                      : 'text-muted-foreground',
                )}
              >
                {score}
              </span>
            </div>
          );
        })}
      </div>

      {match.games.length > 1 ? (
        <div
          className={cn(
            'mt-3 flex gap-1.5 border-t pt-2',
            tone === 'dark' ? 'border-white/10' : 'border-border/60',
          )}
        >
          {match.games.map((game, index) => (
            <span
              key={index}
              className={cn(
                'rounded px-1.5 py-0.5 text-[0.55rem] font-bold tabular',
                tone === 'dark'
                  ? 'bg-white/10 text-white/60'
                  : 'bg-secondary text-muted-foreground',
              )}
            >
              {game.a}â€“{game.b}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
