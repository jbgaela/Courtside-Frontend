'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, KeyRound, Loader2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { clearRegistrationClientState } from '@/lib/registration-session';
import type { Me } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export function ClaimAccountForm({ initialToken }: { initialToken?: string }) {
  const router = useRouter();
  const { setMe } = useAuth();
  const [token] = React.useState(initialToken ?? '');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialToken) {
      window.history.replaceState({}, '', '/claim-account');
    }
  }, [initialToken]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!acceptTerms) {
      setError('Accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post<{ user: Me; csrfToken: string }>('/api/v1/auth/claim', {
        token,
        password,
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        acceptTerms: true,
      });
      clearRegistrationClientState();
      setMe(response.user);
      toast.success('Account activated. Welcome to PickleQueue.');
      router.replace('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to activate this account');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-[#fbe9e7] text-destructive">
          <KeyRound className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold">Claim link required</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This page needs a one-time account claim link from a Super Admin. Ask the administrator to
          generate a fresh link if yours has expired.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
        <KeyRound className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Claim your account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Choose your password to activate the account created for you. The claim link works once.
      </p>
      <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
        <Field label="Display name (optional)" htmlFor="displayName">
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="pl-10"
              maxLength={50}
              placeholder="Keep the name on your account"
            />
          </div>
        </Field>
        <Field
          label="New password"
          htmlFor="password"
          hint="At least 8 characters with a letter and a number."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Field label="Confirm password" htmlFor="confirm">
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            minLength={8}
          />
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
        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Activate account
        </Button>
      </form>
    </div>
  );
}
