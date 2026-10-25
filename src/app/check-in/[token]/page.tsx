'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, QrCode, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { me, loading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Checking you in…');
  const started = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!me) {
      router.replace(`/sign-in?next=${encodeURIComponent(`/check-in/${token}`)}`);
      return;
    }
    if (started.current) return;
    started.current = true;
    api
      .post('/api/v1/checkins/qr', { token })
      .then(() => {
        setState('success');
        setMessage('You are checked in. The Queue Master can see you on the board.');
      })
      .catch((error: unknown) => {
        setState('error');
        setMessage(
          error instanceof Error ? error.message : 'This check-in link could not be used.',
        );
      });
  }, [loading, me, router, token]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="PickleQueue home">
          <Logo />
        </Link>
        <Link href="/app" className="text-xs font-semibold text-primary hover:underline">
          Dashboard
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            {state === 'loading' ? (
              <>
                <span className="grid size-14 place-items-center rounded-full bg-lime-soft text-[#4b6b1d]">
                  <Loader2 className="size-7 animate-spin" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold">Checking you in</h1>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              </>
            ) : state === 'success' ? (
              <>
                <span className="grid size-14 place-items-center rounded-full bg-lime-soft text-[#4d711a]">
                  <CheckCircle2 className="size-7" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold">You are checked in</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
                <Button asChild className="mt-5">
                  <Link href="/app/queue" className="inline-flex min-h-6 items-center">
                    Open my queue
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <span className="grid size-14 place-items-center rounded-full bg-[#fbe9e7] text-destructive">
                  <XCircle className="size-7" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold">Check-in unavailable</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
                <Button asChild variant="outline" className="mt-5">
                  <Link href="/app">Go to dashboard</Link>
                </Button>
              </>
            )}
            <div className="mt-6 flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-left text-[0.62rem] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#47671b]" />
              The QR code identifies the session, not the player. You are checked in as{' '}
              <strong className="mx-0.5">{me?.email ?? 'your signed-in account'}</strong>.
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="flex items-center justify-center gap-2 py-5 text-[0.65rem] text-muted-foreground">
        <QrCode className="size-3.5" /> Session check-in · Play · Rotate · Connect
      </footer>
    </div>
  );
}
