import * as React from 'react';
import { AlertTriangle, Inbox, Loader2, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-4 animate-spin', className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-secondary/80', className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 rounded-[1.35rem]" />
        <Skeleton className="h-48 rounded-[1.35rem]" />
      </div>
      <Skeleton className="h-64 rounded-[1.35rem]" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-border bg-card/60 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
        {icon ?? <Inbox className="size-5" />}
      </span>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  const offline = message?.toLowerCase().includes('offline');
  return (
    <div
      className={cn('rounded-[1.35rem] border border-[#f0d8d4] bg-[#fdf6f5] p-6', className)}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fbe9e7] text-destructive">
          {offline ? <WifiOff className="size-5" /> : <AlertTriangle className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#7f2a24]">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#8f4a44]">
            {message ?? 'Check your connection and try again.'}
          </p>
          {onRetry ? (
            <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
