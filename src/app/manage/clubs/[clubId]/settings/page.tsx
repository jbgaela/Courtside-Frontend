'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Archive,
  Building2,
  Loader2,
  Save,
  Share2,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys, useClub, useMembers } from '@/lib/queries';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { ClubAdminNav } from '@/components/manage/club-admin-nav';

export default function ClubSettingsPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const clubQuery = useClub(clubId);
  const members = useMembers(clubId);
  const club = clubQuery.data;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [joinPolicy, setJoinPolicy] = useState('APPROVAL');
  const [newOwner, setNewOwner] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const isOwner = club?.viewerRole === 'OWNER';

  useEffect(() => {
    if (!club || initialized) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(club.name);
    setDescription(club.description ?? '');
    setLocation(club.location ?? '');
    setJoinPolicy(club.joinPolicy);
    setInitialized(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [club, initialized]);

  if (clubQuery.isLoading) return <PageSkeleton />;
  if (clubQuery.isError || !club) {
    return (
      <ErrorState
        title="Club unavailable"
        error={clubQuery.error}
        onRetry={() => void clubQuery.refetch()}
      />
    );
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/api/v1/clubs/${clubId}`, {
        name,
        description: description || null,
        location: location || null,
        ...(isOwner ? { joinPolicy } : {}),
        expectedVersion: club.version ?? 1,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.club(clubId) }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
      ]);
      toast.success('Club updated');
      setInitialized(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the club');
    } finally {
      setSaving(false);
    }
  };

  const transfer = async () => {
    if (!newOwner) return;
    if (!window.confirm('Transfer ownership? You will become a Queue Master.')) return;
    try {
      await api.post(`/api/v1/clubs/${clubId}/transfer`, { userId: newOwner });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.members(clubId) });
      toast.success('Ownership transferred');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not transfer ownership');
    }
  };

  const archive = async () => {
    if (
      !window.confirm(
        'Archive this club? Upcoming sessions will be cancelled and the club becomes read-only.',
      )
    )
      return;
    try {
      await api.post(`/api/v1/clubs/${clubId}/archive`, {});
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Club archived');
      router.replace('/app');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not archive the club');
    }
  };

  const ownerCandidates = (members.data ?? []).filter(
    (member) => member.role !== 'OWNER' && member.status === 'ACTIVE',
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/manage/clubs/${clubId}`}>
            <ArrowLeft className="size-4" /> {club.name}
          </Link>
        </Button>
        <Badge tone="neutral">{club.viewerRole}</Badge>
      </div>
      <PageHeader
        eyebrow="Club settings"
        title="Club identity and access"
        description="Join policy, ownership and retention rules for this club."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/public/clubs/${club.slug}`} target="_blank">
              <Share2 className="size-3.5" /> Public page
            </Link>
          </Button>
        }
      />
      <ClubAdminNav clubId={clubId} />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Club details</h2>
            </div>
            <form className="mt-4 space-y-4" onSubmit={(event) => void save(event)}>
              <Field label="Name" htmlFor="name">
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                />
              </Field>
              <Field label="Description" htmlFor="description">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={600}
                />
              </Field>
              <Field label="Location" htmlFor="location">
                <Input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={120}
                />
              </Field>
              <Field
                label="Join policy"
                htmlFor="joinPolicy"
                hint={isOwner ? undefined : 'Only the club owner can change the join policy.'}
              >
                <Select
                  id="joinPolicy"
                  value={joinPolicy}
                  onChange={(event) => setJoinPolicy(event.target.value)}
                  disabled={!isOwner}
                >
                  <option value="OPEN">Open — players join instantly</option>
                  <option value="APPROVAL">Approval — owner approves requests</option>
                  <option value="INVITE_ONLY">Invite only</option>
                </Select>
              </Field>
              <div className="flex justify-end border-t border-border/70 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save club
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <h2 className="font-display text-base font-bold">Access model</h2>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li>
                  <strong className="text-foreground">Owner</strong> — membership, roles, club rules
                  and retention.
                </li>
                <li>
                  <strong className="text-foreground">Queue Master</strong> — sessions, courts,
                  check-in, rotations and scores.
                </li>
                <li>
                  <strong className="text-foreground">Player</strong> — register, check in, pause
                  and view results.
                </li>
              </ul>
            </CardContent>
          </Card>

          {isOwner ? (
            <>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <UserCog className="size-4 text-primary" />
                    <h2 className="font-display text-base font-bold">Transfer ownership</h2>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    You become a Queue Master. The new owner must be an active member.
                  </p>
                  <Select
                    className="mt-3"
                    value={newOwner}
                    onChange={(event) => setNewOwner(event.target.value)}
                    aria-label="New owner"
                  >
                    <option value="">Choose a member…</option>
                    {ownerCandidates.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.displayName}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => void transfer()}
                    disabled={!newOwner}
                  >
                    Transfer ownership
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[#f0d8d4]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="size-4" />
                    <h2 className="font-display text-base font-bold">Archive club</h2>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Archiving cancels upcoming sessions and hides the club from discovery.
                    Historical matches remain intact.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => void archive()}
                  >
                    <Archive className="size-3.5" /> Archive club
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="rounded-[1.35rem] border border-border bg-card p-5 text-xs leading-relaxed text-muted-foreground">
              Ownership transfer and archiving are available to the club owner only.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
