'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  Plus,
  Radio,
  Settings2,
  ShieldCheck,
  Users,
  Volleyball,
} from 'lucide-react';
import { useClub, useClubSessions } from '@/lib/queries';
import { formatRange, formatShortDay } from '@/lib/format';
import { PageHeader, SectionHeading, StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { SessionStatusBadge } from '@/components/session/status';
import { ClubAdminNav } from '@/components/manage/club-admin-nav';

export default function ClubAdminPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const clubQuery = useClub(clubId);
  const sessions = useClubSessions(clubId);
  const club = clubQuery.data;

  if (clubQuery.isLoading || sessions.isLoading) return <PageSkeleton />;
  if (clubQuery.isError || !club) {
    return (
      <ErrorState
        title="Club unavailable"
        error={clubQuery.error}
        onRetry={() => void clubQuery.refetch()}
      />
    );
  }

  const live = sessions.data?.find((session) => session.status === 'LIVE');
  const next = sessions.data?.find((session) =>
    ['SCHEDULED', 'CHECK_IN_OPEN'].includes(session.status),
  );
  const upcoming =
    sessions.data?.filter((session) =>
      ['DRAFT', 'SCHEDULED', 'CHECK_IN_OPEN'].includes(session.status),
    ) ?? [];
  const checkedIn = sessions.data?.reduce((sum, session) => sum + (session.checkedIn ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Club management"
        title={club.name}
        description={club.description ?? 'Manage members, courts and sessions for this club.'}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/public/clubs/${club.slug}`} target="_blank">
                Public page
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/manage/sessions/new?club=${club.id}`}>
                <Plus className="size-4" /> New session
              </Link>
            </Button>
          </>
        }
      />

      <div className="overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-soft">
        <div className="relative bg-forest px-5 py-5 text-white sm:px-6">
          <div className="pickle-pattern absolute inset-0 opacity-30" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={club.name} size="lg" color="#c9f56a" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="lime">{club.viewerRole}</Badge>
                  <Badge tone="neutral">{club.joinPolicy.toLowerCase()}</Badge>
                </div>
                <p className="mt-1.5 flex items-center gap-2 text-xs text-white/55">
                  <MapPin className="size-3.5" /> {club.location ?? 'Location not set'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={`/manage/clubs/${clubId}/settings`}>
                  <Settings2 className="size-3.5" /> Settings
                </Link>
              </Button>
              <Button asChild variant="accent" size="sm">
                <Link href={`/manage/clubs/${clubId}/members`}>
                  <Users className="size-3.5" /> Members
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <ClubAdminNav clubId={clubId} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active members"
          value={club.memberCount ?? 0}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Sessions"
          value={sessions.data?.length ?? 0}
          icon={<CalendarDays className="size-4" />}
        />
        <StatCard
          label="Checked in"
          value={checkedIn}
          accent
          icon={<ClipboardCheck className="size-4" />}
        />
        <StatCard
          label="Courts"
          value={next?.courts.length ?? live?.courts.length ?? 0}
          icon={<Volleyball className="size-4" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          {live ? (
            <div className="relative overflow-hidden rounded-[1.5rem] bg-forest p-5 text-white">
              <div className="pickle-pattern absolute inset-0 opacity-30" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge tone="lime" dot>
                    Live now
                  </Badge>
                  <h2 className="mt-2 font-display text-2xl font-bold">{live.name}</h2>
                  <p className="mt-1 text-xs text-white/55">
                    {live.checkedIn ?? 0} checked in Â· {live.playing ?? 0} on court Â·{' '}
                    {live.waiting ?? 0} waiting
                  </p>
                </div>
                <Button asChild variant="accent" size="sm">
                  <Link href={`/manage/sessions/${live.id}`}>
                    <Radio className="size-3.5" /> Open live board
                  </Link>
                </Button>
              </div>
            </div>
          ) : next ? (
            <Card className="border-[#d9edb2] bg-lime-soft/40">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <SessionStatusBadge status={next.status} />
                  <h2 className="mt-2 font-display text-xl font-bold">{next.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatShortDay(next.startsAt, next.timezone)} Â·{' '}
                    {formatRange(next.startsAt, next.endsAt, next.timezone)}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/manage/sessions/${next.id}`}>
                    Open session <ChevronRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-8 text-center">
                <CalendarPlus className="size-6 text-primary/60" />
                <h2 className="mt-2 font-display text-lg font-bold">No active session</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create the next open play for this club.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link href={`/manage/sessions/new?club=${clubId}`}>Create session</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div>
            <SectionHeading
              title="Upcoming sessions"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/manage/sessions?club=${clubId}`}>
                    All <ChevronRight className="size-3.5" />
                  </Link>
                </Button>
              }
            />
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    href={`/manage/sessions/${session.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                      <CalendarDays className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold">{session.name}</p>
                        <SessionStatusBadge status={session.status} />
                      </div>
                      <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                        {formatShortDay(session.startsAt, session.timezone)} Â·{' '}
                        {session.registered ?? 0} registered Â· {session.checkedIn ?? 0} checked in
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No upcoming sessions" description="The club calendar is clear." />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-base font-bold">Club tools</h2>
              <div className="mt-3 space-y-1">
                {[
                  {
                    href: `/manage/clubs/${clubId}/members`,
                    label: 'Members & invitations',
                    icon: Users,
                  },
                  { href: `/manage/clubs/${clubId}/courts`, label: 'Courts', icon: Volleyball },
                  {
                    href: `/manage/sessions/new?club=${clubId}`,
                    label: 'Create a session',
                    icon: CalendarPlus,
                  },
                  {
                    href: `/manage/clubs/${clubId}/settings`,
                    label: 'Club settings',
                    icon: Settings2,
                  },
                  {
                    href: `/manage/clubs/${clubId}/audit`,
                    label: 'Audit history',
                    icon: ShieldCheck,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex min-h-10 items-center gap-2.5 rounded-xl px-2.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-secondary/60"
                    >
                      <span className="grid size-7 place-items-center rounded-lg bg-secondary text-primary">
                        <Icon className="size-3.5" />
                      </span>
                      {item.label}
                      <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <div className="rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/60 p-5">
            <Building2 className="size-5 text-[#486b1c]" />
            <p className="mt-2 font-display text-sm font-bold text-[#385513]">Club ownership</p>
            <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
              Only the owner can change roles, invite Queue Masters, transfer ownership or archive
              the club.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
