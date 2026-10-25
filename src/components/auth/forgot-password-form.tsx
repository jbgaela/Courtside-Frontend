'use client';

import Link from 'next/link';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ForgotPasswordForm() {
  return (
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-lime-soft text-[#486b1c]">
        <KeyRound className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Recover your account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Email delivery is not configured, so there is no self-service reset link. A Super Admin can
        issue a short-lived, single-use recovery link after verifying your identity through an
        approved support process.
      </p>
      <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mr-1 inline size-3.5 text-primary" />
        Recovery links are shown once, expire automatically and revoke existing sessions when
        redeemed. Never share an existing password with an administrator.
      </div>
      <Button asChild className="mt-6 w-full" size="lg">
        <Link href="/sign-in">Back to sign in</Link>
      </Button>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Need help? Contact your club administrator or PickleQueue support.
      </p>
    </div>
  );
}
