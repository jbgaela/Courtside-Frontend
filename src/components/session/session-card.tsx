import Link from 'next/link';
import { CalendarDays, Clock3, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SessionStatusBadge } from '@/components/session/status';
import { formatRange, formatShortDay } from '@/lib/format';
import type { SessionRecord, UpcomingSession } from '@/lib/types';
import { cn } from '@/lib/utils';

export function SessionCard({
  session,
  href,
  compact = false,
  className,
}: {
  session: SessionRecord;
  href: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group block min-w-0 rounded-[1.35rem] border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lift sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusBadge status={session.status} />
            {session.published ? <Badge tone="neutral">Public</Badge> : null}
          </div>
          <h3 className="mt-2 line-clamp-2 break-words font-display text-lg font-bold tracking-tight">
            {session.name}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {formatShortDay(session.startsAt, session.timezone)} ·{' '}
            {formatRange(session.startsAt, session.endsAt, session.timezone)}
          </p>
        </div>
        <span className="rounded-full bg-secondary p-2 text-primary transition-colors group-hover:bg-lime-soft">
          <CalendarDays className="size-4" />
        </span>
      </div>
      {!compact ? (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-[0.68rem] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {session.checkedIn ?? 0} in
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> {session.waiting ?? 0} waiting
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {session.courts.length} courts
          </span>
        </div>
      ) : null}
    </Link>
  );
}

export function UpcomingSessionCard({
  session,
  href,
  className,
}: {
  session: UpcomingSession;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group block min-w-0 rounded-[1.35rem] border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lift',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusBadge status={session.status} />
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {session.registrationStatus === 'CHECKED_IN'
                ? 'Checked in'
                : session.registrationStatus === 'REGISTERED'
                  ? 'Registered'
                  : session.registrationStatus}
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 break-words font-display text-lg font-bold">
            {session.name}
          </h3>
          <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
            {session.club.name}
          </p>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-foreground/70">
            {formatShortDay(session.startsAt, session.timezone)} ·{' '}
            {formatRange(session.startsAt, session.endsAt, session.timezone)}
          </p>
        </div>
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
          <CalendarDays className="size-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3 text-[0.68rem] text-muted-foreground">
        <span className="truncate">{session.venue ?? 'Venue to be confirmed'}</span>
        <span>{session.courts.length} courts</span>
      </div>
    </Link>
  );
}
