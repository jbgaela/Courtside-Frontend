'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  Globe2,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useAdminOverview } from '@/lib/admin-queries';
import { cn } from '@/lib/utils';
import { Logo, PickleballMark } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/avatar';
import { RequireAuth } from '@/components/system/require-auth';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number;
};

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function AdminNavLink({
  item,
  pathname,
  mobile = false,
}: {
  item: NavItem;
  pathname: string;
  mobile?: boolean;
}) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  if (mobile) {
    return (
      <Link
        href={item.href}
        className={cn(
          'relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[0.58rem] font-semibold leading-tight transition-colors',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-current={active ? 'page' : undefined}
      >
        <span
          className={cn(
            'grid h-7 w-10 place-items-center rounded-full',
            active ? 'bg-lime-soft text-primary' : '',
          )}
        >
          <Icon className="size-[1.15rem]" />
        </span>
        <span className="max-w-full truncate">{item.label}</span>
        {item.badge ? (
          <span className="absolute right-[22%] top-1 min-w-4 rounded-full bg-[#b83a32] px-1 text-[0.55rem] font-bold leading-4 text-white">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        ) : null}
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      className={cn(
        'group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
        active ? 'bg-lime text-[#17301d]' : 'text-white/65 hover:bg-white/10 hover:text-white',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'grid size-8 place-items-center rounded-lg',
          active ? 'bg-[#17301d]/10 text-[#17301d]' : 'bg-white/[0.06] text-lime/80',
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span
          className={cn(
            'min-w-5 rounded-full px-1.5 py-0.5 text-center text-[0.62rem] font-bold',
            active ? 'bg-[#17301d] text-lime' : 'bg-lime text-[#17301d]',
          )}
        >
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { me, logout } = useAuth();
  const overview = useAdminOverview();
  const pending = overview.data?.counts.pendingRegistrations ?? 0;

  const nav: NavItem[] = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/registrations', label: 'Registrations', icon: ClipboardCheck, badge: pending },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <RequireAuth requireSuperAdmin>
      <div className="min-h-dvh bg-background">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col bg-forest text-white lg:flex">
          <div className="px-5 pb-6 pt-6">
            <Link href="/admin" aria-label="PickleQueue Super Admin home">
              <Logo tone="light" />
            </Link>
            <div className="mt-5 flex items-center gap-2 rounded-full border border-lime/25 bg-lime/10 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-lime">
              <ShieldCheck className="size-3.5" /> Super Admin
            </div>
          </div>
          <nav className="space-y-1 px-3" aria-label="Super Admin">
            {nav.map((item) => (
              <AdminNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="mt-auto space-y-3 p-4">
            <Link
              href="/"
              className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Globe2 className="size-3.5" /> View public site
            </Link>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-3">
                <Avatar name={me?.name ?? 'Super Admin'} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{me?.name ?? 'Super Admin'}</p>
                  <p className="text-[0.62rem] text-white/70">Platform administrator</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="grid size-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 px-1 text-[0.6rem] text-white/65">
              <PickleballMark className="size-5 opacity-80" />
              PickleQueue platform operations
            </div>
          </div>
        </aside>

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border/70 bg-background/90 px-4 backdrop-blur-xl lg:hidden">
          <Link
            href="/admin"
            aria-label="PickleQueue Super Admin home"
            className="flex min-w-0 items-center gap-2"
          >
            <PickleballMark className="size-8 shrink-0" />
            <span className="truncate font-display text-sm font-extrabold tracking-tight">
              PickleQueue
            </span>
          </Link>
          <Link
            href="/admin/settings"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Admin settings"
          >
            <Avatar name={me?.name ?? 'Super Admin'} size="sm" />
          </Link>
        </header>

        <main className="min-h-dvh pb-24 lg:pl-[17rem] lg:pb-0">
          <div className="mx-auto w-full max-w-[92rem] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
            {children}
          </div>
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
          aria-label="Super Admin primary navigation"
        >
          <div className="grid h-16 grid-cols-5">
            {nav.map((item) => (
              <AdminNavLink key={item.href} item={item} pathname={pathname} mobile />
            ))}
          </div>
        </nav>
      </div>
    </RequireAuth>
  );
}
