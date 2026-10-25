'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  MailPlus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys, useClub, useInvitations, useMembers } from '@/lib/queries';
import { relativeTime } from '@/lib/format';
import { PageHeader, StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Field, Input, Select } from '@/components/ui/input';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { ClubAdminNav } from '@/components/manage/club-admin-nav';

export default function ClubMembersPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const queryClient = useQueryClient();
  const clubQuery = useClub(clubId);
  const members = useMembers(clubId);
  const invitations = useInvitations(clubId);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'PLAYER' | 'QUEUE_MASTER'>('PLAYER');
  const [busy, setBusy] = useState<string | null>(null);
  const [devInvite, setDevInvite] = useState<{
    email: string;
    token: string | null;
    url: string;
  } | null>(null);
  const club = clubQuery.data;
  const isOwner = club?.viewerRole === 'OWNER';

  if (clubQuery.isLoading || members.isLoading) return <PageSkeleton />;
  if (clubQuery.isError || !club) {
    return (
      <ErrorState
        title="Club unavailable"
        error={clubQuery.error}
        onRetry={() => void clubQuery.refetch()}
      />
    );
  }

  const rows = members.data ?? [];
  const pending = rows.filter((row) => row.status === 'PENDING');
  const active = rows.filter((row) => row.status === 'ACTIVE');
  const suspended = rows.filter((row) => row.status === 'SUSPENDED');

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.members(clubId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.club(clubId) }),
      queryClient.invalidateQueries({ queryKey: ['me'] }),
    ]);
  };

  const run = async (key: string, operation: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await operation();
      await refresh();
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const updateMember = (memberId: string, data: { role?: string; status?: string }) =>
    run(
      `member-${memberId}`,
      () => api.patch(`/api/v1/clubs/${clubId}/members/${memberId}`, data),
      'Member updated',
    );

  const remove = (memberId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the club?`)) return;
    void run(
      `remove-${memberId}`,
      () => api.delete(`/api/v1/clubs/${clubId}/members/${memberId}`),
      `${name} removed`,
    );
  };

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('invite');
    try {
      const response = await api.post<{
        invitation: { id: string; email: string; role: string };
        devInvitationToken: string | null;
      }>(`/api/v1/clubs/${clubId}/invitations`, { email, role });
      const url = response.devInvitationToken
        ? `${window.location.origin}/app/invitations/accept?token=${encodeURIComponent(response.devInvitationToken)}`
        : '';
      setDevInvite({ email: response.invitation.email, token: response.devInvitationToken, url });
      setEmail('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations(clubId) });
      toast.success('Invitation created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create the invitation');
    } finally {
      setBusy(null);
    }
  };

  const revoke = (id: string) =>
    run(
      `revoke-${id}`,
      () => api.delete(`/api/v1/clubs/${clubId}/invitations/${id}`),
      'Invitation revoked',
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
        eyebrow="Members"
        title="Members & roles"
        description="Approve requests, invite players and assign Queue Masters. Roles are scoped to this club."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/manage/clubs/${clubId}/settings`}>Club settings</Link>
          </Button>
        }
      />
      <ClubAdminNav clubId={clubId} />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Active" value={active.length} icon={<Users className="size-4" />} />
        <StatCard
          label="Pending"
          value={pending.length}
          accent
          icon={<UserPlus className="size-4" />}
        />
        <StatCard
          label="Suspended"
          value={suspended.length}
          icon={<ShieldCheck className="size-4" />}
        />
        <StatCard
          label="Invites"
          value={invitations.data?.filter((i) => i.status === 'PENDING').length ?? 0}
          icon={<MailPlus className="size-4" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          {pending.length > 0 ? (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Pending requests</h2>
                  <Badge tone="warning">{pending.length}</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {pending.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f1dfb9] bg-[#fbf0d9]/60 p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={member.displayName} size="sm" />
                        <div>
                          <p className="text-sm font-bold">{member.displayName}</p>
                          <p className="text-[0.6rem] text-muted-foreground">
                            {member.email ?? member.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isOwner ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => void updateMember(member.id, { status: 'ACTIVE' })}
                              disabled={busy !== null}
                            >
                              {busy === `member-${member.id}` ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void remove(member.id, member.displayName)}
                              disabled={busy !== null}
                            >
                              <X className="size-3.5" /> Reject
                            </Button>
                          </>
                        ) : (
                          <Badge tone="neutral">Owner approval</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Club members</h2>
                <Badge tone="neutral">{active.length} active</Badge>
              </div>
              <div className="mt-3 space-y-2">
                {active.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary/40 p-3"
                  >
                    <Avatar name={member.displayName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{member.displayName}</p>
                      <p className="text-[0.6rem] text-muted-foreground">
                        {member.email ?? member.name} · {member.skillRating.toFixed(2)} skill
                      </p>
                    </div>
                    {isOwner && member.role !== 'OWNER' ? (
                      <select
                        value={member.role}
                        onChange={(event) =>
                          void updateMember(member.id, { role: event.target.value })
                        }
                        disabled={busy !== null}
                        className="h-8 rounded-lg border border-border bg-card px-2 text-[0.65rem] font-semibold"
                        aria-label={`Role for ${member.displayName}`}
                      >
                        <option value="PLAYER">Player</option>
                        <option value="QUEUE_MASTER">Queue Master</option>
                      </select>
                    ) : (
                      <Badge
                        tone={
                          member.role === 'OWNER'
                            ? 'forest'
                            : member.role === 'QUEUE_MASTER'
                              ? 'lime'
                              : 'neutral'
                        }
                      >
                        {member.role}
                      </Badge>
                    )}
                    {isOwner && member.role !== 'OWNER' ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => void remove(member.id, member.displayName)}
                        aria-label={`Remove ${member.displayName}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                ))}
                {active.length === 0 ? (
                  <p className="py-5 text-center text-sm text-muted-foreground">
                    No active members yet.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {suspended.length > 0 ? (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-display text-lg font-bold">Suspended</h2>
                <div className="mt-3 space-y-2">
                  {suspended.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl bg-secondary/40 p-3"
                    >
                      <div>
                        <p className="text-sm font-bold">{member.displayName}</p>
                        <p className="text-[0.6rem] text-muted-foreground">{member.email}</p>
                      </div>
                      {isOwner ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void updateMember(member.id, { status: 'ACTIVE' })}
                        >
                          Restore
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <MailPlus className="size-4 text-primary" />
                <h2 className="font-display text-base font-bold">Invite someone</h2>
              </div>
              <form className="mt-3 space-y-3" onSubmit={(event) => void invite(event)}>
                <Field label="Email" htmlFor="inviteEmail">
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="player@example.com"
                    required
                  />
                </Field>
                <Field label="Role" htmlFor="inviteRole">
                  <Select
                    id="inviteRole"
                    value={role}
                    onChange={(event) => setRole(event.target.value as typeof role)}
                  >
                    <option value="PLAYER">Player</option>
                    {isOwner ? <option value="QUEUE_MASTER">Queue Master</option> : null}
                  </Select>
                </Field>
                <Button type="submit" className="w-full" disabled={busy !== null || !email}>
                  {busy === 'invite' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserPlus className="size-4" />
                  )}
                  Create invitation
                </Button>
              </form>
              {!isOwner ? (
                <p className="mt-2 text-[0.62rem] leading-relaxed text-muted-foreground">
                  Only the club owner can invite Queue Masters.
                </p>
              ) : null}
              {devInvite ? (
                <div className="mt-3 rounded-xl border border-[#d9edb2] bg-lime-soft/60 p-3">
                  <p className="text-xs font-bold text-[#385513]">
                    Invitation ready for {devInvite.email}
                  </p>
                  {devInvite.token ? (
                    <>
                      <p className="mt-1 break-all font-mono text-[0.6rem] text-[#3e5716]">
                        {devInvite.token}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            void navigator.clipboard.writeText(devInvite.token!);
                            toast.success('Invitation token copied');
                          }}
                        >
                          <Copy className="size-3.5" /> Copy token
                        </Button>
                        <Button asChild size="sm" className="flex-1">
                          <a href={devInvite.url}>Open invite</a>
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold">Open invitations</h2>
                <Badge tone="neutral">
                  {invitations.data?.filter((invitation) => invitation.status === 'PENDING')
                    .length ?? 0}
                </Badge>
              </div>
              <div className="mt-3 space-y-2">
                {invitations.data
                  ?.filter((invitation) => invitation.status === 'PENDING')
                  .map((invitation) => (
                    <div key={invitation.id} className="rounded-xl bg-secondary/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold">{invitation.email}</p>
                        <Badge tone="info">{invitation.role}</Badge>
                      </div>
                      <p className="mt-1 text-[0.58rem] text-muted-foreground">
                        Sent {relativeTime(invitation.createdAt)} · expires{' '}
                        {relativeTime(invitation.expiresAt)}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void revoke(invitation.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                {(invitations.data?.filter((invitation) => invitation.status === 'PENDING')
                  .length ?? 0) === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    No open invitations.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
