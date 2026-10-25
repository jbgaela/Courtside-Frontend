'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Me } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export function SignUpForm() {
  const { setMe } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post<{
        user: Me;
        csrfToken: string;
        devVerificationToken: string | null;
      }>('/api/v1/auth/register', { name, email, password });
      setMe(response.user);
      toast.success('Your account is ready.');
      const query = response.devVerificationToken
        ? `?token=${encodeURIComponent(response.devVerificationToken)}`
        : '';
      router.push(`/verify-email${query}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
          Join the club
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One account for every club, session and match.
        </p>
      </div>

      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <Field label="Full name" htmlFor="name">
          <Input
            id="name"
            autoComplete="name"
            placeholder="Alex Reyes"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </Field>
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
        <Field
          label="Password"
          htmlFor="password"
          hint="At least 8 characters with a letter and a number."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Choose a password"
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
            placeholder="Repeat your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            minLength={8}
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

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Create account
        </Button>
        <p className="text-center text-[0.65rem] leading-relaxed text-muted-foreground">
          By creating an account you agree to the community ground rules: play fair, rotate often,
          and call your own lines.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
