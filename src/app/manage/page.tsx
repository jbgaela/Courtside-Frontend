'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  MapPin,
  Plus,
  Radio,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useClubSessions, useClub } from '@/lib/queries';
import { formatRange, formatShortDay, greeting } from '@/lib/format';
import { PageHeader, SectionHeading, StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, LiveBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { SessionStatusBadge } from '@/components/session/status';

export default function ManageDashboardPage() {
  const { me } = useAuth();
  const adminClubs = useMemo(
    () =>
      me?.memberships.filter(
        (membership) => membership.role === 'OWNER' || membership.role === 'QUEUE_MASTER',
      ) ?? [],
    [me],
  );
  const [clubId, setClubId] = useState<string>(() => adminClubs[0]?.clubId ?? '');
  const club = useClub(clubId || undefined);
  const sessions = useClubSessions(clubId || undefined);
  const activeClub = adminClubs.find((entry) => entry.clubId === clubId) ?? adminClubs[0];

  if (!me) return <PageSkeleton />;
  if (adminClubs.length === 0) {
    return (
      <EmptyState
        title="No clubs to manage"
        description="Create a club or ask an owner to make you a Queue Master."
        action={
          <Button asChild>
            <Link href="/app/clubs/new">Create a club</Link>
          </Button>
        }
      />
    );
  }

  const live = sessions.data?.find((session) => session.status === 'LIVE');
  const checking = sessions.data?.find((session) => session.status === 'CHECK_IN_OPEN');
  const upcoming = sessions.data
    ?.filter((session) => ['DRAFT', 'SCHEDULED', 'CHECK_IN_OPEN'].includes(session.status))
    .slice(0, 4);
  const checkedIn =
    sessions.data?.reduce((total, session) => total + (session.checkedIn ?? 0), 0) ?? 0;
  const courts = live?.courts.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${greeting()}, Queue Master`}
        title={
          <>
            {activeClub?.clubName ?? 'Your club'}
            <span className="ml-2 inline-block translate-y-[-2px] rounded-full bg-secondary px-2.5 py-1 align-middle text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {activeClub?.role === 'OWNER' ? 'Owner' : 'Queue Master'}
            </span>
          </>
        }
        description="Run a fair, calm session. The queue and courts stay in sync across every tablet."
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
              <Link href={`/manage/sessions/new?club=${clubId || activeClub?.clubId || ''}`}>
                <Plus className="size-4" /> New session
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Sessions today"
          value={sessions.data?.length ?? 0}
          icon={<CalendarDays className="size-4" />}
        />
        <StatCard label="Checked in" value={checkedIn} icon={<Users className="size-4" />} accent />
        <StatCard label="Live courts" value={courts} icon={<Radio className="size-4" />} />
        <StatCard
          label="Club members"
          value={club.data?.memberCount ?? 0}
          icon={<CircleUserRound className="size-4" />}
        />
      </div>

      {sessions.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
          <div className="h-80 animate-pulse rounded-[1.5rem] bg-secondary/60" />
          <div className="h-80 animate-pulse rounded-[1.5rem] bg-secondary/60" />
        </div>
      ) : sessions.isError ? (
        <ErrorState error={sessions.error} onRetry={() => void sessions.refetch()} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.5fr)]">
          <div className="min-w-0 space-y-5">
            {live ? (
              <div className="relative overflow-hidden rounded-[1.6rem] bg-forest p-5 text-white sm:p-6">
                <div className="pickle-pattern absolute inset-0 opacity-30" />
                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <LiveBadge />
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/45">
                        Session live · {live.courts.length} courts
                      </span>
                    </div>
                    <span className="text-[0.65rem] text-white/50">
                      {formatRange(live.startsAt, live.endsAt, live.timezone)}
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
                    {live.name}
                  </h2>
                  <p className="mt-1 text-xs text-white/55">{live.venue ?? 'Venue TBA'}</p>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      ['Checked in', live.checkedIn ?? 0],
                      ['Waiting', live.waiting ?? 0],
                      ['Playing', live.playing ?? 0],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="min-w-0 rounded-xl bg-white/[0.07] px-2 py-2.5 sm:px-3"
                      >
                        <p className="font-display text-xl font-extrabold tabular sm:text-2xl">
                          {value}
                        </p>
                        <p className="text-[0.55rem] font-semibold uppercase leading-tight tracking-[0.06em] text-white/45 sm:text-[0.58rem] sm:tracking-[0.1em]">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild variant="accent" size="sm">
                      <Link href={`/manage/sessions/${live.id}`}>
                        <Radio className="size-3.5" /> Live board
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                      <Link href={`/manage/sessions/${live.id}/check-in`}>
                        <ClipboardCheck className="size-3.5" /> Check-in
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Link href={`/public/sessions/${live.publicId}`} target="_blank">
                        Public link <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : checking ? (
              <Card className="border-[#d9edb2] bg-lime-soft/40">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Badge tone="success" dot>
                      Check-in open
                    </Badge>
                    <h2 className="mt-2 font-display text-xl font-bold">{checking.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {checking.checkedIn ?? 0} checked in · {checking.registered ?? 0} registered ·
                      starts {formatRange(checking.startsAt, checking.endsAt, checking.timezone)}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/manage/sessions/${checking.id}/check-in`}>
                      Open check-in <ChevronRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center py-10 text-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
                    <CalendarPlus className="size-5" />
                  </span>
                  <h2 className="mt-3 font-display text-lg font-bold">No session running</h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Create a session, open check-in and start the first rotation.
                  </p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href={`/manage/sessions/new?club=${clubId || activeClub?.clubId || ''}`}>
                      <Plus className="size-3.5" /> Create session
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <div>
              <SectionHeading
                title="Sessions"
                description="Drafts, upcoming and in-progress sessions."
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/manage/sessions">
                      All sessions <ChevronRight className="size-3.5" />
                    </Link>
                  </Button>
                }
              />
              {upcoming && upcoming.length > 0 ? (
                <div className="space-y-2">
                  {upcoming.map((session) => (
                    <Link
                      key={session.id}
                      href={`/manage/sessions/${session.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                    >
                      <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                        <CalendarDays className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <p
                            className="min-w-0 flex-1 basis-24 truncate text-sm font-bold"
                            title={session.name}
                          >
                            {session.name}
                          </p>
                          <SessionStatusBadge status={session.status} />
                        </div>
                        <p className="mt-1 text-[0.68rem] leading-relaxed text-muted-foreground">
                          {formatShortDay(session.startsAt, session.timezone)} ·{' '}
                          {formatRange(session.startsAt, session.endsAt, session.timezone)} ·{' '}
                          {session.registered ?? 0} registered
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming sessions"
                  description="Build the next open play in a few steps."
                  action={
                    <Button asChild size="sm">
                      <Link
                        href={`/manage/sessions/new?club=${clubId || activeClub?.clubId || ''}`}
                      >
                        Create session
                      </Link>
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          <aside className="min-w-0 space-y-4">
            <Card>
              <CardContent className="p-5">
                <h2 className="font-display text-base font-bold">Quick actions</h2>
                <div className="mt-3 grid gap-2">
                  {[
                    {
                      href: `/manage/sessions/new?club=${clubId}`,
                      label: 'Create a session',
                      icon: CalendarPlus,
                    },
                    { href: '/manage/live', label: 'Open live courts', icon: Radio },
                    { href: `/manage/clubs/${clubId}`, label: 'Club settings', icon: Settings },
                    {
                      href: `/manage/clubs/${clubId}/members`,
                      label: 'Invite a Queue Master',
                      icon: Users,
                    },
                    {
                      href: `/manage/clubs/${clubId}/courts`,
                      label: 'Manage courts',
                      icon: MapPin,
                    },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-foreground/80 transition-colors max-sm:min-h-11 hover:bg-secondary/60"
                      >
                        <span className="grid size-7 place-items-center rounded-lg bg-secondary text-primary">
                          <Icon className="size-3.5" />
                        </span>
                        {action.label}
                        <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/60 p-5">
              <Sparkles className="size-5 text-[#486b1c]" />
              <p className="mt-2 font-display text-base font-bold text-[#385513]">
                Fair rotation check
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
                The engine protects the longest waiters and caps the games-played gap. Review the
                preview reasons before you commit.
              </p>
            </div>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={me.profile?.displayName ?? me.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-bold"
                      title={me.profile?.displayName ?? me.name}
                    >
                      {me.profile?.displayName ?? me.name}
                    </p>
                    <p className="mt-0.5 truncate text-[0.62rem] text-muted-foreground">
                      {activeClub?.clubName}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                  <Link href="/app">Switch to player view</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
