'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { ApiError, api, setCsrfToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  clearRegistrationClientState,
  getRegistrationCsrf,
  setRegistrationCsrf,
} from '@/lib/registration-session';
import type { RegistrationStatusView as RegistrationStatusData } from '@/lib/types';

export function RegistrationStatusView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = React.useState(false);
  const statusQuery = useQuery({
    queryKey: ['registration-status'],
    queryFn: () => api.get<RegistrationStatusData>('/api/v1/auth/registration-status'),
    retry: false,
    staleTime: 0,
  });

  React.useEffect(() => {
    if (statusQuery.data?.csrfToken) {
      setRegistrationCsrf(statusQuery.data.csrfToken);
    }
  }, [statusQuery.data?.csrfToken]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      const csrf = getRegistrationCsrf();
      await api.post(
        '/api/v1/auth/registration-logout',
        {},
        { headers: csrf ? { 'x-csrf-token': csrf } : undefined },
      );
    } catch {
      // The local restriction state must be cleared regardless.
    } finally {
      setCsrfToken(null);
      clearRegistrationClientState();
      queryClient.removeQueries({ queryKey: ['registration-status'] });
      router.replace('/sign-in');
    }
  };

  if (statusQuery.isLoading) {
    return (
      <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Checking your registration…</p>
      </div>
    );
  }

  if (statusQuery.error instanceof ApiError && statusQuery.error.status === 401) {
    return (
      <div>
        <IconPanel icon={ShieldCheck} tone="info" />
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Sign in to check your status
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sign in with the account you registered. We will take you to your application status.
        </p>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href="/sign-in?next=/registration-status">Sign in</Link>
        </Button>
        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link href="/sign-up">Create an account</Link>
        </Button>
      </div>
    );
  }

  if (statusQuery.isError || !statusQuery.data) {
    return (
      <div>
        <IconPanel icon={XCircle} tone="danger" />
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Status unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {statusQuery.error instanceof Error
            ? statusQuery.error.message
            : 'Unable to load registration status'}
        </p>
        <Button className="mt-6 w-full" onClick={() => void statusQuery.refetch()}>
          <RefreshCw className="size-4" /> Try again
        </Button>
      </div>
    );
  }

  const status = statusQuery.data.registrationStatus;
  if (status === 'APPROVED' || statusQuery.data.canActivate) {
    return (
      <div>
        <IconPanel icon={CheckCircle2} tone="success" />
        <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
          Approved
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Your account is approved
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Complete the short activation step to choose your player profile and enter PickleQueue.
        </p>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href="/activate">Continue to activation</Link>
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Signed in as {statusQuery.data.email}
        </p>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div>
        <IconPanel icon={XCircle} tone="danger" />
        <div className="mt-4 flex items-center gap-2">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8f3a33]">
            Application not approved
          </p>
          <Badge tone="danger">Rejected</Badge>
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
          Your application was not approved
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {statusQuery.data.publicReason ??
            'An administrator could not approve this application. Contact support if you believe this is a mistake.'}
        </p>
        <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          Reconsideration is handled by an administrator. Contact your club or PickleQueue support
          and include the email address you registered with.
        </div>
        <Button variant="outline" className="mt-5 w-full" onClick={() => void statusQuery.refetch()}>
          <RefreshCw className="size-4" /> Check again
        </Button>
        <Button
          variant="ghost"
          className="mt-2 w-full"
          onClick={() => void signOut()}
          disabled={signingOut}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div>
      <IconPanel icon={Send} tone="lime" />
      <div className="mt-4 flex items-center gap-2">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#47671b]">
          Registration submitted
        </p>
        <Badge tone="warning" dot>
          Pending
        </Badge>
      </div>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
        Your account is waiting for review
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        An administrator will review your registration. You can return here and sign in to check
        your status. No email notification is required.
      </p>
      <div className="mt-5 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Account</span>
          <span className="truncate font-semibold">{statusQuery.data.email}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Submitted</span>
          <span className="font-semibold">
            {statusQuery.data.submittedAt
              ? new Intl.DateTimeFormat(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(statusQuery.data.submittedAt))
              : 'Recently'}
          </span>
        </div>
      </div>
      <Button className="mt-5 w-full" variant="outline" onClick={() => void statusQuery.refetch()}>
        <RefreshCw className="size-4" /> Refresh status
      </Button>
      <Button
        variant="ghost"
        className="mt-2 w-full"
        onClick={() => void signOut()}
        disabled={signingOut}
      >
        Sign out
      </Button>
      <p className="mt-5 text-center text-[0.65rem] leading-relaxed text-muted-foreground">
        <Clock3 className="mr-1 inline size-3" /> Review times vary. There is no guaranteed approval
        deadline.
      </p>
    </div>
  );
}

function IconPanel({
  icon: Icon,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: 'lime' | 'success' | 'danger' | 'info';
}) {
  const classes = {
    lime: 'bg-lime-soft text-[#486b1c]',
    success: 'bg-[#e6f4ea] text-success',
    danger: 'bg-[#fbe9e7] text-destructive',
    info: 'bg-secondary text-primary',
  }[tone];
  return (
    <span className={`grid size-14 place-items-center rounded-2xl ${classes}`}>
      <Icon className="size-7" />
    </span>
  );
}
