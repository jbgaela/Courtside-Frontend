import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'lime' | 'forest';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-secondary text-secondary-foreground border-transparent',
  success: 'bg-[#e6f4ea] text-[#1b6b44] border-[#cfe7d8]',
  warning: 'bg-[#fbf0d9] text-[#8a5a0b] border-[#f1dfb9]',
  danger: 'bg-[#fbe9e7] text-[#a2322b] border-[#f4d4d0]',
  info: 'bg-[#e8f1f6] text-[#245f7d] border-[#d4e5ee]',
  lime: 'bg-lime-soft text-[#3d5d12] border-[#d9f39b]',
  forest: 'bg-forest text-primary-foreground border-transparent',
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: 'bg-muted-foreground/70',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  lime: 'bg-[#7bbf20]',
  forest: 'bg-lime',
};

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]',
        toneClasses[tone],
        className,
      )}
    >
      {dot ? <span className={cn('size-1.5 rounded-full', dotClasses[tone])} /> : null}
      {children}
    </span>
  );
}

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[#d9f39b] bg-lime-soft px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#3d5d12]',
        className,
      )}
    >
      <span className="live-dot size-1.5 rounded-full bg-[#71b51b]" />
      Live
    </span>
  );
}

export function StatusDot({
  tone = 'neutral',
  className,
}: {
  tone?: BadgeTone;
  className?: string;
}) {
  return <span className={cn('size-2 rounded-full', dotClasses[tone], className)} />;
}
