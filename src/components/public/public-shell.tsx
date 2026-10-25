import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export function PublicHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link
          href="/"
          aria-label="PickleQueue home"
          className="inline-flex min-h-11 min-w-0 items-center"
        >
          <Logo compact={compact} />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:inline-flex">
            <Eye className="size-3.5" /> Spectator view
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/sign-up">Run your club</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:px-8">
        <Logo compact />
        <p>Live scores are read-only. No account required.</p>
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex min-h-6 items-center hover:text-foreground">
            Home
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex min-h-6 items-center font-semibold text-primary hover:underline"
          >
            Create your club
          </Link>
        </div>
      </div>
    </footer>
  );
}
