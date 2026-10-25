import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export default function NotFound() {
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
          <p className="font-display text-7xl font-extrabold tracking-[-0.06em] text-[#47671b]">
            404
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">
            That court does not exist
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The page may have moved, the public link may be unpublished, or the session was removed.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/app">Open app</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
