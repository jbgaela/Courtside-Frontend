'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, MailPlus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function AcceptInvitation({ token }: { token?: string }) {
  const { me, refresh } = useAuth();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);

  const accept = async () => {
    if (!token) return;
    setState('loading');
    setError(null);
    try {
      const result = await api.post<{ membershipId: string; clubId: string; role: string }>(
        '/api/v1/clubs/invitations/accept',
        { token },
      );
      setClubId(result.clubId);
      await refresh();
      setState('done');
      toast.success('Invitation accepted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept the invitation');
      setState('error');
    }
  };

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          {state === 'done' ? (
            <>
              <span className="grid size-14 place-items-center rounded-full bg-lime-soft text-[#4d711a]">
                <CheckCircle2 className="size-7" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-extrabold">You are in</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The club is now in your account. Sessions and the queue are ready.
              </p>
              <div className="mt-5 flex gap-2">
                <Button asChild>
                  <Link href="/app">Go to dashboard</Link>
                </Button>
                {clubId ? (
                  <Button asChild variant="outline">
                    <Link href={`/app/clubs/${clubId}`}>Open club</Link>
                  </Button>
                ) : null}
              </div>
            </>
          ) : state === 'error' ? (
            <>
              <span className="grid size-14 place-items-center rounded-full bg-[#fbe9e7] text-destructive">
                <XCircle className="size-7" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-extrabold">Invitation not accepted</h1>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Button className="mt-5" asChild>
                <Link href="/app/discover">Back to clubs</Link>
              </Button>
            </>
          ) : (
            <>
              <span className="grid size-14 place-items-center rounded-full bg-lime-soft text-[#4b6b1d]">
                <MailPlus className="size-7" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-extrabold">You are invited</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This invitation is for <strong>{me?.email}</strong>. The email on your account must
                match the invitation.
              </p>
              {!token ? (
                <p className="mt-3 rounded-xl bg-[#fdf6f5] px-3 py-2 text-xs text-destructive">
                  This link is missing its invitation token.
                </p>
              ) : null}
              <Button
                className="mt-5"
                onClick={() => void accept()}
                disabled={!token || state === 'loading'}
              >
                {state === 'loading' ? <Loader2 className="size-4 animate-spin" /> : null}
                Accept invitation
              </Button>
              <p className="mt-3 text-[0.65rem] text-muted-foreground">
                This is a demo link created by a Queue Master. In production it arrives by email.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
