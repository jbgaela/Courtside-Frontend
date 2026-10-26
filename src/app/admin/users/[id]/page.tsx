'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, api } from '@/lib/api';
import { adminQueryKeys, useAdminUser } from '@/lib/admin-queries';
import { formatDateTime, relativeTime } from '@/lib/format';
import type { AdminRecoveryResult } from '@/lib/admin-types';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Field, Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { AccountStatusBadge, PlatformRoleBadge } from '@/components/admin/status';
import { AdminReauthDialog } from '@/components/admin/reauth-dialog';
import { AdminUserClubRolesCard } from '@/components/admin/user-club-roles';

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAdminUser(params.id);
  const [reauthOpen, setReauthOpen] = React.useState(false);
  const pendingAction = React.useRef<null | (() => Promise<void>)>(null);
  const [suspendOpen, setSuspendOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [working, setWorking] = React.useState(false);
  const [oneTimeLink, setOneTimeLink] = React.useState<string | null>(null);
  const [oneTimeExpiry, setOneTimeExpiry] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(params.id) }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    ]);
  };

  const execute = async (action: () => Promise<void>, needsReauth = true) => {
    setWorking(true);
    try {
      await action();
      await refresh();
    } catch (error) {
      if (
        needsReauth &&
        error instanceof ApiError &&
        error.status === 403 &&
        error.message.toLowerCase().includes('confirm your password')
      ) {
        pendingAction.current = action;
        setReauthOpen(true);
        return;
      }
      toast.error(error instanceof Error ? error.message : 'The action could not be completed');
      await refresh();
    } finally {
      setWorking(false);
    }
  };

  const afterReauth = () => {
    setReauthOpen(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    if (action) void execute(action, false);
  };

  const suspend = () => {
    if (!user.data) return;
    void execute(async () => {
      await api.post(`/api/v1/admin/users/${user.data!.id}/suspend`, {
        reason: reason.trim(),
      });
      toast.success('Account suspended');
      setSuspendOpen(false);
      setReason('');
    });
  };

  const reactivate = () => {
    if (!user.data) return;
    void execute(async () => {
      await api.post(`/api/v1/admin/users/${user.data!.id}/reactivate`, {});
      toast.success('Account reactivated');
    }, false);
  };

  const remove = () => {
    if (!user.data) return;
    void execute(async () => {
      await api.delete(`/api/v1/admin/users/${user.data!.id}`, {
        reason: reason.trim() || 'Administrative deletion',
      });
      toast.success('Account deleted');
      router.push('/admin/users');
    });
  };

  const restore = () => {
    if (!user.data) return;
    void execute(async () => {
      await api.post(`/api/v1/admin/users/${user.data!.id}/restore`, {});
      toast.success('Account restored');
    });
  };

  const issueRecovery = () => {
    if (!user.data) return;
    void execute(async () => {
      const result = await api.post<AdminRecoveryResult>(
        `/api/v1/admin/users/${user.data!.id}/recovery`,
        {},
      );
      setOneTimeLink(`${window.location.origin}${result.path}`);
      setOneTimeExpiry(result.expiresAt);
      toast.success('Recovery link generated');
    });
  };

  const issueClaim = () => {
    if (!user.data) return;
    void execute(async () => {
      const result = await api.post<{ path: string; expiresAt: string }>(
        `/api/v1/admin/users/${user.data!.id}/claim`,
        {},
      );
      setOneTimeLink(`${window.location.origin}${result.path}`);
      setOneTimeExpiry(result.expiresAt);
      toast.success('Claim link generated');
    });
  };

  const revokeSessions = () => {
    if (!user.data) return;
    void execute(async () => {
      await api.post(`/api/v1/admin/users/${user.data!.id}/revoke-sessions`, {});
      toast.success('All sessions revoked');
    });
  };

  const copyLink = async () => {
    if (!oneTimeLink) return;
    try {
      await navigator.clipboard.writeText(oneTimeLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed. Select the link manually.');
    }
  };

  if (user.isLoading) return <PageSkeleton />;
  if (user.isError) return <ErrorState error={user.error} onRetry={() => void user.refetch()} />;
  if (!user.data) return <PageSkeleton />;
  const data = user.data;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to users
      </Link>
      <PageHeader
        eyebrow="Account administration"
        title={data.name}
        description="Identity, account state, memberships and the platform audit trail."
        actions={
          <>
            <AccountStatusBadge status={data.accountStatus} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/users/${data.id}/edit`}>
                <Pencil className="size-3.5" /> Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void user.refetch()}>
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar name={data.name} size="xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight">
                      {data.displayName}
                    </h2>
                    <PlatformRoleBadge role={data.platformRole} />
                    {data.emailVerified ? (
                      <Badge tone="success" dot>
                        Email verified
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Email unverified</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{data.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Account created {formatDateTime(data.createdAt)} ·{' '}
                    {relativeTime(data.createdAt)}
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid gap-4 rounded-2xl border border-border bg-secondary/25 p-4 text-sm sm:grid-cols-2">
                <Info label="Account status">
                  <AccountStatusBadge status={data.accountStatus} />
                </Info>
                <Info label="Platform role">
                  <PlatformRoleBadge role={data.platformRole} />
                </Info>
                <Info label="Activated">
                  {data.activatedAt ? formatDateTime(data.activatedAt) : 'Not activated'}
                </Info>
                <Info label="Terms accepted">
                  {data.termsAcceptedAt ? formatDateTime(data.termsAcceptedAt) : 'Not recorded'}
                </Info>
                <Info label="Registration">
                  {data.registration?.status ?? 'No registration review'}
                </Info>
                <Info label="Deleted">
                  {data.deletedAt ? formatDateTime(data.deletedAt) : 'No'}
                </Info>
              </dl>
            </CardContent>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold">Player profile</h2>
                {data.profile ? (
                  <dl className="mt-4 space-y-3 text-sm">
                    <Info label="Display name">{data.profile.displayName}</Info>
                    <Info label="Skill">{data.profile.skillRating.toFixed(2)}</Info>
                    <Info label="Bio">{data.profile.bio ?? 'No bio'}</Info>
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No player profile.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold">Claim and recovery</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Claim link</span>
                    <Badge tone={data.claimPending ? 'warning' : 'neutral'}>
                      {data.claimPending ? 'Pending' : 'None'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Recovery link</span>
                    <Badge tone={data.recoveryPending ? 'warning' : 'neutral'}>
                      {data.recoveryPending ? 'Pending' : 'None'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Links are stored hashed. A new link invalidates the previous one and is shown only
                  once.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-5 sm:p-6">
              <AdminUserClubRolesCard userId={data.id} />
              {data.ownedClubs.length > 0 ? (
                <div className="mt-4 rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] p-3 text-xs text-[#8a5a0b]">
                  Active club owner: {data.ownedClubs.map((club) => club.name).join(', ')}.
                  Ownership must be transferred before deletion.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">Registration review</h2>
              {data.registration ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        data.registration.status === 'APPROVED'
                          ? 'success'
                          : data.registration.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {data.registration.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Submitted {formatDateTime(data.registration.submittedAt)}
                    </span>
                  </div>
                  {data.registration.publicReason ? (
                    <p className="text-xs text-muted-foreground">
                      Public reason: {data.registration.publicReason}
                    </p>
                  ) : null}
                  {data.registration.internalReason ? (
                    <p className="rounded-xl bg-secondary/40 p-3 text-xs">
                      Internal: {data.registration.internalReason}
                    </p>
                  ) : null}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/registrations/${data.registration.id}`}>
                      Open review record
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  This account was created outside the public registration review flow.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">Recent account audit</h2>
              {data.recentAudit.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No audit events.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {data.recentAudit.map((event) => (
                    <li key={event.id} className="flex gap-3 text-sm">
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="font-medium leading-relaxed">{event.summary}</p>
                        <p className="text-[0.65rem] text-muted-foreground">
                          {event.action} · {event.actor?.name ?? 'System'} ·{' '}
                          {relativeTime(event.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <h2 className="font-display text-lg font-bold">Administrative actions</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Sensitive actions require recent reauthentication and create an audit event.
            </p>
            <div className="mt-5 space-y-2">
              {data.accountStatus === 'SUSPENDED' ? (
                <Button className="w-full" onClick={reactivate} disabled={working}>
                  <RotateCcw className="size-4" /> Reactivate account
                </Button>
              ) : data.accountStatus === 'DELETED' ? (
                <Button className="w-full" onClick={restore} disabled={working}>
                  <RotateCcw className="size-4" /> Restore account
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-[#f1dfb9] text-[#8a5a0b] hover:bg-[#fbf0d9]"
                  onClick={() => setSuspendOpen(true)}
                  disabled={working || data.platformRole === 'SUPER_ADMIN'}
                >
                  <Ban className="size-4" /> Suspend account
                </Button>
              )}
              {data.accountStatus === 'APPROVED_PENDING_ACTIVATION' ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={issueClaim}
                  disabled={working}
                >
                  <KeyRound className="size-4" />{' '}
                  {data.claimPending ? 'Replace claim link' : 'Generate claim link'}
                </Button>
              ) : null}
              <Button
                variant="outline"
                className="w-full"
                onClick={issueRecovery}
                disabled={working}
              >
                <KeyRound className="size-4" /> Generate recovery link
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={revokeSessions}
                disabled={working}
              >
                <RefreshCw className="size-4" /> Revoke all sessions
              </Button>
              <Button
                variant="outline"
                className="w-full border-[#f0d8d4] text-destructive hover:bg-[#fdf6f5]"
                onClick={() => setDeleteOpen(true)}
                disabled={working || data.accountStatus === 'DELETED'}
              >
                <Trash2 className="size-4" /> Delete account
              </Button>
            </div>
            {data.platformRole === 'SUPER_ADMIN' ? (
              <p className="mt-4 rounded-xl border border-[#d9edb2] bg-lime-soft/50 p-3 text-[0.68rem] leading-relaxed text-[#3f5c16]">
                <CheckCircle2 className="mr-1 inline size-3.5" /> This is a Super Admin account. The
                final active Super Admin is protected from suspension, deletion and demotion.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {data.name}?</DialogTitle>
            <DialogDescription>
              Normal authentication and private real-time access will be blocked. Active queue
              eligibility is paused; historical match data is preserved.
            </DialogDescription>
          </DialogHeader>
          <Field label="Reason" htmlFor="suspend-reason">
            <Input
              id="suspend-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is this account being suspended?"
              minLength={3}
              maxLength={500}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)} disabled={working}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={suspend}
              disabled={working || reason.trim().length < 3}
            >
              {working ? <Loader2 className="size-4 animate-spin" /> : null}
              Suspend account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {data.name}?</DialogTitle>
            <DialogDescription>
              This is a soft delete. Sessions are revoked, club memberships are closed and the
              account cannot authenticate. Match history is retained. Restore is an audited action.
            </DialogDescription>
          </DialogHeader>
          <Field label="Reason" htmlFor="delete-reason">
            <Input
              id="delete-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Administrative deletion"
              maxLength={500}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={working}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={working}>
              {working ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(oneTimeLink)} onOpenChange={() => setOneTimeLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>One-time link generated</DialogTitle>
            <DialogDescription>
              Share this link only after verifying the recipient through an approved out-of-band
              channel. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <p className="break-all text-xs font-medium">{oneTimeLink}</p>
            <p className="mt-2 text-[0.65rem] text-muted-foreground">
              Expires {oneTimeExpiry ? new Date(oneTimeExpiry).toLocaleString() : ''}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => void copyLink()}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setOneTimeLink(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminReauthDialog open={reauthOpen} onOpenChange={setReauthOpen} onSuccess={afterReauth} />
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  );
}
