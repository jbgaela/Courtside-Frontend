'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { safeInternalPath } from '@/lib/navigation';
import { clearRegistrationClientState, setRegistrationCsrf } from '@/lib/registration-session';
import type { Me, RegistrationStatusView } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

type LoginResponse =
  | { restricted: false; user: Me; csrfToken: string; expiresAt: string }
  | {
      restricted: true;
      status: 'PENDING_APPROVAL' | 'APPROVED_PENDING_ACTIVATION' | 'REJECTED';
      registration: RegistrationStatusView;
      csrfToken: string;
      expiresAt: string;
    }
  | { mfaRequired: true; setupRequired: boolean; expiresAt: string };

export function SignInForm({ next }: { next?: string }) {
  const { setMe } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<'form' | 'owner' | 'player' | 'admin' | 'mfa' | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const signIn = async (
    emailValue: string,
    passwordValue: string,
    source: 'form' | 'owner' | 'player' | 'admin',
  ) => {
    setLoading(source);
    setError(null);
    try {
      const response = await api.post<LoginResponse>('/api/v1/auth/login', {
        email: emailValue,
        password: passwordValue,
      });
      if ('mfaRequired' in response) {
        if (response.setupRequired) {
          router.replace('/mfa-setup');
          return;
        }
        setMfaRequired(true);
        setLoading(null);
        return;
      }
      if (response.restricted) {
        setRegistrationCsrf(response.csrfToken);
        router.replace(
          response.status === 'APPROVED_PENDING_ACTIVATION' ? '/activate' : '/registration-status',
        );
        return;
      }
      clearRegistrationClientState();
      setMe(response.user);
      toast.success(
        `Welcome back, ${response.user.profile?.displayName ?? response.user.name.split(' ')[0]}`,
      );
      const target =
        safeInternalPath(next) ??
        (response.user.platformRole === 'SUPER_ADMIN'
          ? '/admin'
          : response.user.memberships.some((m) => m.role !== 'PLAYER')
            ? '/manage'
            : '/app');
      router.replace(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
      setLoading(null);
    }
  };

  const verifyMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading('mfa');
    setError(null);
    try {
      const response = await api.post<{ user: Me; csrfToken: string }>('/api/v1/auth/mfa/verify', {
        code: mfaCode,
      });
      setMe(response.user);
      toast.success('Identity verified');
      router.replace(response.user.platformRole === 'SUPER_ADMIN' ? '/admin' : '/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify the authenticator code');
      setLoading(null);
    }
  };

  if (mfaRequired) {
    return (
      <div>
        <span className="grid size-14 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
          <ShieldCheck className="size-7" />
        </span>
        <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
          Two-factor security
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Enter your authenticator code
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Open your authenticator app and enter the current six-digit code for PickleQueue.
        </p>
        <form className="mt-6 space-y-4" onSubmit={(event) => void verifyMfa(event)}>
          <Field label="Six-digit code" htmlFor="mfa-code">
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-xl tracking-[0.35em]"
              required
              autoFocus
            />
          </Field>
          {error ? (
            <div
              className="rounded-xl border border-[#f0d8d4] bg-[#fdf6f5] px-3.5 py-2.5 text-xs font-medium text-[#8f3a33]"
              role="alert"
            >
              {error}
            </div>
          ) : null}
          <Button type="submit" className="w-full" size="lg" disabled={loading !== null}>
            {loading === 'mfa' ? <Loader2 className="size-4 animate-spin" /> : null}
            Verify and continue
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-semibold text-primary hover:underline">
            Use a different account
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Sign in to play
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your queue, courts and next match are waiting.
        </p>
        <p className="mt-3 rounded-xl border border-[#d9edb2] bg-lime-soft/50 px-3 py-2 text-[0.7rem] font-medium leading-relaxed text-[#3f5c16]">
          New accounts require administrator approval before they can be used.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void signIn(email, password, 'form');
        }}
      >
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground max-sm:size-11 hover:bg-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="inline-flex min-h-6 items-center text-xs font-semibold text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error ? (
          <div
            className="rounded-xl border border-[#f0d8d4] bg-[#fdf6f5] px-3.5 py-2.5 text-xs font-medium text-[#8f3a33]"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={loading !== null}>
          {loading === 'form' ? <Loader2 className="size-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Demo access
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto flex-col items-start gap-0.5 px-3 py-2.5 text-left"
          onClick={() => void signIn('owner@picklequeue.dev', 'PickleQueue123!', 'owner')}
          disabled={loading !== null}
        >
          <span className="text-xs font-bold">Queue Master</span>
          <span className="text-[0.6rem] font-normal text-muted-foreground">Morgan - demo</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto flex-col items-start gap-0.5 px-3 py-2.5 text-left"
          onClick={() => void signIn('alex@picklequeue.dev', 'PickleQueue123!', 'player')}
          disabled={loading !== null}
        >
          <span className="text-xs font-bold">Player</span>
          <span className="text-[0.6rem] font-normal text-muted-foreground">Alex - demo</span>
        </Button>
        <Button
          type="button"
          variant="dark"
          size="sm"
          className="col-span-2 h-auto flex-col items-start gap-0.5 px-3 py-2.5 text-left"
          onClick={() => void signIn('sarah@picklequeue.dev', 'PickleQueue123!', 'admin')}
          disabled={loading !== null}
        >
          <span className="text-xs font-bold">Super Admin</span>
          <span className="text-[0.6rem] font-normal text-white/60">Sarah - platform demo</span>
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to PickleQueue?{' '}
        <Link href="/sign-up" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
