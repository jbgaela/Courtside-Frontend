'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'default',
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
  className?: string;
  size?: 'sm' | 'default';
}) {
  return (
    <div
      data-ui="segmented"
      className="w-full min-w-0 max-w-full overflow-x-auto no-scrollbar sm:w-auto"
    >
      <div
        data-ui="segmented-list"
        role="tablist"
        className={cn(
          'flex w-max min-w-full items-center gap-1 rounded-full border border-border/80 bg-secondary/70 p-1 sm:min-w-0 sm:w-auto',
          className,
        )}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full font-semibold transition-all max-sm:min-h-11 sm:flex-none',
                size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-3 text-sm sm:px-4',
                active
                  ? 'bg-card text-primary shadow-[0_2px_8px_rgba(16,36,27,0.08)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
              {typeof option.count === 'number' ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold tabular',
                    active ? 'bg-secondary text-secondary-foreground' : 'bg-card/60',
                  )}
                >
                  {option.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
