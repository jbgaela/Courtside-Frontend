import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-ui="card"
      className={cn(
        'rounded-[1.35rem] border border-border/90 bg-card text-card-foreground shadow-soft',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-ui="card-header"
      className={cn('flex flex-col gap-2 p-5 pb-3 sm:p-6 sm:pb-3', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-ui="card-title"
      className={cn('text-base font-bold tracking-tight sm:text-lg', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-ui="card-description"
      className={cn('text-sm leading-relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-ui="card-content" className={cn('p-5 sm:p-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-ui="card-footer"
      className={cn('flex items-center gap-3 p-5 sm:p-6', className)}
      {...props}
    />
  );
}
