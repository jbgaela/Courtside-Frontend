'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export function VerifyEmailForm({ initialToken }: { initialToken?: string }) {
  const { me, refresh } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState(initialToken ?? '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(initialToken ?? null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async (value: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/v1/auth/verify-email', { token: value });
      await refresh();
      setVerified(true);
      toast.success('Email verified');
      setTimeout(() => router.replace('/app'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const result = await api.post<{ sent: boolean; devVerificationToken: string | null }>(
        '/api/v1/auth/resend-verification',
      );
      if (result.devVerificationToken) setDevToken(result.devVerificationToken);
      toast.success('Verification link generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend verification');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e6f4ea] text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">You are verified</h1>
        <p className="mt-2 text-sm text-muted-foreground">Taking you to your dashboardâ€¦</p>
      </div>
    );
  }

  return (
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
        <MailCheck className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Verify your email
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {me?.emailVerified
          ? 'Your email is already verified. Continue to your dashboard.'
          : 'Privileged actions like creating a club or checking in need a verified email. In this demo, the verification token is shown below.'}
      </p>

      {me?.emailVerified ? (
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href="/app">Go to dashboard</Link>
        </Button>
      ) : (
        <>
          {devToken ? (
            <div className="mt-5 rounded-2xl border border-[#d9edb2] bg-lime-soft/70 p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#47641d]">
                Demo verification
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
                Email delivery is disabled in the demo. Use the one-time token below.
              </p>
              <Button
                className="mt-3 w-full"
                variant="dark"
                onClick={() => void verify(devToken)}
                disabled={loading}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Verify this account now
              </Button>
            </div>
          ) : null}

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void verify(token);
            }}
          >
            <Field
              label="Verification token"
              htmlFor="token"
              hint="Paste the token from your email."
            >
              <Input
                id="token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="One-time verification token"
                required
              />
            </Field>
            {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" size="lg" disabled={loading || !token}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Verify email
            </Button>
            {me ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => void resend()}
                disabled={resending}
              >
                Resend verification
              </Button>
            ) : null}
          </form>

          {devToken ? (
            <details className="mt-4 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-semibold text-primary">Show token</summary>
              <code className="mt-2 block break-all rounded-lg bg-secondary p-2 font-mono text-[0.65rem]">
                {devToken}
              </code>
            </details>
          ) : null}
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/app" className="font-semibold text-primary hover:underline">
          Skip for now
        </Link>{' '}
        Â· some actions stay locked until verified.
      </p>
    </div>
  );
}
