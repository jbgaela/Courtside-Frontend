'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-forest px-4 py-2 text-center text-xs font-semibold text-lime safe-top"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="size-3.5" />
      You are offline. Showing last-seen data; changes are disabled.
    </div>
  );
}

export function ConnectionPill({
  status,
  className,
}: {
  status: 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error';
  className?: string;
}) {
  const map = {
    live: { label: 'Live', color: 'bg-[#71b51b]' },
    connecting: { label: 'Connecting', color: 'bg-[#d8a12c]' },
    reconnecting: { label: 'Reconnecting', color: 'bg-[#d8a12c]' },
    offline: { label: 'Offline', color: 'bg-[#b8b8b0]' },
    error: { label: 'Updates paused', color: 'bg-destructive' },
  } as const;
  const entry = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground ${className ?? ''}`}
    >
      <span
        className={`size-1.5 rounded-full ${entry.color} ${status === 'live' ? 'live-dot' : ''}`}
      />
      {entry.label}
    </span>
  );
}
