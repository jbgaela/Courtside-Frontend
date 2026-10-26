'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, CalendarDays, MapPin, Settings, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useClub, useClubSessions } from '@/lib/queries';
import { formatRange, formatShortDay } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { SessionStatusBadge } from '@/components/session/status';

export default function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const clubQuery = useClub(slug);
  const sessions = useClubSessions(clubQuery.data?.id);
  const [joining, setJoining] = useState(false);
  const club = clubQuery.data;
  const isMember = Boolean(club?.viewerRole) && club?.membershipStatus === 'ACTIVE';
  const isPending = club?.membershipStatus === 'PENDING';
  const isAdmin =
    club?.viewerRole === 'OWNER' ||
    Boolean(club?.viewerPermissions?.some((permission) => permission !== 'club.view'));

  if (clubQuery.isLoading) return <PageSkeleton />;
  if (clubQuery.isError || !club) {
    return (
      <ErrorState
        title="Club not found"
        error={clubQuery.error}
        onRetry={() => void clubQuery.refetch()}
      />
    );
  }

  const join = async () => {
    setJoining(true);
    try {
      await api.post(`/api/v1/clubs/${club.id}/join`, {});
      await queryClient.invalidateQueries({ queryKey: ['club', slug] });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(club.joinPolicy === 'OPEN' ? 'You joined the club' : 'Membership requested');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not join the club');
    } finally {
      setJoining(false);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/public/clubs/${club.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public club link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/discover">
            <ArrowLeft className="size-4" /> Discover
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
        <div className="relative bg-forest px-5 py-6 text-white sm:px-7">
          <div className="pickle-pattern absolute inset-0 opacity-30" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={club.name} size="xl" color="#c9f56a" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="lime">Club</Badge>
                  {isMember ? <Badge tone="neutral">{club.viewerRole}</Badge> : null}
                  {isPending ? <Badge tone="warning">Approval pending</Badge> : null}
                </div>
                <h1 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
                  {club.name}
                </h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/55">
                  <MapPin className="size-3.5" /> {club.location ?? 'Location to be confirmed'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAdmin ? (
                <Button asChild variant="accent" size="sm">
                  <Link href={`/manage/clubs/${club.id}`}>
                    <Settings className="size-3.5" /> Manage club
                  </Link>
                </Button>
              ) : isMember ? (
                <Badge tone="success" dot>
                  Member
                </Badge>
              ) : isPending ? (
                <Badge tone="warning">Awaiting approval</Badge>
              ) : (
                <Button variant="accent" size="sm" onClick={() => void join()} disabled={joining}>
                  {joining
                    ? 'Joining…'
                    : club.joinPolicy === 'OPEN'
                      ? 'Join club'
                      : 'Request to join'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => void share()}
              >
                <Share2 className="size-3.5" /> Share
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:p-7">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {club.description ?? 'This club has not added a description yet.'}
          </p>
          <div className="flex gap-4 text-center">
            <div className="rounded-xl bg-secondary/70 px-4 py-2">
              <p className="font-display text-lg font-extrabold tabular">{club.memberCount ?? 0}</p>
              <p className="text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground">
                Members
              </p>
            </div>
            <div className="rounded-xl bg-secondary/70 px-4 py-2">
              <p className="font-display text-lg font-extrabold tabular">
                {club.upcomingSessions ?? 0}
              </p>
              <p className="text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground">
                Sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Sessions</h2>
            {isAdmin ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/manage/clubs/${club.id}`}>
                  <CalendarDays className="size-3.5" /> Manage sessions
                </Link>
              </Button>
            ) : null}
          </div>
          {!isMember && !isPending ? (
            <EmptyState
              title="Members see the full schedule"
              description="Join this club to register for open play and receive session updates."
              icon={<Users className="size-5" />}
              action={
                <Button size="sm" onClick={() => void join()} disabled={joining}>
                  {club.joinPolicy === 'OPEN' ? 'Join club' : 'Request to join'}
                </Button>
              }
            />
          ) : isPending ? (
            <EmptyState
              title="Your request is with the club owner"
              description="Once approved, this club's sessions will appear here."
              icon={<Building2 className="size-5" />}
            />
          ) : sessions.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((index) => (
                <div key={index} className="h-32 animate-pulse rounded-[1.35rem] bg-secondary/60" />
              ))}
            </div>
          ) : sessions.data && sessions.data.length > 0 ? (
            <div className="space-y-3">
              {sessions.data.map((session) => (
                <Link
                  key={session.id}
                  href={`/app/sessions/${session.id}`}
                  className="block rounded-[1.35rem] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <SessionStatusBadge status={session.status} />
                      <h3 className="mt-2 font-display text-lg font-bold">{session.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatShortDay(session.startsAt, session.timezone)} ·{' '}
                        {formatRange(session.startsAt, session.endsAt, session.timezone)}
                      </p>
                    </div>
                    <Badge tone="neutral">
                      {session.format === 'DOUBLES' ? 'Doubles' : 'Singles'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 border-t border-border/70 pt-3 text-[0.68rem] text-muted-foreground">
                    <span>{session.checkedIn ?? 0} checked in</span>
                    <span>{session.courts.length} courts</span>
                    <span>{session.capacity} capacity</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No sessions scheduled"
              description="The club has not published any sessions yet."
              icon={<CalendarDays className="size-5" />}
            />
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-display text-base font-bold">Club details</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Join policy</dt>
                  <dd className="font-semibold">
                    {club.joinPolicy === 'OPEN'
                      ? 'Open'
                      : club.joinPolicy === 'APPROVAL'
                        ? 'Approval'
                        : 'Invite only'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Your role</dt>
                  <dd className="font-semibold">{club.viewerRole ?? 'Not a member'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Public page</dt>
                  <dd>
                    <Link
                      href={`/public/clubs/${club.slug}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <div className="rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/60 p-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#47641d]">
              Fair play
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#3e5716]">
              Sessions are limited by capacity. Check-in is separate from registration so the Queue
              Master knows who is actually on site.
            </p>
          </div>
        </aside>
      </div>
      <p className="text-center text-[0.65rem] text-muted-foreground">
        Signed in as {me?.profile?.displayName ?? me?.name}
      </p>
    </div>
  );
}
