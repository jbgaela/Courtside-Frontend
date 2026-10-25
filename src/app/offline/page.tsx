import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <Link href="/" className="text-xs font-semibold text-primary">
          Home
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="max-w-md text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-secondary text-primary">
            <WifiOff className="size-7" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.04em]">
            You are offline
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            PickleQueue is a live operations app. Cached pages are read-only, and the latest queue
            or score may be out of date. Reconnect before checking in, rotating courts or submitting
            a score.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/app">Open last app shell</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          </div>
          <p className="mt-5 text-[0.65rem] text-muted-foreground">
            Scores are never queued offline. This avoids duplicate or conflicting points.
          </p>
        </div>
      </main>
    </div>
  );
}
