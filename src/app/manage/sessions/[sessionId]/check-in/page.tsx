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
  Pencil,
  QrCode,
  Search,
  Trash2,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
  GUEST_GENDERS,
  GUEST_GENDER_LABELS,
  QUEUE_STATE_LABELS,
  SKILL_MAX,
  SKILL_MIN,
  SKILL_STEP,
  formatSkill,
  type GuestGender,
  type QueueState,
} from '@picklequeue/contracts';
import { api, newIdempotencyKey } from '@/lib/api';
import { invalidateSessionQueries, queryKeys, useRegistrations, useSession } from '@/lib/queries';
import { useSessionEvents } from '@/hooks/use-session-events';
import { formatRange, formatShortDay } from '@/lib/format';
import type { ParticipantRow } from '@/lib/types';
import { PageHeader, StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Field, Input, Select } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { Segmented } from '@/components/ui/segmented';
import { SessionStatusBadge } from '@/components/session/status';

type StatusTab = 'all' | 'pending' | 'ready' | 'in';
type TypeTab = 'all' | 'registered' | 'guests';

interface GuestFormState {
  displayName: string;
  gender: GuestGender | '';
  skillRating: string;
}

const SKILL_OPTIONS = Array.from(
  { length: Math.round((SKILL_MAX - SKILL_MIN) / SKILL_STEP) + 1 },
  (_, index) => Number((SKILL_MIN + index * SKILL_STEP).toFixed(2)),
);

const EMPTY_GUEST_FORM: GuestFormState = {
  displayName: '',
  gender: '',
  skillRating: '3',
};

function isGuestRow(row: ParticipantRow): boolean {
  return row.participantType === 'GUEST';
}

function isCheckedRow(row: ParticipantRow): boolean {
  return row.status === 'CHECKED_IN' || Boolean(row.queueState);
}

function queueLabel(state: string | null): string | null {
  if (!state) return null;
  return QUEUE_STATE_LABELS[state as QueueState] ?? state.replaceAll('_', ' ').toLowerCase();
}

