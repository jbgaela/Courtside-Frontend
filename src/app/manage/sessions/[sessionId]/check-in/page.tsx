'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  QrCode,
  Search,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { invalidateSessionQueries, queryKeys, useRegistrations, useSession } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { formatRange, formatShortDay } from '@/lib/format';
import type { RegistrationRow } from '@/lib/types';
import { PageHeader, StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { Segmented } from '@/components/ui/segmented';
import { SessionStatusBadge } from '@/components/session/status';

type Tab = 'all' | 'pending' | 'checked' | 'registered';

export default function CheckInPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const queryClient = useQueryClient();
  const sessionQuery = useSession(sessionId);
  const registrations = useRegistrations(sessionId);
  const link = useQuery({
    queryKey: ['session-link', sessionId],
    queryFn: () =>
      api.get<{
        publicId: string;
        published: boolean;
        publicUrl: string;
        checkInToken: string;
        checkInUrl: string;
      }>(`/api/v1/sessions/${sessionId}/public-link`),
  });
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const session = sessionQuery.data;
  useSessionEvents({
    sessionId,
    onEvent: () => invalidateSessionQueries(queryClient, sessionId),
    onRecover: () => invalidateSessionQueries(queryClient, sessionId),
  });

  if (sessionQuery.isLoading || registrations.isLoading) return <PageSkeleton />;
  if (sessionQuery.isError || !session) {
    return (
      <ErrorState
        title="Session unavailable"
        error={sessionQuery.error}
        onRetry={() => void sessionQuery.refetch()}
      />
    );
  }

  const rows = registrations.data?.registrations ?? [];
  const filtered = rows.filter((row) => {
    if (search) {
      const term = search.toLowerCase();
      if (!`${row.displayName} ${row.email ?? ''}`.toLowerCase().includes(term)) return false;
    }
    if (tab === 'pending') return row.status === 'PENDING';
    if (tab === 'checked') return row.status === 'CHECKED_IN' || Boolean(row.queueState);
    if (tab === 'registered') return row.status === 'REGISTERED';
    return true;
  });
  const pending = rows.filter((row) => row.status === 'PENDING');
  const checked = rows.filter((row) => row.status === 'CHECKED_IN' || Boolean(row.queueState));
  const checkInOpen = ['CHECK_IN_OPEN', 'LIVE'].includes(session.status);

  const refresh = async () => {
    await Promise.all([
      invalidateSessionQueries(queryClient, sessionId),
      queryClient.invalidateQueries({ queryKey: queryKeys.registration(sessionId) }),
    ]);
  };

  const action = async (label: string, operation: () => Promise<unknown>, success: string) => {
    setBusy(label);
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

  const approve = (row: RegistrationRow) =>
    action(
      `approve-${row.id}`,
      () =>
        api.patch(`/api/v1/sessions/${sessionId}/registrations/${row.id}`, {
          action: 'APPROVE',
        }),
      `${row.displayName} approved`,
    );

  const reject = (row: RegistrationRow) =>
    action(
      `reject-${row.id}`,
      () =>
        api.patch(`/api/v1/sessions/${sessionId}/registrations/${row.id}`, {
          action: 'REJECT',
        }),
      `${row.displayName} rejected`,
    );

  const checkIn = (row: RegistrationRow) =>
    action(
      `checkin-${row.id}`,
      () =>
        api.post(`/api/v1/sessions/${sessionId}/checkins`, {
          userId: row.userId,
          reason: 'Checked in by Queue Master',
        }),
      `${row.displayName} checked in`,
    );

  const noShow = (row: RegistrationRow) =>
    action(
      `noshow-${row.id}`,
      () =>
        api.patch(`/api/v1/sessions/${sessionId}/registrations/${row.id}`, {
          action: 'NO_SHOW',
          reason: 'Marked no-show by Queue Master',
        }),
      `${row.displayName} marked as a no-show`,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/manage/sessions/${sessionId}`}>
            <ArrowLeft className="size-4" /> Session board
          </Link>
        </Button>
        <SessionStatusBadge status={session.status} />
      </div>

      <PageHeader
        eyebrow="Check-in"
        title={session.name}
        description={`${formatShortDay(session.startsAt, session.timezone)} · ${formatRange(session.startsAt, session.endsAt, session.timezone)}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/manage/sessions/${sessionId}/settings`}>Session settings</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          label="Registrations"
          value={rows.length}
          icon={<ClipboardCheck className="size-4" />}
        />
        <StatCard label="Pending" value={pending.length} accent icon={<ClockIcon />} />
        <StatCard
          label="Checked in"
          value={checked.length}
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatCard label="Capacity" value={session.capacity} icon={<Users className="size-4" />} />
      </div>

      {!checkInOpen ? (
        <div className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] px-4 py-3 text-xs font-medium text-[#7a520c]">
          Check-in opens when the Queue Master moves the session to Check-in open. You can approve
          registrations now.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: 'all', label: 'All', count: rows.length },
                { value: 'pending', label: 'Pending', count: pending.length },
                {
                  value: 'registered',
                  label: 'Ready',
                  count: rows.filter((row) => row.status === 'REGISTERED').length,
                },
                { value: 'checked', label: 'In', count: checked.length },
              ]}
            />
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search players"
                className="h-10 rounded-full pl-9"
                aria-label="Search players"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title={tab === 'pending' ? 'No pending approvals' : 'No players here yet'}
              description={
                tab === 'pending'
                  ? 'New approval requests will appear in this list.'
                  : 'Players will appear after they register for the session.'
              }
              icon={<Users className="size-5" />}
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((row) => {
                const isChecked = row.status === 'CHECKED_IN' || Boolean(row.queueState);
                return (
                  <Card key={row.id}>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={row.displayName} size="md" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold">{row.displayName}</p>
                            <Badge
                              tone={
                                isChecked
                                  ? 'lime'
                                  : row.status === 'PENDING'
                                    ? 'warning'
                                    : row.status === 'REJECTED' || row.status === 'NO_SHOW'
                                      ? 'danger'
                                      : 'info'
                              }
                              dot
                            >
                              {isChecked
                                ? 'Checked in'
                                : row.status.replace('_', ' ').toLowerCase()}
                            </Badge>
                            {row.queueState ? <Badge tone="neutral">{row.queueState}</Badge> : null}
                          </div>
                          <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">
                            {row.email} · {row.skillRating.toFixed(2)} skill
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {row.status === 'PENDING' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => void approve(row)}
                              disabled={busy !== null}
                            >
                              {busy === `approve-${row.id}` ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void reject(row)}
                              disabled={busy !== null}
                            >
                              <X className="size-3.5" /> Reject
                            </Button>
                          </>
                        ) : row.status === 'REGISTERED' && !isChecked && checkInOpen ? (
                          <Button
                            size="sm"
                            onClick={() => void checkIn(row)}
                            disabled={busy !== null}
                          >
                            {busy === `checkin-${row.id}` ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            Check in
                          </Button>
                        ) : isChecked ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void noShow(row)}
                            disabled={busy !== null || row.queueState === 'PLAYING'}
                          >
                            <UserX className="size-3.5" /> No-show / remove
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <QrCode className="size-4 text-primary" />
                <h2 className="font-display text-base font-bold">QR check-in</h2>
              </div>
              {link.data ? (
                <>
                  <div className="mt-4 flex justify-center rounded-2xl border border-border bg-white p-4">
                    <QRCodeSVG
                      value={link.data.checkInUrl}
                      size={168}
                      bgColor="#ffffff"
                      fgColor="#164430"
                      level="M"
                    />
                  </div>
                  <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
                    Players scan this code and sign in. The code identifies the session — never the
                    player. Scanning alone cannot check someone else in.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      void navigator.clipboard.writeText(link.data!.checkInUrl);
                      toast.success('Check-in link copied');
                    }}
                  >
                    Copy check-in link
                  </Button>
                </>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Generating secure check-in link…
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-base font-bold">Queue Master notes</h2>
              <ul className="mt-3 space-y-2 text-[0.68rem] leading-relaxed text-muted-foreground">
                <li>Only checked-in players enter the rotation.</li>
                <li>Approving a registration does not check the player in.</li>
                <li>Paused players keep their accumulated wait and do not block the queue.</li>
                <li>Use no-show/remove only after confirming the player has left.</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ClockIcon() {
  return <ClipboardCheck className="size-4" />;
}
