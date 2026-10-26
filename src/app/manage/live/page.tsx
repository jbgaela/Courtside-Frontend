'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Radio, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useClubSessions } from '@/lib/queries';
import { formatRange, formatShortDay } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { SessionStatusBadge } from '@/components/session/status';

export default function ManageLivePage() {
  const { me } = useAuth();
  const adminClubs = useMemo(
    () =>
      me?.memberships.filter((membership) => membership.canManage) ?? [],
    [me],
  );
  const [clubId, setClubId] = useState(() => adminClubs[0]?.clubId ?? '');
  const sessions = useClubSessions(clubId || undefined);
  const liveSessions =
    sessions.data?.filter((session) => ['LIVE', 'CHECK_IN_OPEN'].includes(session.status)) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live operations"
        title="Courts, right now"
        description="One board per session. Courts, queue and the next rotation stay in sync."
        actions={
          <div className="flex items-center gap-2">
            {adminClubs.length > 1 ? (
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
            ) : null}
            <Button variant="outline" size="sm" onClick={() => void sessions.refetch()}>
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          </div>
        }
      />

      {sessions.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((index) => (
            <Skeleton key={index} className="h-56 rounded-[1.35rem]" />
          ))}
        </div>
      ) : sessions.isError ? (
        <ErrorState error={sessions.error} onRetry={() => void sessions.refetch()} />
      ) : liveSessions.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {liveSessions.map((session) => (
            <Card key={session.id} className="overflow-hidden">
              <div className="relative bg-forest px-5 py-4 text-white">
                <div className="pickle-pattern absolute inset-0 opacity-30" />
                <div className="relative flex items-center justify-between">
                  <SessionStatusBadge status={session.status} />
                  <span className="text-[0.62rem] text-white/50">
                    {formatRange(session.startsAt, session.endsAt, session.timezone)}
                  </span>
                </div>
                <h2 className="relative mt-2 font-display text-xl font-bold">{session.name}</h2>
                <p className="relative mt-0.5 text-xs text-white/55">
                  {formatShortDay(session.startsAt, session.timezone)} ·{' '}
                  {session.venue ?? 'Venue TBA'}
                </p>
              </div>
              <CardContent className="p-5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['In', session.checkedIn ?? 0],
                    ['Waiting', session.waiting ?? 0],
                    ['Courts', session.courts.length],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-secondary/60 py-2">
                      <p className="font-display text-lg font-extrabold tabular">{value}</p>
                      <p className="text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild className="flex-1" size="sm">
                    <Link href={`/manage/sessions/${session.id}`}>
                      <Radio className="size-3.5" />{' '}
                      {session.status === 'LIVE' ? 'Live board' : 'Open session'}
                    </Link>
                  </Button>
                  {session.status === 'CHECK_IN_OPEN' ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/manage/sessions/${session.id}/check-in`}>Check-in</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No live sessions"
          description="Open check-in or start a session from its board."
          icon={<Radio className="size-5" />}
          action={
            <Button asChild size="sm">
              <Link href={`/manage/sessions?club=${clubId}`}>Open sessions</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
