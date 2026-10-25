'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Lock, Save, Settings2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { invalidateSessionQueries, useClubCourts, useSession } from '@/lib/queries';
import { formatDay, formatRange } from '@/lib/format';
import type { SessionRecord } from '@/lib/types';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { cn } from '@/lib/utils';

function toLocal(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function SessionSettingsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const queryClient = useQueryClient();
  const sessionQuery = useSession(sessionId);
  const session = sessionQuery.data;
  const courts = useClubCourts(session?.clubId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(24);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [registrationPolicy, setRegistrationPolicy] = useState('OPEN');
  const [checkInPolicy, setCheckInPolicy] = useState('SELF');
  const [allowLate, setAllowLate] = useState(true);
  const [selectedCourts, setSelectedCourts] = useState<string[]>([]);
  const [preferredSpread, setPreferredSpread] = useState(0.75);
  const [maxSpread, setMaxSpread] = useState(1.5);
  const [minRest, setMinRest] = useState(5);
  const [autoAssign, setAutoAssign] = useState(false);
  const [targetScore, setTargetScore] = useState(11);
  const [winByTwo, setWinByTwo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!session || initialized) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(session.name);
    setDescription(session.description ?? '');
    setVenue(session.venue ?? '');
    setCapacity(session.capacity);
    setStartsAt(toLocal(session.startsAt));
    setEndsAt(toLocal(session.endsAt));
    setRegistrationPolicy(session.registrationPolicy);
    setCheckInPolicy(session.checkInPolicy);
    setAllowLate(session.allowLateArrivals);
    setSelectedCourts(session.courts.map((court) => court.id));
    setPreferredSpread(session.matchmaking.preferredSkillSpread);
    setMaxSpread(session.matchmaking.maxSkillSpread);
    setMinRest(session.matchmaking.minRestMinutes);
    setAutoAssign(session.matchmaking.autoAssign);
    setTargetScore(session.scoring.targetScore);
    setWinByTwo(session.scoring.winByTwo);
    setInitialized(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [session, initialized]);

  if (sessionQuery.isLoading) return <PageSkeleton />;
  if (sessionQuery.isError || !session) {
    return (
      <ErrorState
        title="Session unavailable"
        error={sessionQuery.error}
        onRetry={() => void sessionQuery.refetch()}
      />
    );
  }

  const locked = ['LIVE', 'COMPLETED', 'CANCELLED'].includes(session.status);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch<SessionRecord>(`/api/v1/sessions/${sessionId}`, {
        name,
        description: description || null,
        venue: venue || null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        capacity,
        registrationPolicy,
        checkInPolicy,
        allowLateArrivals: allowLate,
        courtIds: selectedCourts,
        expectedVersion: session.version,
        matchmaking: {
          ...session.matchmaking,
          preferredSkillSpread: preferredSpread,
          maxSkillSpread: maxSpread,
          minRestMinutes: minRest,
          autoAssign,
        },
        scoring: {
          ...session.scoring,
          targetScore,
          winByTwo,
        },
      });
      queryClient.setQueryData(['session', sessionId], updatedWithConfig);
      await invalidateSessionQueries(queryClient, sessionId);
      toast.success('Session settings saved');
      setInitialized(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save session settings');
    } finally {
      setSaving(false);
    }
  };

  const updatedWithConfig = {
    ...session,
    name,
    description: description || null,
    venue: venue || null,
    capacity,
    registrationPolicy,
    checkInPolicy,
    allowLateArrivals: allowLate,
    matchmaking: {
      ...session.matchmaking,
      preferredSkillSpread: preferredSpread,
      maxSkillSpread: maxSpread,
      minRestMinutes: minRest,
      autoAssign,
    },
    scoring: { ...session.scoring, targetScore, winByTwo },
  };

  const publish = async () => {
    try {
      await api.post(`/api/v1/sessions/${sessionId}/publish`, {
        published: !session.published,
        expectedVersion: session.version,
      });
      await invalidateSessionQueries(queryClient, sessionId);
      toast.success(session.published ? 'Public link disabled' : 'Public link enabled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update publication');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/manage/sessions/${sessionId}`}>
            <ArrowLeft className="size-4" /> Session board
          </Link>
        </Button>
        <Badge tone={session.published ? 'success' : 'warning'}>
          {session.published ? 'Published' : 'Private'}
        </Badge>
      </div>

      <PageHeader
        eyebrow="Session settings"
        title={session.name}
        description={`${formatDay(session.startsAt, session.timezone)} Â· ${formatRange(session.startsAt, session.endsAt, session.timezone)}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => void publish()} disabled={locked}>
            <Share2 className="size-3.5" /> {session.published ? 'Unpublish' : 'Publish'}
          </Button>
        }
      />

      {locked ? (
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
              <Lock className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold">This session is {session.status.toLowerCase()}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Configuration is locked after a session starts. Run the live board, or create a new
                session for different rules.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href={`/manage/sessions/${sessionId}`}>Open live board</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-5">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Settings2 className="size-4 text-primary" />
                  <h2 className="font-display text-lg font-bold">Session details</h2>
                </div>
                <div className="mt-4 space-y-4">
                  <Field label="Name" htmlFor="name">
                    <Input
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={100}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Venue" htmlFor="venue">
                      <Input
                        id="venue"
                        value={venue}
                        onChange={(event) => setVenue(event.target.value)}
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
                    <Field label="Starts" htmlFor="startsAt">
                      <Input
                        id="startsAt"
                        type="datetime-local"
                        value={startsAt}
                        onChange={(event) => setStartsAt(event.target.value)}
                      />
                    </Field>
                    <Field label="Ends" htmlFor="endsAt">
                      <Input
                        id="endsAt"
                        type="datetime-local"
                        value={endsAt}
                        onChange={(event) => setEndsAt(event.target.value)}
                      />
                    </Field>
                    <Field label="Registration" htmlFor="registration">
                      <Select
                        id="registration"
                        value={registrationPolicy}
                        onChange={(event) => setRegistrationPolicy(event.target.value)}
                      >
                        <option value="OPEN">Open</option>
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
                  </div>
                  <Field label="Description" htmlFor="description">
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={1000}
                    />
                  </Field>
                  <label className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3.5">
                    <span className="text-sm font-semibold">
                      Allow late arrivals after going live
                    </span>
                    <input
                      type="checkbox"
                      checked={allowLate}
                      onChange={(event) => setAllowLate(event.target.checked)}
                      className="size-5 accent-[#164430]"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold">Courts</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {courts.data?.map((court) => {
                    const selected = selectedCourts.includes(court.id);
                    return (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() =>
                          setSelectedCourts((current) =>
                            current.includes(court.id)
                              ? current.filter((id) => id !== court.id)
                              : [...current, court.id],
                          )
                        }
                        disabled={court.status === 'INACTIVE' || court.status === 'MAINTENANCE'}
                        className={cn(
                          'flex items-center justify-between rounded-xl border p-3 text-left text-sm font-semibold transition-colors disabled:opacity-40',
                          selected
                            ? 'border-primary bg-[#eaf3df]'
                            : 'border-border bg-background/50',
                        )}
                      >
                        {court.name}
                        <Badge tone={selected ? 'lime' : 'neutral'}>
                          {selected ? 'In session' : 'Off'}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold">Rotation rules</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label={`Preferred spread Â· ${preferredSpread.toFixed(2)}`}
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
                  <Field label={`Maximum spread Â· ${maxSpread.toFixed(2)}`} htmlFor="max">
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
                  <Field label="Target score" htmlFor="target">
                    <Select
                      id="target"
                      value={targetScore}
                      onChange={(event) => setTargetScore(Number(event.target.value))}
                    >
                      <option value={11}>11</option>
                      <option value={15}>15</option>
                      <option value={21}>21</option>
                    </Select>
                  </Field>
                </div>
                <label className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background/50 p-3.5">
                  <span className="text-sm font-semibold">Win by two</span>
                  <input
                    type="checkbox"
                    checked={winByTwo}
                    onChange={(event) => setWinByTwo(event.target.checked)}
                    className="size-5 accent-[#164430]"
                  />
                </label>
                <label className="mt-2 flex items-center justify-between rounded-xl border border-border bg-background/50 p-3.5">
                  <span>
                    <span className="block text-sm font-semibold">Auto-commit rotations</span>
                    <span className="text-xs text-muted-foreground">
                      Generate and commit the next rotation when a match completes.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={autoAssign}
                    onChange={(event) => setAutoAssign(event.target.checked)}
                    className="size-5 accent-[#164430]"
                  />
                </label>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => void save()} disabled={saving || selectedCourts.length === 0}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save settings
              </Button>
            </div>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h2 className="font-display text-base font-bold">What locks at go-live</h2>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <li>Courts and matchmaking rules</li>
                  <li>Scoring target and win-by-two</li>
                  <li>Session dates and capacity</li>
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  This protects historical matches and every player already in the queue.
                </p>
              </CardContent>
            </Card>
            <div className="rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/60 p-5">
              <p className="font-display text-sm font-bold text-[#385513]">Public link</p>
              <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
                Public pages expose scores and court assignments only. Emails and member data stay
                private.
              </p>
              {session.published ? (
                <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                  <Link href={`/public/sessions/${session.publicId}`} target="_blank">
                    Open public page
                  </Link>
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
