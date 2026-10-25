'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  clearRegistrationClientState,
  getRegistrationCsrf,
  setRegistrationCsrf,
} from '@/lib/registration-session';
import type { Me, RegistrationStatusView } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/feedback';

export function ActivateAccountForm() {
  const router = useRouter();
  const { setMe } = useAuth();
  const [registration, setRegistration] = React.useState<RegistrationStatusView | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [displayName, setDisplayName] = React.useState('');
  const [skillRating, setSkillRating] = React.useState('3');
  const [acceptTerms, setAcceptTerms] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const status = await api.get<RegistrationStatusView>('/api/v1/auth/registration-status');
        if (!active) return;
        setRegistration(status);
        setDisplayName(status.name);
        setRegistrationCsrf(status.csrfToken);
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError && err.status === 401
              ? 'Sign in with your approved account to continue.'
              : err instanceof Error
                ? err.message
                : 'Unable to load your approval status',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!acceptTerms) {
      setError('Accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    setSaving(true);
    try {
      const csrf = getRegistrationCsrf();
      const response = await api.post<{ user: Me; csrfToken: string }>(
        '/api/v1/auth/activate',
        {
          displayName: displayName.trim(),
          skillRating: Number(skillRating),
          acceptTerms: true,
        },
        { headers: csrf ? { 'x-csrf-token': csrf } : undefined },
      );
      clearRegistrationClientState();
      setMe(response.user);
      toast.success('Your account is active. Welcome to PickleQueue.');
      router.replace('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to activate your account');
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (error && !registration) {
    return (
      <div>
        <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
          <ShieldCheck className="size-7" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold">Activation unavailable</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error}</p>
        <Button asChild className="mt-6 w-full">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
  }
  if (!registration?.canActivate) {
    return (
      <div>
        <span className="grid size-14 place-items-center rounded-2xl bg-[#fbf0d9] text-[#8a5a0b]">
          <ShieldCheck className="size-7" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold">Approval required</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This account is not ready for activation yet. Check your registration status for the
          latest decision.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/registration-status">View registration status</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <span className="grid size-14 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
        <CheckCircle2 className="size-7" />
      </span>
      <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
        Approved - last step
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Set up your player profile
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Your account is approved. Confirm your name and skill level to activate access.
      </p>

      <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
        <Field label="Display name" htmlFor="displayName">
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="pl-10"
              required
              minLength={1}
              maxLength={50}
            />
          </div>
        </Field>
        <Field label="Skill level" htmlFor="skill" hint="Used to keep rotations balanced.">
          <Select
            id="skill"
            value={skillRating}
            onChange={(event) => setSkillRating(event.target.value)}
          >
            <option value="1.5">Beginner</option>
            <option value="2.5">Lower intermediate</option>
            <option value="3">Intermediate</option>
            <option value="3.75">Upper intermediate</option>
            <option value="4.5">Advanced</option>
            <option value="5.5">Competitive</option>
          </Select>
        </Field>
        <label className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            className="mt-0.5 size-4 rounded border-input accent-primary"
            required
          />
          <span>
            I agree to the{' '}
            <Link href="/terms" className="font-semibold text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {error ? (
          <div
            className="rounded-xl border border-[#f0d8d4] bg-[#fdf6f5] px-3.5 py-2.5 text-xs font-medium text-[#8f3a33]"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Activate my account
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Signed in as {registration.email}
      </p>
    </div>
  );
}
