'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-5 py-10">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#fbe9e7] text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Something broke on this page</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {error.message || 'An unexpected error occurred. The data is safe; retry the view.'}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/app">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
