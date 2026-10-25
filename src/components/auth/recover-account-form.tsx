'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export function RecoverAccountForm({ initialToken }: { initialToken?: string }) {
  const router = useRouter();
  const [token] = React.useState(initialToken ?? '');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialToken) window.history.replaceState({}, '', '/recover-account');
  }, [initialToken]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/v1/auth/recover', { token, password });
      toast.success('Password updated. Sign in with your new password.');
      router.replace('/sign-in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to recover the account');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-[#fbe9e7] text-destructive">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold">Recovery link required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask a Super Admin to generate a one-time recovery link for your verified account.
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
        <ShieldCheck className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Recover your account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Choose a new password. The recovery link expires and all existing sessions will be revoked.
      </p>
      <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
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
        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </div>
  );
}