function validateGuestForm(form: GuestFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.displayName.trim()) errors.displayName = 'Player name is required';
  if (!form.gender) errors.gender = 'Select a gender';
  const skill = Number(form.skillRating);
  if (!Number.isFinite(skill) || skill < SKILL_MIN || skill > SKILL_MAX) {
    errors.skillRating = `Choose a skill level between ${SKILL_MIN} and ${SKILL_MAX}`;
  }
  return errors;
}

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
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [typeTab, setTypeTab] = useState<TypeTab>('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addAnother, setAddAnother] = useState(false);
  const [guestForm, setGuestForm] = useState<GuestFormState>(EMPTY_GUEST_FORM);
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<ParticipantRow | null>(null);
  const [editForm, setEditForm] = useState<GuestFormState>(EMPTY_GUEST_FORM);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<ParticipantRow | null>(null);
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

  const rows = registrations.data?.participants ?? registrations.data?.registrations ?? [];
  const pending = rows.filter((row) => row.status === 'PENDING');
  const checked = rows.filter(isCheckedRow);
  const guests = rows.filter(isGuestRow);
  const canManageGuests =
    ['CHECK_IN_OPEN', 'LIVE'].includes(session.status) &&
    (session.status !== 'LIVE' || session.allowLateArrivals);
  const canQueueGuests = canManageGuests;

  const filtered = rows.filter((row) => {
    if (typeTab === 'registered' && isGuestRow(row)) return false;
    if (typeTab === 'guests' && !isGuestRow(row)) return false;
    if (search) {
      const term = search.toLowerCase();
      if (!`${row.displayName} ${row.email ?? ''}`.toLowerCase().includes(term)) return false;
    }
    if (statusTab === 'pending') return row.status === 'PENDING';
    if (statusTab === 'in') return isCheckedRow(row);
    if (statusTab === 'ready') return !isGuestRow(row) && row.status === 'REGISTERED';
    return true;
  });

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
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const approve = (row: ParticipantRow) =>
    action(
      `approve-${row.id}`,
      () =>
        api.patch(`/api/v1/sessions/${sessionId}/registrations/${row.id}`, {
          action: 'APPROVE',
        }),
      `${row.displayName} approved`,
    );

  const reject = (row: ParticipantRow) =>
    action(
      `reject-${row.id}`,
      () =>
        api.patch(`/api/v1/sessions/${sessionId}/registrations/${row.id}`, {
          action: 'REJECT',
        }),
      `${row.displayName} rejected`,
    );

  const checkIn = (row: ParticipantRow) =>
    action(
      `checkin-${row.id}`,
      () =>
        api.post(`/api/v1/sessions/${sessionId}/checkins`, {
          userId: row.userId,
          reason: 'Checked in by Queue Master',
        }),
      `${row.displayName} checked in`,
    );

  const noShow = (row: ParticipantRow) =>
    action(
      `noshow-${row.id}`,
      () =>
        api.patch(`/api/v1/sessions/${sessionId}/registrations/${row.id}`, {
          action: 'NO_SHOW',
          reason: 'Marked no-show by Queue Master',
        }),
      `${row.displayName} marked as a no-show`,
    );

  const addToQueue = (row: ParticipantRow) =>
    action(
      `queue-${row.id}`,
      () => api.post(`/api/v1/sessions/${sessionId}/guests/${row.guestId}/enqueue`, {}),
      `${row.displayName} added to the queue`,
    );

  const openEdit = (row: ParticipantRow) => {
    setEditing(row);
    setEditForm({
      displayName: row.displayName,
      gender: (row.gender ?? '') as GuestGender | '',
      skillRating: String(row.skillRating),
    });
    setEditErrors({});
  };

  const submitGuest = async (addToQueueAfterCreate: boolean) => {
    const errors = validateGuestForm(guestForm);
    setGuestErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(addToQueueAfterCreate ? 'guest-add-queue' : 'guest-add');
    try {
      await api.post(
        `/api/v1/sessions/${sessionId}/guests`,
        {
          displayName: guestForm.displayName.trim(),
          gender: guestForm.gender,
          skillRating: Number(guestForm.skillRating),
          addToQueue: addToQueueAfterCreate,
        },
        { idempotencyKey: newIdempotencyKey('guest') },
      );
      await refresh();
      toast.success(
        addToQueueAfterCreate
          ? `${guestForm.displayName.trim()} added and queued`
          : `${guestForm.displayName.trim()} added`,
      );
      if (addAnother) {
        setGuestForm(EMPTY_GUEST_FORM);
        setGuestErrors({});
      } else {
        setAddOpen(false);
        setGuestForm(EMPTY_GUEST_FORM);
        setAddAnother(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add the guest');
    } finally {
      setBusy(null);
    }
  };

  const saveEdit = async () => {
    if (!editing?.guestId) return;
    const errors = validateGuestForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const inActiveMatch = ['PLAYING', 'RESERVED'].includes(editing.queueState ?? '');
    const skillChanged = Number(editForm.skillRating) !== editing.skillRating;
    if (inActiveMatch && skillChanged) {
      setEditErrors({
        skillRating: 'Skill cannot change during an active match. Try again after the match.',
      });
      return;
    }

    setBusy('guest-edit');
    try {
      await api.patch(`/api/v1/sessions/${sessionId}/guests/${editing.guestId}`, {
        displayName: editForm.displayName.trim(),
        gender: editForm.gender,
        skillRating: Number(editForm.skillRating),
        ...(editing.version ? { expectedVersion: editing.version } : {}),
      });
      await refresh();
      setEditing(null);
      toast.success('Guest details updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the guest');
    } finally {
      setBusy(null);
    }
  };

  const confirmRemove = async () => {
    if (!removing?.guestId) return;
    const removed = await action(
      `remove-${removing.id}`,
      () => api.delete(`/api/v1/sessions/${sessionId}/guests/${removing.guestId}`),
      `${removing.displayName} removed from the session`,
    );
    if (removed) setRemoving(null);
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/manage/sessions/${sessionId}`}>
            <ArrowLeft className="size-4" /> Session board
          </Link>
        </Button>
        <SessionStatusBadge status={session.status} />
      </div>

      <PageHeader
        eyebrow="Participants"
        title={session.name}
        description={`${formatShortDay(session.startsAt, session.timezone)} · ${formatRange(session.startsAt, session.endsAt, session.timezone)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canManageGuests ? (
              <Button
                size="sm"
                className="max-sm:h-11"
                onClick={() => setAddOpen(true)}
                disabled={busy !== null}
              >
                <UserPlus className="size-4" /> Add guest
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href={`/manage/sessions/${sessionId}/settings`}>Session settings</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Participants"
          value={rows.length}
          icon={<ClipboardCheck className="size-4" />}
        />
        <StatCard
          label="Guests"
          value={guests.length}
          accent={guests.length > 0}
          icon={<UserPlus className="size-4" />}
        />
        <StatCard
          label="Checked in"
          value={checked.length}
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatCard label="Capacity" value={session.capacity} icon={<Users className="size-4" />} />
      </div>

      {!['CHECK_IN_OPEN', 'LIVE'].includes(session.status) ? (
        <div className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] px-4 py-3 text-xs font-medium text-[#7a520c]">
          Check-in opens when the Queue Master moves the session to Check-in open. You can approve
          registrations now.
        </div>
      ) : null}

      {pending.length > 0 ? (
        <div className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] px-4 py-3 text-xs font-medium text-[#7a520c]">
          {pending.length} registration{pending.length === 1 ? '' : 's'} waiting for approval.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Segmented
                value={statusTab}
                onChange={setStatusTab}
                className="max-sm:[&>button]:min-h-11"
                options={[
                  { value: 'all', label: 'All', count: rows.length },
                  { value: 'pending', label: 'Pending', count: pending.length },
                  {
                    value: 'ready',
                    label: 'Ready',
                    count: rows.filter((row) => !isGuestRow(row) && row.status === 'REGISTERED')
                      .length,
                  },
                  { value: 'in', label: 'In', count: checked.length },
                ]}
              />
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search participants"
                  className="h-10 rounded-full pl-9"
                  aria-label="Search participants"
                />
              </div>
            </div>
            <Segmented
              value={typeTab}
              onChange={setTypeTab}
              size="sm"
              className="max-sm:[&>button]:min-h-11"
              options={[
                { value: 'all', label: 'Everyone', count: rows.length },
                { value: 'registered', label: 'Registered', count: rows.length - guests.length },
                { value: 'guests', label: 'Guests', count: guests.length },
              ]}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title={
                statusTab === 'pending'
                  ? 'No pending approvals'
                  : typeTab === 'guests'
                    ? 'No guests in this session'
                    : 'No participants here yet'
              }
              description={
                typeTab === 'guests' && canManageGuests
                  ? 'Add a guest with just a name, gender and skill level.'
                  : statusTab === 'pending'
                    ? 'New approval requests will appear in this list.'
                    : 'Players will appear after they register for the session.'
              }
              icon={
                typeTab === 'guests' ? (
                  <UserPlus className="size-5" />
                ) : (
                  <Users className="size-5" />
                )
              }
              action={
                typeTab === 'guests' && canManageGuests ? (
                  <Button size="sm" className="max-sm:h-11" onClick={() => setAddOpen(true)}>
                    <UserPlus className="size-4" /> Add guest
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((row) => {
                const guest = isGuestRow(row);
                const isChecked = isCheckedRow(row);
                const inActiveMatch = ['PLAYING', 'RESERVED'].includes(row.queueState ?? '');
                return (
                  <Card key={`${row.participantType}-${row.id}`}>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={row.displayName} size="md" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold">{row.displayName}</p>
                            {guest ? <Badge tone="info">Guest</Badge> : null}
                            <Badge
                              tone={
                                inActiveMatch
                                  ? 'lime'
                                  : isChecked
                                    ? 'success'
                                    : row.status === 'PENDING'
                                      ? 'warning'
                                      : row.status === 'REJECTED' || row.status === 'NO_SHOW'
                                        ? 'danger'
                                        : 'info'
                              }
                              dot
                            >
                              {queueLabel(row.queueState) ??
                                (isChecked
                                  ? 'Checked in'
                                  : row.status.replace('_', ' ').toLowerCase())}
                            </Badge>
                            {guest && !row.queueState ? (
                              <Badge tone="neutral">Not queued</Badge>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">
                            {guest
                              ? `${row.gender ? GUEST_GENDER_LABELS[row.gender] : 'Gender not set'} · ${formatSkill(row.skillRating)} skill`
                              : `${row.email} · ${formatSkill(row.skillRating)} skill`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {guest ? (
                          <>
                            {canQueueGuests && !row.queueState ? (
                              <Button
                                size="sm"
                                className="max-sm:h-11"
                                onClick={() => void addToQueue(row)}
                                disabled={busy !== null}
                              >
                                {busy === `queue-${row.id}` ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <ClipboardCheck className="size-3.5" />
                                )}
                                Add to queue
                              </Button>
                            ) : null}
                            {canManageGuests ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="max-sm:h-11"
                                  onClick={() => openEdit(row)}
                                  disabled={busy !== null}
                                >
                                  <Pencil className="size-3.5" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="max-sm:h-11"
                                  onClick={() => setRemoving(row)}
                                  disabled={busy !== null || inActiveMatch}
                                  title={
                                    inActiveMatch
                                      ? 'A guest in an active match cannot be removed'
                                      : undefined
                                  }
                                >
                                  <Trash2 className="size-3.5" /> Remove
                                </Button>
                              </>
                            ) : null}
                          </>
                        ) : row.status === 'PENDING' ? (
                          <>
                            <Button
                              size="sm"
                              className="max-sm:h-11"
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
                              className="max-sm:h-11"
                              onClick={() => void reject(row)}
                              disabled={busy !== null}
                            >
                              <X className="size-3.5" /> Reject
                            </Button>
                          </>
                        ) : row.status === 'REGISTERED' && !isChecked && canManageGuests ? (
                          <Button
                            size="sm"
                            className="max-sm:h-11"
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
                            className="max-sm:h-11"
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
                <li>Only checked-in players and active guests enter the rotation.</li>
                <li>Approving a registration does not check the player in.</li>
                <li>Guests are session-scoped and never receive login credentials.</li>
                <li>A guest in an active match cannot be removed until the match ends.</li>
                <li>Paused players keep their accumulated wait and do not block the queue.</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setGuestForm(EMPTY_GUEST_FORM);
            setGuestErrors({});
            setAddAnother(false);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:m-0 max-sm:w-auto max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[1.5rem] max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <DialogHeader>
            <DialogTitle>Add guest player</DialogTitle>
            <DialogDescription>
              Quickly add a real-world player without an account. Only a name, gender and skill
              level are needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Player name" htmlFor="guestName" error={guestErrors.displayName}>
              <Input
                id="guestName"
                value={guestForm.displayName}
                onChange={(event) => {
                  setGuestForm((form) => ({ ...form, displayName: event.target.value }));
                  setGuestErrors((errors) => ({ ...errors, displayName: '' }));
                }}
                placeholder="Enter player name"
                autoComplete="off"
                maxLength={80}
                autoFocus
                aria-invalid={Boolean(guestErrors.displayName)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gender" htmlFor="guestGender" error={guestErrors.gender}>
                <Select
                  id="guestGender"
                  value={guestForm.gender}
                  onChange={(event) => {
                    setGuestForm((form) => ({
                      ...form,
                      gender: event.target.value as GuestGender | '',
                    }));
                    setGuestErrors((errors) => ({ ...errors, gender: '' }));
                  }}
                  aria-invalid={Boolean(guestErrors.gender)}
                >
                  <option value="">Select gender</option>
                  {GUEST_GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {GUEST_GENDER_LABELS[gender]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Skill level" htmlFor="guestSkill" error={guestErrors.skillRating}>
                <Select
                  id="guestSkill"
                  value={guestForm.skillRating}
                  onChange={(event) => {
                    setGuestForm((form) => ({ ...form, skillRating: event.target.value }));
                    setGuestErrors((errors) => ({ ...errors, skillRating: '' }));
                  }}
                  aria-invalid={Boolean(guestErrors.skillRating)}
                >
                  {SKILL_OPTIONS.map((skill) => (
                    <option key={skill} value={String(skill)}>
                      {formatSkill(skill)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <label className="flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-secondary/40 px-3.5 text-xs font-semibold text-foreground/80">
              <input
                type="checkbox"
                checked={addAnother}
                onChange={(event) => setAddAnother(event.target.checked)}
                className="size-4 accent-[#164430]"
              />
              Add another after saving
            </label>
          </div>
          <DialogFooter className="max-sm:[&>button]:h-11">
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setGuestForm(EMPTY_GUEST_FORM);
                setGuestErrors({});
                setAddAnother(false);
              }}
              disabled={busy !== null}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => void submitGuest(false)}
              disabled={busy !== null}
            >
              {busy === 'guest-add' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Add guest
            </Button>
            {canQueueGuests ? (
              <Button
                onClick={() => void submitGuest(true)}
                disabled={busy !== null}
                className="max-sm:h-11"
              >
                {busy === 'guest-add-queue' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ClipboardCheck className="size-4" />
                )}
                Add &amp; queue
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:m-0 max-sm:w-auto max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[1.5rem] max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <DialogHeader>
            <DialogTitle>Edit guest player</DialogTitle>
            <DialogDescription>
              Changes apply to future rotations. Completed match history keeps the original
              snapshot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Player name" htmlFor="editGuestName" error={editErrors.displayName}>
              <Input
                id="editGuestName"
                value={editForm.displayName}
                onChange={(event) => {
                  setEditForm((form) => ({ ...form, displayName: event.target.value }));
                  setEditErrors((errors) => ({ ...errors, displayName: '' }));
                }}
                maxLength={80}
                autoFocus
                aria-invalid={Boolean(editErrors.displayName)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gender" htmlFor="editGuestGender" error={editErrors.gender}>
                <Select
                  id="editGuestGender"
                  value={editForm.gender}
                  onChange={(event) => {
                    setEditForm((form) => ({
                      ...form,
                      gender: event.target.value as GuestGender | '',
                    }));
                    setEditErrors((errors) => ({ ...errors, gender: '' }));
                  }}
                  aria-invalid={Boolean(editErrors.gender)}
                >
                  <option value="">Select gender</option>
                  {GUEST_GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {GUEST_GENDER_LABELS[gender]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Skill level" htmlFor="editGuestSkill" error={editErrors.skillRating}>
                <Select
                  id="editGuestSkill"
                  value={editForm.skillRating}
                  onChange={(event) => {
                    setEditForm((form) => ({ ...form, skillRating: event.target.value }));
                    setEditErrors((errors) => ({ ...errors, skillRating: '' }));
                  }}
                  disabled={['PLAYING', 'RESERVED'].includes(editing?.queueState ?? '')}
                  aria-invalid={Boolean(editErrors.skillRating)}
                >
                  {SKILL_OPTIONS.map((skill) => (
                    <option key={skill} value={String(skill)}>
                      {formatSkill(skill)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {['PLAYING', 'RESERVED'].includes(editing?.queueState ?? '') ? (
              <p className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] px-3 py-2 text-xs leading-relaxed text-[#7a520c]">
                This guest is in an active match. Name and gender can be corrected, but skill stays
                fixed until the match ends.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy !== null}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={busy !== null}>
              {busy === 'guest-edit' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this guest?</DialogTitle>
            <DialogDescription>
              {removing
                ? `${removing.displayName} will leave the queue and the participant list. Completed match history is kept.`
                : 'The guest will leave the session.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)} disabled={busy !== null}>
              Keep guest
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmRemove()}
              disabled={busy !== null}
            >
              {busy?.startsWith('remove-') ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Remove guest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
