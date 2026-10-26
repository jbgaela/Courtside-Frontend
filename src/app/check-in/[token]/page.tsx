'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  QrCode,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useGuestStatus } from '@/lib/queries';
import { formatRange, formatShortDay } from '@/lib/format';
import type { GuestStatus, PublicCheckIn } from '@/lib/types';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GuestJoinForm, GuestStatusPanel } from '@/components/check-in/guest-view';
import { SessionStatusBadge } from '@/components/session/status';

export default function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { me, loading } = useAuth();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<PublicCheckIn | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'preview' | 'checking' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('Loading this session…');
  const [joinOpen, setJoinOpen] = useState(false);
  const [leavingGuest, setLeavingGuest] = useState(false);
  const guestStatus = useGuestStatus(token, !loading && !me);
  const started = useRef(false);

  useEffect(() => {
    let active = true;
    void api
      .get<PublicCheckIn>(`/api/v1/public/checkins/${encodeURIComponent(token)}`)
      .then((data) => {
        if (!active) return;
        setPreview(data);
        setState('preview');
        setMessage(
          data.join.availability === 'OPEN'
            ? 'Sign in to check in to this session.'
            : (data.join.reason ?? 'Check-in is not open for this session.'),
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPreviewError(
          error instanceof Error ? error.message : 'This check-in link could not be used.',
        );
        setState('error');
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (loading || state !== 'preview' || !preview) return;
    if (!me) return;
    if (!preview.join.canCheckIn) return;
    if (started.current) return;
    started.current = true;
    setState('checking');
    setMessage('Checking you in…');
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
  }, [loading, me, preview, state, token]);

  const next = `/check-in/${encodeURIComponent(token)}`;
  const session = preview?.session;
  const showGuest = !me && Boolean(guestStatus.data);

  const handleGuestJoined = (status: GuestStatus) => {
    queryClient.setQueryData(['guest-status', token], status);
    setJoinOpen(false);
    toast.success('You joined the session');
  };

  const handleGuestDuplicate = () => {
    toast.info('Checking your existing guest status…');
    void guestStatus.refetch();
  };

  const leaveGuest = async () => {
    setLeavingGuest(true);
    try {
      await api.post(`/api/v1/public/checkins/${encodeURIComponent(token)}/guest/leave`, {});
      await guestStatus.refetch();
      toast.success('You left the session');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not leave the session');
    } finally {
      setLeavingGuest(false);
    }
  };

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
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 sm:p-8">
            {showGuest && guestStatus.data ? (
              <GuestStatusPanel
                status={guestStatus.data}
                onRefresh={() => void guestStatus.refetch()}
                onLeave={() => void leaveGuest()}
                leaving={leavingGuest}
              />
            ) : state === 'loading' ? (
              <div className="flex flex-col items-center text-center">
                <span className="grid size-14 place-items-center rounded-full bg-lime-soft text-[#4b6b1d]">
                  <Loader2 className="size-7 animate-spin" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold">Loading session</h1>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              </div>
            ) : state === 'success' ? (
              <div className="flex flex-col items-center text-center">
                <span className="grid size-14 place-items-center rounded-full bg-lime-soft text-[#4d711a]">
                  <CheckCircle2 className="size-7" />
                </span>
                <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#47671b]">
                  {preview?.club.name ?? 'PickleQueue'}
                </p>
                <h1 className="mt-2 font-display text-2xl font-extrabold">You are checked in</h1>
                {session ? (
                  <p className="mt-1 text-sm font-semibold">{session.name}</p>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
                <Button asChild className="mt-5 w-full">
                  <Link href="/app/queue">Open my queue</Link>
                </Button>
              </div>
            ) : state === 'error' && !preview ? (
              <div className="flex flex-col items-center text-center">
                <span className="grid size-14 place-items-center rounded-full bg-[#fbe9e7] text-destructive">
                  <XCircle className="size-7" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold">Check-in unavailable</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {previewError ?? message}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Ask the Queue Master for a fresh QR code, or open your dashboard to find the
                  session.
                </p>
                <Button asChild variant="outline" className="mt-5 w-full">
                  <Link href="/app">Go to dashboard</Link>
                </Button>
              </div>
            ) : preview && session ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <SessionStatusBadge status={session.status} />
                  <Badge tone="neutral">{session.format === 'DOUBLES' ? 'Doubles' : 'Singles'}</Badge>
                  {preview.join.availability === 'FULL' ? (
                    <Badge tone="warning">Full</Badge>
                  ) : null}
                  {preview.join.availability === 'CLOSED' ? (
                    <Badge tone="neutral">Closed</Badge>
                  ) : null}
                </div>
                <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#47671b]">
                  {preview.club.name}
                </p>
                <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.03em]">
                  {session.name}
                </h1>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 shrink-0" />
                    {formatShortDay(session.startsAt, session.timezone)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="size-4 shrink-0" />
                    {formatRange(session.startsAt, session.endsAt, session.timezone)}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0" />
                    {session.venue ?? preview.club.location ?? 'Venue shown on arrival'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="size-4 shrink-0" />
                    {session.checkedIn} checked in · {session.capacity} capacity
                    {session.waiting > 0 ? ` · ${session.waiting} waiting` : ''}
                  </p>
                </div>

                {me ? (
                  <div className="mt-5">
                    {state === 'checking' ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary/60 px-4 py-4 text-sm font-semibold">
                        <Loader2 className="size-4 animate-spin" /> {message}
                      </div>
                    ) : state === 'error' ? (
                      <div className="rounded-xl border border-[#f4d4d0] bg-[#fbe9e7] p-3.5 text-sm text-destructive">
                        {message}
                      </div>
                    ) : null}
                    {state === 'error' ? (
                      <Button asChild variant="outline" className="mt-3 w-full">
                        <Link href="/app">Go to dashboard</Link>
                      </Button>
                    ) : null}
                    {state === 'preview' && !preview.join.canCheckIn ? (
                      <div className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] p-3.5 text-sm text-[#8a5a0b]">
                        {preview.join.reason ?? 'Check-in is not open for this session.'}
                        <Button asChild variant="ghost" size="sm" className="mt-2 px-0">
                          <Link href="/app/queue">Open my queue</Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 space-y-2">
                    {preview.join.canCheckIn ? (
                      <>
                        <Button asChild className="w-full" size="lg">
                          <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>
                            <ShieldCheck className="size-4" /> Sign in to check in
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full" size="lg">
                          <Link href={`/sign-up?next=${encodeURIComponent(next)}`}>
                            <UserPlus className="size-4" /> Create an account
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="rounded-xl border border-[#f1dfb9] bg-[#fbf0d9] p-3.5 text-sm text-[#8a5a0b]">
                          {preview.join.reason ??
                            'New check-ins are not open, but you can sign in to view your registration.'}
                        </div>
                        <Button asChild variant="outline" className="w-full" size="lg">
                          <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>
                            <ShieldCheck className="size-4" /> Sign in to view my status
                          </Link>
                        </Button>
                      </>
                    )}
                    {preview.join.canCheckIn && preview.join.canGuestJoin ? (
                      joinOpen ? (
                        <div className="border-t border-border/70 pt-4">
                          <GuestJoinForm
                            token={token}
                            onJoined={handleGuestJoined}
                            onDuplicate={handleGuestDuplicate}
                          />
                        </div>
                      ) : (
                        <div className="border-t border-border/70 pt-3">
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            size="lg"
                            onClick={() => setJoinOpen(true)}
                          >
                            <UserPlus className="size-4" /> Join as a guest
                          </Button>
                          <p className="mt-1.5 text-center text-[0.65rem] text-muted-foreground">
                            No account, email or password needed.
                          </p>
                        </div>
                      )
                    ) : null}
                  </div>
                )}

                <div className="mt-5 flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-left text-[0.65rem] leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#47671b]" />
                  The QR code identifies the session, not the player. Scanning alone never claims
                  another person&apos;s spot.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <span className="grid size-14 place-items-center rounded-full bg-[#fbe9e7] text-destructive">
                  <XCircle className="size-7" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold">Check-in unavailable</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
                <Button asChild variant="outline" className="mt-5 w-full">
                  <Link href="/app">Go to dashboard</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="flex items-center justify-center gap-2 py-5 text-[0.65rem] text-muted-foreground">
        <QrCode className="size-3.5" /> Session check-in · Play · Rotate · Connect
      </footer>
    </div>
  );
}
