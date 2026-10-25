'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, Power, Save, Volleyball } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys, useClub, useClubCourts } from '@/lib/queries';
import { PageHeader, StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select } from '@/components/ui/input';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { ClubAdminNav } from '@/components/manage/club-admin-nav';

export default function ClubCourtsPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const queryClient = useQueryClient();
  const club = useClub(clubId);
  const courts = useClubCourts(clubId);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  if (club.isLoading || courts.isLoading) return <PageSkeleton />;
  if (club.isError || !club.data) {
    return (
      <ErrorState title="Club unavailable" error={club.error} onRetry={() => void club.refetch()} />
    );
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.courts(clubId) });

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('create');
    try {
      await api.post(`/api/v1/clubs/${clubId}/courts`, { name, sortOrder });
      setName('');
      setSortOrder(0);
      await refresh();
      toast.success('Court added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add the court');
    } finally {
      setBusy(null);
    }
  };

  const update = async (
    courtId: string,
    data: { name?: string; status?: string; sortOrder?: number },
  ) => {
    setBusy(courtId);
    try {
      await api.patch(`/api/v1/clubs/${clubId}/courts/${courtId}`, data);
      await refresh();
      toast.success('Court updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the court');
    } finally {
      setBusy(null);
    }
  };

  const deactivate = async (courtId: string, courtName: string) => {
    if (
      !window.confirm(`Deactivate ${courtName}? It will be removed from future session rotations.`)
    )
      return;
    setBusy(courtId);
    try {
      await api.delete(`/api/v1/clubs/${clubId}/courts/${courtId}`);
      await refresh();
      toast.success(`${courtName} deactivated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not deactivate the court');
    } finally {
      setBusy(null);
    }
  };

  const rows = courts.data ?? [];
  const available = rows.filter((court) => court.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/manage/clubs/${clubId}`}>
            <ArrowLeft className="size-4" /> {club.data.name}
          </Link>
        </Button>
        <Badge tone="neutral">{club.data.viewerRole}</Badge>
      </div>
      <PageHeader
        eyebrow="Courts"
        title="Courts and availability"
        description="Courts belong to the club. Sessions select which courts are in use."
      />
      <ClubAdminNav clubId={clubId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total courts"
          value={rows.length}
          icon={<Volleyball className="size-4" />}
        />
        <StatCard
          label="Available"
          value={available}
          accent
          icon={<Volleyball className="size-4" />}
        />
        <StatCard label="Out of service" value={rows.length - available} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardContent className="p-5">
            <h2 className="font-display text-lg font-bold">Club courts</h2>
            <div className="mt-3 space-y-2">
              {rows.map((court) => (
                <div
                  key={court.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/50 p-3"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
                    <Volleyball className="size-4" />
                  </span>
                  <input
                    defaultValue={court.name}
                    onBlur={(event) => {
                      if (event.target.value && event.target.value !== court.name) {
                        void update(court.id, { name: event.target.value });
                      }
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-bold hover:border-border focus:border-ring focus:outline-none"
                    aria-label={`Name for ${court.name}`}
                  />
                  <Select
                    value={court.status}
                    onChange={(event) => void update(court.id, { status: event.target.value })}
                    className="h-8 w-auto min-w-32 text-xs"
                    aria-label={`Status for ${court.name}`}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => void deactivate(court.id, court.name)}
                    disabled={busy !== null || court.status === 'INACTIVE'}
                    aria-label={`Deactivate ${court.name}`}
                  >
                    {busy === court.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Power className="size-3.5" />
                    )}
                  </Button>
                </div>
              ))}
              {rows.length === 0 ? (
                <EmptyState
                  title="No courts yet"
                  description="Add your first court to start creating sessions."
                  icon={<Volleyball className="size-5" />}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <aside>
          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-base font-bold">Add a court</h2>
              <form className="mt-3 space-y-3" onSubmit={(event) => void create(event)}>
                <Field label="Court name" htmlFor="courtName">
                  <Input
                    id="courtName"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Court 4"
                    maxLength={60}
                    required
                  />
                </Field>
                <Field label="Sort order" htmlFor="sortOrder" hint="Lower numbers appear first.">
                  <Input
                    id="sortOrder"
                    type="number"
                    min={0}
                    max={100}
                    value={sortOrder}
                    onChange={(event) => setSortOrder(Number(event.target.value))}
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={busy !== null || !name.trim()}>
                  {busy === 'create' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add court
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="mt-4 rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/60 p-5">
            <Save className="size-5 text-[#486b1c]" />
            <p className="mt-2 font-display text-sm font-bold text-[#385513]">
              History is preserved
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
              Courts are deactivated, never deleted, so completed matches keep a valid court
              reference.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
