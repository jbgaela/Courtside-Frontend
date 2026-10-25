'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, MapPin, Search, Users, Plus, ChevronRight } from 'lucide-react';
import { useClubs } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';

const joinPolicyLabel: Record<string, string> = {
  OPEN: 'Open to join',
  APPROVAL: 'Approval required',
  INVITE_ONLY: 'Invite only',
};

export default function DiscoverPage() {
  const { me } = useAuth();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 280);
    return () => clearTimeout(timer);
  }, [search]);
  const clubs = useClubs(debounced);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Discover"
        title="Find your next game"
        description="Browse clubs, join open play, and keep every session in one place."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/clubs/new">
              <Plus className="size-4" /> Create a club
            </Link>
          </Button>
        }
      />

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search clubs or cities"
          className="h-12 rounded-full pl-10 pr-4"
          aria-label="Search clubs"
        />
      </div>

      {clubs.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-52 rounded-[1.35rem]" />
          ))}
        </div>
      ) : clubs.isError ? (
        <ErrorState error={clubs.error} onRetry={() => void clubs.refetch()} />
      ) : clubs.data && clubs.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clubs.data.map((club) => {
            const member = me?.memberships.some((membership) => membership.clubId === club.id);
            return (
              <Card
                key={club.id}
                className="group flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between">
                    <Avatar name={club.name} size="lg" color="#2c6b4a" />
                    <Badge
                      tone={
                        club.joinPolicy === 'OPEN'
                          ? 'success'
                          : club.joinPolicy === 'INVITE_ONLY'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {joinPolicyLabel[club.joinPolicy] ?? club.joinPolicy}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold tracking-tight">
                    {club.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {club.description ?? 'A pickleball club running open play.'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.68rem] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" /> {club.location ?? 'Location TBA'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" /> {club.memberCount ?? 0} members
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-5">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/app/clubs/${club.slug}`}>
                        {member ? 'View club' : 'View & join'}
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
                    {member ? <Badge tone="lime">Member</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={debounced ? 'No clubs match that search' : 'No clubs yet'}
          description={
            debounced
              ? 'Try a different name or city, or create your own club.'
              : 'Be the first to bring a club onto PickleQueue.'
          }
          icon={<Compass className="size-5" />}
          action={
            <Button asChild size="sm">
              <Link href="/app/clubs/new">
                <Plus className="size-3.5" /> Create a club
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
