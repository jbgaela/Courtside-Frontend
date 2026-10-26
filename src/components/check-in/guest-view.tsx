'use client';

import * as React from 'react';
import {
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
  Trophy,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
import { GUEST_GENDER_LABELS, SKILL_MAX, SKILL_MIN, SKILL_STEP } from '@picklequeue/contracts';
import { api } from '@/lib/api';
import { formatRange, formatShortDay } from '@/lib/format';
import type { GuestStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';

const SKILL_OPTIONS = Array.from(
  { length: Math.round((SKILL_MAX - SKILL_MIN) / SKILL_STEP) + 1 },
  (_, index) => Number((SKILL_MIN + index * SKILL_STEP).toFixed(2)),
);

const CLIENT_KEY = 'pq.guestClientKey';

function clientKey(): string {
  try {
    const existing = window.localStorage.getItem(CLIENT_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(CLIENT_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

interface JoinResult extends GuestStatus {
  created: boolean;
}

export function GuestJoinForm({
  token,
  onJoined,
  onDuplicate,
}: {
  token: string;
  onJoined: (status: GuestStatus) => void;
  onDuplicate: () => void;
}) {
  const [displayName, setDisplayName] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [skillRating, setSkillRating] = React.useState('3');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const key = React.useRef<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!displayName.trim()) nextErrors.displayName = 'Enter your name';
    if (!gender) nextErrors.gender = 'Choose a gender option';
    const skill = Number(skillRating);
    if (!Number.isFinite(skill) || skill < SKILL_MIN || skill > SKILL_MAX) {
      nextErrors.skillRating = `Choose a skill between ${SKILL_MIN} and ${SKILL_MAX}`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    setError(null);
    key.current ??= clientKey();
    try {
      const result = await api.post<JoinResult>(
        `/api/v1/public/checkins/${encodeURIComponent(token)}/guests`,
        {
          displayName: displayName.trim(),
          gender,
          skillRating: skill,
          clientKey: key.current,
        },
      );
      onJoined(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not join this session';
      if (message.toLowerCase().includes('already joined')) {
        // The first request may have set the HttpOnly cookie even though this
        // response lost the race. Ask the page to fetch the authoritative status;
        // keep the message visible in case the refetch cannot prove ownership.
        setError(message);
        onDuplicate();
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={(event) => void submit(event)}>
      <div>
        <h2 className="font-display text-lg font-bold">Join as a guest</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          No account, email or password. Your name, gender and skill are used only for this
          session&apos;s matchmaking.
        </p>
      </div>
      <Field label="Your name" htmlFor="guest-display-name" error={errors.displayName}>
        <Input
          id="guest-display-name"
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            setErrors((current) => ({ ...current, displayName: '' }));
          }}
          placeholder="Alex Rivera"
          autoComplete="name"
          maxLength={80}
          aria-invalid={Boolean(errors.displayName)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Gender" htmlFor="guest-gender" error={errors.gender}>
          <Select
            id="guest-gender"
            value={gender}
            onChange={(event) => {
              setGender(event.target.value);
              setErrors((current) => ({ ...current, gender: '' }));
            }}
            aria-invalid={Boolean(errors.gender)}
          >
            <option value="">Choose…</option>
            {Object.entries(GUEST_GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Skill level" htmlFor="guest-skill" error={errors.skillRating}>
          <Select
            id="guest-skill"
            value={skillRating}
            onChange={(event) => {
              setSkillRating(event.target.value);
              setErrors((current) => ({ ...current, skillRating: '' }));
            }}
            aria-invalid={Boolean(errors.skillRating)}
          >
            {SKILL_OPTIONS.map((skill) => (
              <option key={skill} value={skill}>
                {skill.toFixed(2)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-[#fbe9e7] p-3 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <UserRound className="size-4" />}
        Join this session
      </Button>
      <p className="text-center text-[0.65rem] leading-relaxed text-muted-foreground">
        Already have an account?{' '}
        <a
          className="font-semibold text-primary hover:underline"
          href={`/sign-in?next=${encodeURIComponent(`/check-in/${token}`)}`}
        >
          Sign in instead
        </a>
      </p>
    </form>
  );
}

function matchLabel(match: GuestStatus['match']) {
  if (!match) return null;
  if (match.state === 'COMPLETED') return 'Match completed';
  if (match.state === 'PLAYING') return `You're playing on ${match.courtName}`;
  return `You're up on ${match.courtName}`;
}

export function GuestStatusPanel({
  status,
  onRefresh,
  onLeave,
  leaving,
}: {
  status: GuestStatus;
  onRefresh: () => void;
  onLeave: () => void;
  leaving: boolean;
}) {
  const session = status.session;
  const ended = ['COMPLETED', 'CANCELLED'].includes(session.status);
  const removed = status.guest.status === 'REMOVED';
  const left = status.guest.status === 'LEFT';
  const activeMatch = status.match;
  const label = removed
    ? 'You were removed'
    : left
      ? 'You left this session'
      : ended
        ? 'This session has ended'
        : activeMatch
          ? matchLabel(activeMatch)
          : status.queue?.state === 'WAITING'
            ? "You're in the queue"
            : status.queue?.state === 'RESTING'
              ? 'Resting — your next match is coming'
              : status.queue?.state === 'PAUSED'
                ? 'Your queue participation is paused'
                : "You're checked in";

  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#47671b]">
            {status.guest.origin === 'SELF' ? 'Guest check-in' : 'Guest player'}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.03em]">
            {status.guest.displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.clubName} · {session.name}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      <div className="mt-4 rounded-xl bg-secondary/55 p-4">
        <p className="text-sm font-bold">{label}</p>
        {removed ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The Queue Master removed you from this session. Ask them if you should be re-added.
          </p>
        ) : left ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            You are no longer in the queue. Ask the Queue Master if you want to rejoin.
          </p>
        ) : ended ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Thanks for playing. Your session record is below if you completed a match.
          </p>
        ) : status.queue?.state === 'WAITING' ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-display text-4xl font-extrabold text-primary">
              {status.queue.position ? `#${status.queue.position}` : '—'}
            </span>
            <span className="text-xs text-muted-foreground">
              {status.queue.estimatedWaitMinutes === null
                ? 'Waiting for the next rotation'
                : status.queue.estimatedWaitMinutes === 0
                  ? 'You are next'
                  : `Estimated wait about ${status.queue.estimatedWaitMinutes} min`}
            </span>
          </div>
        ) : activeMatch?.state === 'PLAYING' ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {activeMatch.yourTeam.join(' + ')} vs {activeMatch.opponents.join(' + ')}
          </p>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {session.format === 'DOUBLES' ? 'Doubles' : 'Singles'} · stay close to the courts.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-3.5" /> {formatShortDay(session.startsAt, session.timezone)}
        </p>
        <p className="flex items-center gap-2">
          <Clock3 className="size-3.5" />
          {formatRange(session.startsAt, session.endsAt, session.timezone)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="size-3.5" /> {session.venue ?? 'Venue shown on arrival'}
        </p>
        <p className="flex items-center gap-2">
          <Users className="size-3.5" />
          {status.queue
            ? `${status.queue.gamesPlayed} game${status.queue.gamesPlayed === 1 ? '' : 's'} played`
            : 'Waiting for your first game'}
        </p>
      </div>

      {activeMatch ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/40 px-3.5 py-2.5">
            <p className="text-xs font-bold">{activeMatch.courtName}</p>
            <Badge tone={activeMatch.state === 'PLAYING' ? 'lime' : 'neutral'} dot>
              {activeMatch.state === 'PLAYING'
                ? 'Live'
                : activeMatch.state === 'COMPLETED'
                  ? 'Completed'
                  : 'Assigned'}
            </Badge>
          </div>
          <div className="space-y-2 p-3.5 text-xs">
            <p className="font-semibold">You + {activeMatch.yourTeam.filter((name) => name !== status.guest.displayName).join(' + ') || '—'}</p>
            <p className="text-muted-foreground">vs {activeMatch.opponents.join(' + ')}</p>
            <p className="font-display text-2xl font-extrabold tabular">
              {activeMatch.currentGame.a}–{activeMatch.currentGame.b}
            </p>
            {activeMatch.state === 'COMPLETED' ? (
              <p className="font-semibold">
                {activeMatch.winnerTeam === activeMatch.team ? 'Your team won' : 'Your team lost'}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!activeMatch && status.lastResult ? (
        <div className="mt-4 rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Trophy className="size-3.5 text-primary" /> Last match · {status.lastResult.courtName}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {status.lastResult.yourTeam.join(' + ')} vs {status.lastResult.opponents.join(' + ')}
          </p>
          <p className="mt-1 font-display text-xl font-extrabold tabular">
            {status.lastResult.currentGame.a}–{status.lastResult.currentGame.b}
          </p>
          <p className="mt-1 text-xs font-semibold">
            {status.lastResult.winnerTeam === status.lastResult.team
              ? 'Your team won'
              : 'Your team lost'}
          </p>
        </div>
      ) : null}

      {!removed && !left && !ended && status.canLeave ? (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (window.confirm('Leave this session? You will leave the queue.')) onLeave();
            }}
            disabled={leaving}
          >
            {leaving ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
            Leave session
          </Button>
        </div>
      ) : null}
    </div>
  );
}
