'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { safeInternalPath } from '@/lib/navigation';
import type { Me } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export function SignInForm({ next }: { next?: string }) {
  const { setMe } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<'form' | 'owner' | 'player' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (
    emailValue: string,
    passwordValue: string,
    source: 'form' | 'owner' | 'player',
  ) => {
    setLoading(source);
    setError(null);
    try {
      const response = await api.post<{ user: Me; csrfToken: string }>('/api/v1/auth/login', {
        email: emailValue,
        password: passwordValue,
      });
      setMe(response.user);
      toast.success(
        `Welcome back, ${response.user.profile?.displayName ?? response.user.name.split(' ')[0]}`,
      );
      const target =
        safeInternalPath(next) ??
        (response.user.memberships.some((m) => m.role !== 'PLAYER') ? '/manage' : '/app');
      router.replace(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
      setLoading(null);
    }
  };

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
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-primary hover:underline"
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
          <span className="text-[0.6rem] font-normal text-muted-foreground">Morgan Â· demo</span>
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
          <span className="text-[0.6rem] font-normal text-muted-foreground">Alex Â· demo</span>
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
