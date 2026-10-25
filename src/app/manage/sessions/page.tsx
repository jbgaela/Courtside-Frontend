'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  Plus,
  Radio,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useClubSessions } from '@/lib/queries';
import { formatRange, formatShortDay } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { SessionStatusBadge } from '@/components/session/status';
import { Segmented } from '@/components/ui/segmented';

type Tab = 'upcoming' | 'live' | 'past';

export default function ManageSessionsPage() {
  const { me } = useAuth();
  const adminClubs = useMemo(
    () =>
      me?.memberships.filter(
        (membership) => membership.role === 'OWNER' || membership.role === 'QUEUE_MASTER',
      ) ?? [],
    [me],
  );
  const [clubId, setClubId] = useState(() => adminClubs[0]?.clubId ?? '');
  const [tab, setTab] = useState<Tab>('upcoming');
  const sessions = useClubSessions(clubId || undefined);
  const filtered = sessions.data?.filter((session) => {
    if (tab === 'live') return session.status === 'LIVE' || session.status === 'CHECK_IN_OPEN';
    if (tab === 'past') return ['COMPLETED', 'CANCELLED'].includes(session.status);
    return ['DRAFT', 'SCHEDULED', 'CHECK_IN_OPEN'].includes(session.status);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sessions"
        title="Session operations"
        description="Build, publish and run every open play from one place."
        actions={
          <>
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
            <Button asChild>
              <Link href={`/manage/sessions/new?club=${clubId}`}>
                <Plus className="size-4" /> New session
              </Link>
            </Button>
          </>
        }
      />

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          {
            value: 'upcoming',
            label: 'Upcoming',
            count: sessions.data?.filter((s) =>
              ['DRAFT', 'SCHEDULED', 'CHECK_IN_OPEN'].includes(s.status),
            ).length,
          },
          {
            value: 'live',
            label: 'Live',
            count: sessions.data?.filter((s) => ['LIVE', 'CHECK_IN_OPEN'].includes(s.status))
              .length,
          },
          { value: 'past', label: 'Past' },
        ]}
      />

      {sessions.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-32 rounded-[1.35rem]" />
          ))}
        </div>
      ) : sessions.isError ? (
        <ErrorState error={sessions.error} onRetry={() => void sessions.refetch()} />
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((session) => (
            <Card key={session.id} className="transition-all hover:shadow-lift">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SessionStatusBadge status={session.status} />
                      <Badge tone="neutral">
                        {session.format === 'DOUBLES' ? 'Doubles' : 'Singles'}
                      </Badge>
                      {session.published ? (
                        <Badge tone="info">Published</Badge>
                      ) : (
                        <Badge tone="warning">Draft</Badge>
                      )}
                    </div>
                    <h2 className="mt-2 font-display text-xl font-bold tracking-tight">
                      {session.name}
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {formatShortDay(session.startsAt, session.timezone)} ·{' '}
                        {formatRange(session.startsAt, session.endsAt, session.timezone)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" /> {session.venue ?? 'Venue TBA'}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.68rem] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5" /> {session.registered ?? 0} registered
                      </span>
                      <span>{session.checkedIn ?? 0} checked in</span>
                      <span>{session.waiting ?? 0} waiting</span>
                      <span>{session.courts.length} courts</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {session.status === 'LIVE' ? (
                      <Button asChild size="sm">
                        <Link href={`/manage/sessions/${session.id}`}>
                          <Radio className="size-3.5" /> Live board
                        </Link>
                      </Button>
                    ) : null}
                    {['CHECK_IN_OPEN', 'LIVE'].includes(session.status) ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/manage/sessions/${session.id}/check-in`}>
                          <ClipboardCheck className="size-3.5" /> Check-in
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/manage/sessions/${session.id}`}>
                        {session.status === 'DRAFT' ? 'Configure' : 'Open'}{' '}
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm" aria-label="Session settings">
                      <Link href={`/manage/sessions/${session.id}/settings`}>
                        <SlidersHorizontal className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            tab === 'live'
              ? 'No live sessions'
              : tab === 'past'
                ? 'No completed sessions'
                : 'No sessions yet'
          }
          description="Create a session with courts, matchmaking rules and scoring."
          icon={<CalendarPlus className="size-5" />}
          action={
            <Button asChild size="sm">
              <Link href={`/manage/sessions/new?club=${clubId}`}>Create a session</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
