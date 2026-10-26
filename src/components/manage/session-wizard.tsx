'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Clock3,
  Loader2,
  MapPin,
  Plus,
  Settings2,
  ShieldCheck,
  Users,
  Volleyball,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useClubCourts } from '@/lib/queries';
import { formatDay, formatRange } from '@/lib/format';
import type { SessionRecord } from '@/lib/types';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { EmptyState, PageSkeleton } from '@/components/ui/feedback';
import { cn } from '@/lib/utils';

const steps = [
  { title: 'Session', icon: MapPin },
  { title: 'Courts', icon: Volleyball },
  { title: 'Matchmaking', icon: Settings2 },
  { title: 'Scoring', icon: ShieldCheck },
];

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border bg-background/50 p-3.5">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-5 shrink-0 accent-[#164430]"
      />
    </label>
  );
}

function localDefault(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function SessionWizard({ initialClubId }: { initialClubId?: string }) {
  const { me } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const adminClubs = useMemo(
    () =>
      me?.memberships.filter(
        (membership) =>
          membership.canManage && membership.permissions.includes('sessions.create'),
      ) ?? [],
    [me],
  );
  const [clubId, setClubId] = useState(() => initialClubId ?? adminClubs[0]?.clubId ?? '');
  const courts = useClubCourts(clubId || undefined);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('Saturday Open Play');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startLocal, setStartLocal] = useState(localDefault);
  const [duration, setDuration] = useState(180);
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [capacity, setCapacity] = useState(24);
  const [format, setFormat] = useState<'DOUBLES' | 'SINGLES'>('DOUBLES');
  const [registrationPolicy, setRegistrationPolicy] = useState('OPEN');
  const [checkInPolicy, setCheckInPolicy] = useState('SELF');
  const [guestJoinPolicy, setGuestJoinPolicy] = useState<'DISABLED' | 'OPEN'>('DISABLED');
  const [allowLate, setAllowLate] = useState(true);
  const [selectedCourts, setSelectedCourts] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<'HYBRID' | 'SKILL_FIRST' | 'FAIRNESS_FIRST'>('HYBRID');
  const [preferredSpread, setPreferredSpread] = useState(0.75);
  const [maxSpread, setMaxSpread] = useState(1.5);
  const [widenAfter, setWidenAfter] = useState(10);
  const [minRest, setMinRest] = useState(5);
  const [partnerPenalty, setPartnerPenalty] = useState(12);
  const [opponentPenalty, setOpponentPenalty] = useState(4);
  const [starvationGap, setStarvationGap] = useState(1);
  const [maxGames, setMaxGames] = useState('6');
  const [autoAssign, setAutoAssign] = useState(false);
  const [targetScore, setTargetScore] = useState(11);
  const [winByTwo, setWinByTwo] = useState(true);
  const [pointCap, setPointCap] = useState('');
  const [bestOf, setBestOf] = useState(1);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (courts.data && selectedCourts.length === 0) {
      // Seed the selection once remote courts arrive; the Queue Master can change it afterward.
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setSelectedCourts(
        courts.data
          .filter((court) => court.status !== 'INACTIVE')
          .slice(0, 3)
          .map((court) => court.id),
      );
    }
  }, [courts.data, selectedCourts.length]);

  if (!me) return <PageSkeleton />;
  if (adminClubs.length === 0) {
    return (
      <EmptyState
        title="Queue Master access required"
        description="You need owner or Queue Master permissions to create sessions."
        action={
          <Button asChild>
            <Link href="/app">Back to player view</Link>
          </Button>
        }
      />
    );
  }

  const startDate = startLocal ? new Date(startLocal) : null;
  const endDate = startDate ? new Date(startDate.getTime() + duration * 60_000) : null;
  const startIso = startDate?.toISOString();
  const endIso = endDate?.toISOString();
  const canContinue =
    step === 0
      ? Boolean(
          name.trim().length >= 2 &&
            startIso &&
            endIso &&
            startDate &&
            endDate &&
            endDate > startDate,
        )
      : step === 1
        ? selectedCourts.length > 0 &&
          !(guestJoinPolicy === 'OPEN' && checkInPolicy === 'MANAGER')
        : true;

  const toggleCourt = (id: string) => {
    setSelectedCourts((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const submit = async () => {
    if (!startIso || !endIso) {
      toast.error('Choose a valid start time');
      return;
    }
    setSaving(true);
    try {
      const session = await api.post<SessionRecord>(`/api/v1/clubs/${clubId}/sessions`, {
        name,
        description: description || undefined,
        venue: venue || undefined,
        startsAt: startIso,
        endsAt: endIso,
        timezone,
        capacity,
        format,
        registrationPolicy,
        checkInPolicy,
        guestJoinPolicy,
        published,
        allowLateArrivals: allowLate,
        courtIds: selectedCourts,
        matchmaking: {
          strategy,
          format,
          preferredSkillSpread: preferredSpread,
          maxSkillSpread: maxSpread,
          widenAfterMinutes: widenAfter,
          minRestMinutes: minRest,
          partnerPenalty,
          opponentPenalty,
          starvationMaxGap: starvationGap,
          maxGamesPerPlayer: maxGames ? Number(maxGames) : null,
          autoAssign,
          allowMixedSkillFallback: true,
        },
        scoring: {
          mode: 'RALLY',
          targetScore,
          winByTwo,
          pointCap: pointCap ? Number(pointCap) : null,
          bestOf,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['club-sessions', clubId] });
      toast.success('Session created');
      router.replace(`/manage/sessions/${session.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create the session');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/manage/sessions">
            <ArrowLeft className="size-4" /> Sessions
          </Link>
        </Button>
        {adminClubs.length > 1 ? (
          <select
            value={clubId}
            onChange={(event) => {
              setClubId(event.target.value);
              setSelectedCourts([]);
            }}
            className="h-10 min-w-0 max-w-[62vw] truncate rounded-full border border-border bg-card px-4 text-xs font-semibold"
            aria-label="Club"
          >
            {adminClubs.map((membership) => (
              <option key={membership.clubId} value={membership.clubId}>
                {membership.clubName}
              </option>
            ))}
          </select>
        ) : (
          <Badge tone="neutral">{adminClubs[0]?.clubName}</Badge>
        )}
      </div>

      <PageHeader
        eyebrow="New session"
        title="Build the next open play"
        description="A few decisions now keep the rotation fair, clear and fast later."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="mb-4 flex w-full max-w-full items-center gap-1 overflow-x-auto no-scrollbar">
            {steps.map((entry, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <button
                  key={entry.title}
                  type="button"
                  onClick={() => {
                    if (index < step || canContinue) setStep(index);
                  }}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors max-sm:min-h-11',
                    active
                      ? 'bg-forest text-white'
                      : done
                        ? 'bg-lime-soft text-[#385513]'
                        : 'bg-secondary text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-5 place-items-center rounded-full text-[0.58rem]',
                      active ? 'bg-lime text-forest' : done ? 'bg-[#385513] text-white' : 'bg-card',
                    )}
                  >
                    {done ? <Check className="size-3" /> : index + 1}
                  </span>
                  {entry.title}
                </button>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-5 sm:p-6">
              {step === 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Session name" htmlFor="sessionName" className="sm:col-span-2">
                      <Input
                        id="sessionName"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={100}
                        required
                      />
                    </Field>
                    <Field label="Venue" htmlFor="venue">
                      <Input
                        id="venue"
                        value={venue}
                        onChange={(event) => setVenue(event.target.value)}
                        placeholder="Riverside Courts"
                        maxLength={150}
                      />
                    </Field>
                    <Field label="Capacity" htmlFor="capacity">
                      <Input
                        id="capacity"
                        type="number"
                        min={2}
                        max={200}
                        value={capacity}
                        onChange={(event) => setCapacity(Number(event.target.value))}
                      />
                    </Field>
                    <Field label="Start" htmlFor="start">
                      <Input
                        id="start"
                        type="datetime-local"
                        value={startLocal}
                        onChange={(event) => setStartLocal(event.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Duration" htmlFor="duration">
                      <Select
                        id="duration"
                        value={duration}
                        onChange={(event) => setDuration(Number(event.target.value))}
                      >
                        <option value={90}>90 minutes</option>
                        <option value={120}>2 hours</option>
                        <option value={180}>3 hours</option>
                        <option value={240}>4 hours</option>
                        <option value={300}>5 hours</option>
                      </Select>
                    </Field>
                    <Field label="Format" htmlFor="format">
                      <Select
                        id="format"
                        value={format}
                        onChange={(event) => setFormat(event.target.value as 'DOUBLES' | 'SINGLES')}
                      >
                        <option value="DOUBLES">Doubles</option>
                        <option value="SINGLES">Singles</option>
                      </Select>
                    </Field>
                    <Field label="Time zone" htmlFor="timezone">
                      <Input
                        id="timezone"
                        value={timezone}
                        onChange={(event) => setTimezone(event.target.value)}
                      />
                    </Field>
                    <Field label="Description" htmlFor="description" className="sm:col-span-2">
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        maxLength={1000}
                        placeholder="What should players expect?"
                      />
                    </Field>
                  </div>
                  {startDate && endDate ? (
                    <div className="rounded-xl bg-secondary/60 px-3.5 py-2.5 text-xs text-muted-foreground">
                      <Clock3 className="mr-1.5 inline size-3.5" />
                      {formatDay(startIso!, timezone)} · {formatRange(startIso!, endIso!, timezone)}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-lg font-bold">Select courts</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Only active courts can be used for this session.
                    </p>
                  </div>
                  {courts.isLoading ? (
                    <div className="h-24 animate-pulse rounded-xl bg-secondary/60" />
                  ) : courts.data && courts.data.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {courts.data.map((court) => {
                        const selected = selectedCourts.includes(court.id);
                        const disabled =
                          court.status === 'INACTIVE' || court.status === 'MAINTENANCE';
                        return (
                          <button
                            key={court.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleCourt(court.id)}
                            className={cn(
                              'flex items-center justify-between rounded-xl border p-3.5 text-left transition-colors',
                              selected
                                ? 'border-primary bg-[#eaf3df]'
                                : 'border-border bg-background/50',
                              disabled && 'cursor-not-allowed opacity-40',
                            )}
                          >
                            <div>
                              <p className="text-sm font-bold">{court.name}</p>
                              <p className="text-[0.62rem] text-muted-foreground">
                                {court.status.toLowerCase()}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'grid size-5 place-items-center rounded-full border',
                                selected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-input',
                              )}
                            >
                              {selected ? <Check className="size-3" /> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      title="No courts yet"
                      description="Add courts to this club before creating a session."
                      action={
                        <Button asChild size="sm">
                          <Link href={`/manage/clubs/${clubId}/courts`}>
                            <Plus className="size-3.5" /> Add courts
                          </Link>
                        </Button>
                      }
                    />
                  )}

                  <div className="grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-2">
                    <Field label="Registration" htmlFor="registration">
                      <Select
                        id="registration"
                        value={registrationPolicy}
                        onChange={(event) => setRegistrationPolicy(event.target.value)}
                      >
                        <option value="OPEN">Open registration</option>
                        <option value="APPROVAL">Approval required</option>
                        <option value="INVITE_ONLY">Invite only</option>
                      </Select>
                    </Field>
                    <Field label="Check-in" htmlFor="checkIn">
                      <Select
                        id="checkIn"
                        value={checkInPolicy}
                        onChange={(event) => setCheckInPolicy(event.target.value)}
                      >
                        <option value="SELF">Player self check-in</option>
                        <option value="MANAGER">Queue Master only</option>
                        <option value="SELF_AND_MANAGER">Self or Queue Master</option>
                      </Select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Toggle
                        checked={allowLate}
                        onChange={setAllowLate}
                        label="Allow late arrivals"
                        description="Players who check in after the session goes live can join the waiting queue."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Toggle
                        checked={guestJoinPolicy === 'OPEN'}
                        onChange={(value) => setGuestJoinPolicy(value ? 'OPEN' : 'DISABLED')}
                        label="Allow guest self-join"
                        description="Players scanning the session QR can join without an account. Requires self check-in."
                      />
                      {guestJoinPolicy === 'OPEN' && checkInPolicy === 'MANAGER' ? (
                        <p className="mt-1.5 text-xs font-medium text-destructive">
                          Choose self check-in or self-and-manager to allow guests to join.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-lg font-bold">Matchmaking rules</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Games played and wait time always lead. These settings shape grouping and team
                      balance.
                    </p>
                  </div>
                  <Field label="Strategy" htmlFor="strategy">
                    <Select
                      id="strategy"
                      value={strategy}
                      onChange={(event) => setStrategy(event.target.value as typeof strategy)}
                    >
                      <option value="HYBRID">Hybrid — recommended</option>
                      <option value="SKILL_FIRST">Skill first</option>
                      <option value="FAIRNESS_FIRST">Fairness first</option>
                    </Select>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={`Preferred skill spread · ${preferredSpread.toFixed(2)}`}
                      htmlFor="preferred"
                    >
                      <input
                        id="preferred"
                        type="range"
                        min={0}
                        max={3}
                        step={0.25}
                        value={preferredSpread}
                        onChange={(event) => setPreferredSpread(Number(event.target.value))}
                        className="w-full accent-[#164430]"
                      />
                    </Field>
                    <Field label={`Maximum skill spread · ${maxSpread.toFixed(2)}`} htmlFor="max">
                      <input
                        id="max"
                        type="range"
                        min={0.25}
                        max={4}
                        step={0.25}
                        value={maxSpread}
                        onChange={(event) => setMaxSpread(Number(event.target.value))}
                        className="w-full accent-[#164430]"
                      />
                    </Field>
                    <Field label="Widen skill range after (min)" htmlFor="widen">
                      <Input
                        id="widen"
                        type="number"
                        min={0}
                        max={120}
                        value={widenAfter}
                        onChange={(event) => setWidenAfter(Number(event.target.value))}
                      />
                    </Field>
                    <Field label="Minimum rest (minutes)" htmlFor="rest">
                      <Input
                        id="rest"
                        type="number"
                        min={0}
                        max={180}
                        value={minRest}
                        onChange={(event) => setMinRest(Number(event.target.value))}
                      />
                    </Field>
                    <Field label="Partner repetition penalty" htmlFor="partner">
                      <Input
                        id="partner"
                        type="number"
                        min={0}
                        max={100}
                        value={partnerPenalty}
                        onChange={(event) => setPartnerPenalty(Number(event.target.value))}
                      />
                    </Field>
                    <Field label="Opponent repetition penalty" htmlFor="opponent">
                      <Input
                        id="opponent"
                        type="number"
                        min={0}
                        max={100}
                        value={opponentPenalty}
                        onChange={(event) => setOpponentPenalty(Number(event.target.value))}
                      />
                    </Field>
                    <Field label="Starvation gap (games)" htmlFor="starvation">
                      <Input
                        id="starvation"
                        type="number"
                        min={0}
                        max={5}
                        value={starvationGap}
                        onChange={(event) => setStarvationGap(Number(event.target.value))}
                      />
                    </Field>
                    <Field
                      label="Max games per player"
                      htmlFor="maxGames"
                      hint="Leave blank for unlimited."
                    >
                      <Input
                        id="maxGames"
                        type="number"
                        min={1}
                        max={50}
                        value={maxGames}
                        onChange={(event) => setMaxGames(event.target.value)}
                        placeholder="Unlimited"
                      />
                    </Field>
                  </div>
                  <Toggle
                    checked={autoAssign}
                    onChange={setAutoAssign}
                    label="Auto-commit the next rotation"
                    description="When a match completes, generate and commit the next rotation automatically. A Queue Master can still review every match."
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-lg font-bold">Scoring and publication</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Rally scoring only in this release. Side-out scoring is not offered.
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-[0.8rem] font-semibold text-foreground/80">
                      Target score
                    </p>
                    <div className="flex gap-2">
                      {[11, 15, 21].map((target) => (
                        <button
                          key={target}
                          type="button"
                          onClick={() => setTargetScore(target)}
                          className={cn(
                            'h-11 flex-1 rounded-xl border text-sm font-bold transition-colors',
                            targetScore === target
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background/50',
                          )}
                        >
                          {target}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Best of" htmlFor="bestOf">
                      <Select
                        id="bestOf"
                        value={bestOf}
                        onChange={(event) => setBestOf(Number(event.target.value))}
                      >
                        <option value={1}>Single game</option>
                        <option value={3}>Best of three</option>
                      </Select>
                    </Field>
                    <Field label="Point cap" htmlFor="cap" hint="Optional. Leave blank for no cap.">
                      <Input
                        id="cap"
                        type="number"
                        min={11}
                        max={40}
                        value={pointCap}
                        onChange={(event) => setPointCap(event.target.value)}
                        placeholder="No cap"
                      />
                    </Field>
                  </div>
                  <Toggle
                    checked={winByTwo}
                    onChange={setWinByTwo}
                    label="Win by two"
                    description="A game continues past the target until one team leads by two."
                  />
                  <Toggle
                    checked={published}
                    onChange={setPublished}
                    label="Publish and schedule now"
                    description="Creates the session as scheduled and makes its public link available."
                  />
                  <div className="rounded-2xl border border-[#d9edb2] bg-lime-soft/50 p-4">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#47641d]">
                      Review
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold">{name}</h3>
                    <p className="text-xs text-[#3e5716]">
                      {startIso && endIso
                        ? `${formatDay(startIso, timezone)} · ${formatRange(startIso, endIso, timezone)}`
                        : 'Choose a time'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] font-semibold text-[#47641d]">
                      <span className="rounded-full bg-white/70 px-2.5 py-1">
                        {selectedCourts.length} courts
                      </span>
                      <span className="rounded-full bg-white/70 px-2.5 py-1">
                        {format === 'DOUBLES' ? 'Doubles' : 'Singles'}
                      </span>
                      <span className="rounded-full bg-white/70 px-2.5 py-1">
                        {strategy.replace('_', ' ')}
                      </span>
                      <span className="rounded-full bg-white/70 px-2.5 py-1">To {targetScore}</span>
                      <span className="rounded-full bg-white/70 px-2.5 py-1">
                        {autoAssign ? 'Auto-rotate' : 'Manual rotation'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-between gap-2 border-t border-border/70 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={step === 0}
                >
                  Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => setStep((current) => current + 1)}
                    disabled={!canContinue}
                  >
                    Continue <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void submit()}
                    disabled={saving || !canContinue || selectedCourts.length === 0}
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Create session
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                At a glance
              </p>
              <h3 className="mt-1 font-display text-lg font-bold">{name || 'Untitled session'}</h3>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Clock3 className="size-3.5" />{' '}
                  {startIso && endIso ? formatRange(startIso, endIso, timezone) : 'Time not set'}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="size-3.5" /> {selectedCourts.length} courts · {capacity}{' '}
                  capacity
                </p>
                <p className="flex items-center gap-2">
                  <CircleDollarSign className="size-3.5" />{' '}
                  {published ? 'Public once created' : 'Private draft'}
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="rounded-[1.35rem] border border-border bg-card p-5">
            <ShieldCheck className="size-5 text-[#47671b]" />
            <p className="mt-2 font-display text-sm font-bold">Fair by design</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              The engine evaluates every doubles team split. You can change rules before the session
              starts, but not after it goes live.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/manage/clubs/${clubId}/courts`}>
              <Plus className="size-4" /> Add more courts
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
