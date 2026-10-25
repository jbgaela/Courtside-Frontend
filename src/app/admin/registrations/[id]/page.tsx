'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { adminQueryKeys, useAdminRegistration } from '@/lib/admin-queries';
import { formatDateTime, relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Field, Input, Textarea } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { AccountStatusBadge, RegistrationStatusBadge } from '@/components/admin/status';

type Decision = 'approve' | 'reject' | 'reopen';

export default function AdminRegistrationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const registration = useAdminRegistration(params.id);
  const [decision, setDecision] = React.useState<Decision | null>(null);
  const [note, setNote] = React.useState('');
  const [publicReason, setPublicReason] = React.useState('');
  const [internalReason, setInternalReason] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.registration(params.id) }),
    ]);
  };

  const close = () => {
    setDecision(null);
    setNote('');
    setPublicReason('');
    setInternalReason('');
    setError(null);
  };

  const submit = async () => {
    if (!registration.data || !decision) return;
    setSaving(true);
    setError(null);
    try {
      if (decision === 'approve') {
        await api.post(`/api/v1/admin/registrations/${registration.data.id}/approve`, {
          expectedVersion: registration.data.version,
          ...(note.trim() ? { note: note.trim() } : {}),
        });
        toast.success('Registration approved');
      } else if (decision === 'reject') {
        await api.post(`/api/v1/admin/registrations/${registration.data.id}/reject`, {
          expectedVersion: registration.data.version,
          ...(internalReason.trim() ? { internalReason: internalReason.trim() } : {}),
          ...(publicReason.trim() ? { publicReason: publicReason.trim() } : {}),
        });
        toast.success('Registration rejected');
      } else {
        await api.post(`/api/v1/admin/registrations/${registration.data.id}/reopen`, {
          expectedVersion: registration.data.version,
          ...(note.trim() ? { note: note.trim() } : {}),
        });
        toast.success('Registration reopened for review');
      }
      close();
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this registration');
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  if (registration.isLoading) return <PageSkeleton />;
  if (registration.isError) {
    return <ErrorState error={registration.error} onRetry={() => void registration.refetch()} />;
  }
  if (!registration.data) return <PageSkeleton />;
  const data = registration.data;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/registrations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to registrations
      </Link>
      <PageHeader
        eyebrow="Registration review"
        title={data.name}
        description="Review the application, then record one authoritative decision."
        actions={
          <>
            <RegistrationStatusBadge status={data.status} />
            <Button variant="outline" size="sm" onClick={() => void registration.refetch()}>
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar name={data.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl font-extrabold tracking-tight">
                    {data.name}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5" /> {data.email}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" /> Applied{' '}
                      {formatDateTime(data.submittedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 rounded-2xl border border-border bg-secondary/25 p-4 text-sm sm:grid-cols-2">
                <Info label="Account status">
                  <AccountStatusBadge status={data.accountStatus} />
                </Info>
                <Info label="Skill level">{data.skillRating.toFixed(2)}</Info>
                <Info label="Email verified">{data.emailVerified ? 'Yes' : 'No'}</Info>
                <Info label="Platform role">
                  <Badge tone={data.platformRole === 'SUPER_ADMIN' ? 'forest' : 'neutral'}>
                    {data.platformRole === 'SUPER_ADMIN' ? 'Super Admin' : 'User'}
                  </Badge>
                </Info>
                <Info label="Submitted">{formatDateTime(data.submittedAt)}</Info>
                <Info label="Reviewed">
                  {data.reviewedAt ? formatDateTime(data.reviewedAt) : 'Not reviewed yet'}
                </Info>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">Review history</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[#b87314]" />
                  <div>
                    <p className="font-semibold">Application submitted</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(data.submittedAt)}
                    </p>
                  </div>
                </div>
                {data.reviewedAt ? (
                  <div className="flex gap-3">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-success" />
                    <div>
                      <p className="font-semibold">
                        {data.status === 'APPROVED' ? 'Approved' : 'Rejected'} by{' '}
                        {data.reviewedBy?.name ?? 'a Super Admin'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(data.reviewedAt)} · {relativeTime(data.reviewedAt)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
              {data.internalReason ? (
                <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
                  <p className="font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Internal review note
                  </p>
                  <p className="mt-1 leading-relaxed">{data.internalReason}</p>
                </div>
              ) : null}
              {data.publicReason ? (
                <div className="mt-3 rounded-xl border border-[#f0d8d4] bg-[#fdf6f5] p-3 text-xs text-[#8f3a33]">
                  <p className="font-bold uppercase tracking-[0.1em]">Public reason</p>
                  <p className="mt-1 leading-relaxed">{data.publicReason}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <h2 className="font-display text-lg font-bold">Decision</h2>
            </div>
            {data.status === 'PENDING' ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Approval lets the applicant sign in and activate their account. Rejection blocks
                  activation and can be reconsidered later.
                </p>
                <div className="mt-5 space-y-2">
                  <Button className="w-full" onClick={() => setDecision('approve')}>
                    <CheckCircle2 className="size-4" /> Approve registration
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-[#f0d8d4] text-destructive hover:bg-[#fdf6f5]"
                    onClick={() => setDecision('reject')}
                  >
                    <XCircle className="size-4" /> Reject registration
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {data.status === 'APPROVED'
                    ? 'The applicant has been approved. They must sign in with their original password and complete activation.'
                    : 'This application was rejected. Reopening returns it to the pending review queue.'}
                </p>
                {data.status === 'REJECTED' ? (
                  <Button
                    variant="outline"
                    className="mt-5 w-full"
                    onClick={() => setDecision('reopen')}
                  >
                    <RefreshCw className="size-4" /> Reopen for review
                  </Button>
                ) : null}
              </>
            )}
            <div className="mt-5 rounded-xl border border-dashed border-border p-3 text-[0.68rem] leading-relaxed text-muted-foreground">
              <UserRound className="mr-1 inline size-3.5" /> Account access remains disabled until
              the applicant activates an approved account.
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={decision !== null} onOpenChange={(open) => (!open ? close() : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === 'approve'
                ? 'Approve this registration?'
                : decision === 'reject'
                  ? 'Reject this registration?'
                  : 'Reopen this registration?'}
            </DialogTitle>
            <DialogDescription>
              {decision === 'approve'
                ? `${data.name} will be able to sign in and activate their account.`
                : decision === 'reject'
                  ? `${data.name} will remain unable to access PickleQueue. Public reasons are shown to the applicant.`
                  : `${data.name} will return to the pending review queue.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {decision === 'reject' ? (
              <>
                <Field label="Internal reason (optional)" htmlFor="internalReason">
                  <Textarea
                    id="internalReason"
                    value={internalReason}
                    onChange={(event) => setInternalReason(event.target.value)}
                    placeholder="Visible only to platform administrators"
                    maxLength={1000}
                  />
                </Field>
                <Field
                  label="Public reason (optional)"
                  htmlFor="publicReason"
                  hint="Shown to the applicant. Do not include sensitive fraud or risk details."
                >
                  <Input
                    id="publicReason"
                    value={publicReason}
                    onChange={(event) => setPublicReason(event.target.value)}
                    maxLength={500}
                    placeholder="A short, safe explanation"
                  />
                </Field>
              </>
            ) : (
              <Field label="Review note (optional)" htmlFor="note">
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Why is this decision being recorded?"
                  maxLength={1000}
                />
              </Field>
            )}
            {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant={decision === 'reject' ? 'destructive' : 'default'}
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving ? <RefreshCw className="size-4 animate-spin" /> : null}
              {decision === 'approve'
                ? 'Approve account'
                : decision === 'reject'
                  ? 'Confirm rejection'
                  : 'Reopen application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
