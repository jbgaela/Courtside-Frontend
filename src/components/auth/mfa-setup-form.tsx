'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Copy, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Me } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

interface SetupDetails {
  secret: string;
  otpauthUri: string;
}

export function MfaSetupForm() {
  const router = useRouter();
  const { setMe, refresh } = useAuth();
  const [setup, setSetup] = React.useState<SetupDetails | null>(null);
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await api.post<SetupDetails>('/api/v1/auth/mfa/setup');
        if (active) setSetup(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError && err.status === 401
              ? 'Sign in as a Super Admin to set up MFA.'
              : err instanceof Error
                ? err.message
                : 'Unable to start MFA setup',
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

  const copySecret = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success('Setup key copied');
    } catch {
      toast.error('Copy failed. Select the key manually.');
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await api.post<{ user?: Me; csrfToken?: string; enabled?: boolean }>(
        '/api/v1/auth/mfa/enable',
        { code },
      );
      if (result.user) {
        setMe(result.user);
        toast.success('MFA enabled. Welcome to the admin console.');
        router.replace('/admin');
        return;
      }
      await refresh();
      toast.success('MFA enabled');
      router.replace('/admin/settings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify the authenticator code');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparing secure enrollment…</p>
      </div>
    );
  }

  if (!setup) {
    return (
      <div>
        <span className="grid size-14 place-items-center rounded-2xl bg-[#fbe9e7] text-destructive">
          <KeyRound className="size-7" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold">MFA setup unavailable</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {error ?? 'Sign in as a Super Admin to continue.'}
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <span className="grid size-14 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
        <KeyRound className="size-7" />
      </span>
      <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
        Super Admin security
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Add a second factor
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Add this key to your authenticator app, then enter the current six-digit code. This protects
        platform administration with more than a password.
      </p>
      <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-4">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Manual setup key
        </p>
        <p className="mt-2 break-all font-mono text-sm font-semibold tracking-[0.12em]">
          {setup.secret}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void copySecret()}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy setup key'}
        </Button>
        <p className="mt-3 break-all text-[0.6rem] text-muted-foreground">
          Authenticator URI: {setup.otpauthUri}
        </p>
      </div>
      <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
        <Field label="Six-digit authenticator code" htmlFor="mfa-setup-code">
          <Input
            id="mfa-setup-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-xl tracking-[0.35em]"
            required
          />
        </Field>
        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Enable MFA and continue
        </Button>
      </form>
      <p className="mt-5 text-center text-[0.65rem] leading-relaxed text-muted-foreground">
        Keep the authenticator device secure. Recovery of an MFA-protected Super Admin account
        requires the controlled support workflow.
      </p>
    </div>
  );
}
