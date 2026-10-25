'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError('This reset link is missing its token.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/v1/auth/reset-password', { token, password });
      toast.success('Password updated. Sign in with your new password.');
      router.replace('/sign-in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
        <ShieldCheck className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        All active sessions will be revoked after the reset.
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
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
