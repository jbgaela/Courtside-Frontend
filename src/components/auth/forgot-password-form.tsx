'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{ sent: boolean; devResetToken: string | null }>(
        '/api/v1/auth/forgot-password',
        { email },
      );
      setSent(true);
      setDevToken(result.devResetToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request a reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
        <KeyRound className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Reset your password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Enter your account email. We will generate a one-time reset link.
      </p>

      {sent ? (
        <div className="mt-6 rounded-2xl border border-[#d9edb2] bg-lime-soft/70 p-4">
          <p className="text-sm font-bold text-[#3f5c16]">Check your email</p>
          <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
            If an account exists for {email}, a reset link has been generated.
          </p>
          {devToken ? (
            <Button asChild variant="dark" size="sm" className="mt-3">
              <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`}>
                Open demo reset link
              </Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
