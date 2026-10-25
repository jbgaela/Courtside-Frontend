'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock3, Home, MailCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRegistrationEmail } from '@/lib/registration-session';

export function RegistrationSubmittedView() {
  const email = React.useSyncExternalStore(
    () => () => undefined,
    () => getRegistrationEmail(),
    () => null,
  );

  return (
    <div>
      <span className="grid size-16 place-items-center rounded-full bg-lime-soft text-[#486b1c]">
        <Send className="size-8" />
      </span>
      <div className="mt-5 flex items-center gap-2">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
          Registration submitted
        </p>
        <Badge tone="warning" dot>
          Pending review
        </Badge>
      </div>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Your application is in
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        An administrator will review your account before you can use PickleQueue. You can return to
        sign in and check your status at any time.
      </p>

      <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
        {email ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Account</span>
            <span className="truncate font-semibold">{email}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MailCheck className="size-4 text-primary" />
          No email is required or promised. Sign in to see the decision.
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="size-4 text-primary" />
          Review times vary; there is no guaranteed deadline.
        </div>
      </div>

      <Button asChild className="mt-6 w-full" size="lg">
        <Link href="/sign-in?next=/registration-status">Go to sign in</Link>
      </Button>
      <Button asChild variant="outline" className="mt-2 w-full">
        <Link href="/">
          <Home className="size-4" /> Back to home
        </Link>
      </Button>
      <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
        Need help? Contact your club administrator or PickleQueue support.
      </p>
    </div>
  );
}
