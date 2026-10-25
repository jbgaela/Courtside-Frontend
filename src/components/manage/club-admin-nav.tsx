'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, CalendarDays, ClipboardList, Settings2, Users, Volleyball } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { suffix: '', label: 'Overview', icon: Building2 },
  { suffix: '/members', label: 'Members', icon: Users },
  { suffix: '/courts', label: 'Courts', icon: Volleyball },
  { suffix: '/settings', label: 'Settings', icon: Settings2 },
  { suffix: '/audit', label: 'Audit', icon: ClipboardList },
];

export function ClubAdminNav({ clubId }: { clubId: string }) {
  const pathname = usePathname();
  const base = `/manage/clubs/${clubId}`;
  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 no-scrollbar"
      aria-label="Club management"
    >
      {links.map((link) => {
        const href = `${base}${link.suffix}`;
        const active = link.suffix === '' ? pathname === base : pathname.startsWith(href);
        const Icon = link.icon;
        return (
          <Link
            key={link.label}
            href={href}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="size-3.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ClubSessionsShortcut({ clubId }: { clubId: string }) {
  return (
    <Link
      href={`/manage/sessions?club=${clubId}`}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
    >
      <CalendarDays className="size-3.5" /> All sessions
    </Link>
  );
}
