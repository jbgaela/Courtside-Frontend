import {
  SESSION_STATUS_LABELS,
  QUEUE_STATE_LABELS,
  MATCH_STATUS_LABELS,
  type SessionStatus,
} from '@picklequeue/contracts';

export function formatDateTime(iso: string, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(iso));
}

export function formatTime(iso: string, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(iso));
}

export function formatDay(iso: string, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(iso));
}

export function formatShortDay(iso: string, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(iso));
}

export function formatRange(startIso: string, endIso: string, timezone?: string): string {
  return `${formatTime(startIso, timezone)} – ${formatTime(endIso, timezone)}`;
}

export function relativeTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(delta / 60_000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return minutes > 0 ? `${minutes}m ago` : `in ${-minutes}m`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return hours > 0 ? `${hours}h ago` : `in ${-hours}h`;
  const days = Math.round(hours / 24);
  return days > 0 ? `${days}d ago` : `in ${-days}d`;
}

export function sessionLabel(status: string): string {
  return SESSION_STATUS_LABELS[status as SessionStatus] ?? status;
}

export function queueLabel(status: string): string {
  return QUEUE_STATE_LABELS[status as keyof typeof QUEUE_STATE_LABELS] ?? status;
}

export function matchLabel(status: string): string {
  return MATCH_STATUS_LABELS[status as keyof typeof MATCH_STATUS_LABELS] ?? status;
}

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'lime';

export function sessionTone(status: string): Tone {
  switch (status) {
    case 'LIVE':
      return 'lime';
    case 'CHECK_IN_OPEN':
      return 'success';
    case 'SCHEDULED':
      return 'info';
    case 'COMPLETED':
      return 'neutral';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function matchTone(status: string): Tone {
  switch (status) {
    case 'IN_PROGRESS':
      return 'lime';
    case 'READY':
      return 'info';
    case 'COMPLETED':
    case 'CORRECTED':
      return 'neutral';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function queueTone(status: string): Tone {
  switch (status) {
    case 'WAITING':
      return 'info';
    case 'PLAYING':
      return 'lime';
    case 'RESTING':
      return 'warning';
    case 'PAUSED':
      return 'neutral';
    case 'LEFT':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function skillLabel(skill: number): string {
  return skill.toFixed(2).replace(/0$/, '');
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  return `${(parts[0] ?? '').charAt(0)}${(parts[parts.length - 1] ?? '').charAt(0)}`.toUpperCase();
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
