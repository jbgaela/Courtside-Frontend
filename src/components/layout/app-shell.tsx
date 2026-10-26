'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  Building2,
  CalendarDays,
  Compass,
  Home,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  MoreHorizontal,
  Radio,
  ShieldCheck,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth, useIsAdmin } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Logo, PickleballMark } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/system/require-auth';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const playerNav: NavItem[] = [
  { href: '/app', label: 'Home', icon: Home, exact: true },
  { href: '/app/discover', label: 'Discover', icon: Compass },
  { href: '/app/queue', label: 'My Queue', icon: ListOrdered },
  { href: '/app/matches', label: 'Matches', icon: Trophy },
  { href: '/app/profile', label: 'Profile', icon: User },
];

const manageNav: NavItem[] = [
  { href: '/manage', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/manage/sessions', label: 'Sessions', icon: CalendarDays },
  { href: '/manage/live', label: 'Live', icon: Radio },
  { href: '/manage/matches', label: 'Matches', icon: Trophy },
  { href: '/manage/more', label: 'More', icon: MoreHorizontal },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
        active
          ? 'bg-[#eaf3df] text-primary'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'grid size-8 place-items-center rounded-lg transition-colors',
          active ? 'bg-primary text-lime' : 'bg-secondary/70 text-primary/70 group-hover:bg-card',
        )}
      >
        <Icon className="size-4" />
      </span>
      {item.label}
    </Link>
  );
}

export function AppShell({
  children,
  mode = 'player',
}: {
  children: React.ReactNode;
  mode?: 'player' | 'manage';
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { me, logout } = useAuth();
  const isAdmin = useIsAdmin();
  const isSuperAdmin = me?.platformRole === 'SUPER_ADMIN';
  const nav = mode === 'manage' ? manageNav : playerNav;
  const adminClubs = me?.memberships.filter((membership) => membership.canManage) ?? [];

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <RequireAuth requireAdmin={mode === 'manage'}>
      <div className="min-h-dvh bg-background">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17.5rem] flex-col border-r border-border/80 bg-card lg:flex">
          <div className="px-5 pb-5 pt-6">
            <Link
              href={mode === 'manage' ? '/manage' : '/app'}
              aria-label="PickleQueue home"
              className="inline-flex min-h-11 items-center"
            >
              <Logo />
            </Link>
          </div>
          <div className="px-3">
            <p className="mb-2 px-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {mode === 'manage' ? 'Operations' : 'Play'}
            </p>
            <nav className="space-y-1" aria-label={mode === 'manage' ? 'Queue Master' : 'Player'}>
              {nav.map((item) => (
                <SidebarLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          {mode === 'manage' && adminClubs.length > 0 ? (
            <div className="mt-5 px-3">
              <p className="mb-2 px-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                My clubs
              </p>
              <div className="space-y-1">
                {adminClubs.slice(0, 3).map((club) => (
                  <Link
                    key={club.clubId}
                    href={`/manage/clubs/${club.clubId}`}
                    className="flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                  >
                    <Building2 className="size-3.5 shrink-0" />
                    <span className="truncate">{club.clubName}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-auto space-y-4 p-4">
            <div className="overflow-hidden rounded-2xl bg-forest p-4 text-white">
              <div className="flex items-center justify-between">
                <PickleballMark className="size-8" />
                <span className="text-[0.58rem] font-bold uppercase tracking-[0.15em] text-lime">
                  {mode === 'manage' ? 'Run the court' : 'Play more'}
                </span>
              </div>
              <p className="mt-3 font-display text-lg font-bold leading-tight">
                {mode === 'manage' ? 'Fair rotations. Happier players.' : 'Worry less. Play more.'}
              </p>
              <p className="mt-1 text-[0.7rem] leading-relaxed text-white/55">
                {mode === 'manage'
                  ? 'Every match balanced, every player seen.'
                  : 'Your next game is always fair.'}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/80 p-3">
              <Avatar name={me?.profile?.displayName ?? me?.name ?? 'Player'} size="md" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 break-words text-sm font-bold leading-tight">
                  {me?.profile?.displayName ?? me?.name}
                </p>
                <p className="text-[0.65rem] text-muted-foreground">
                  {mode === 'manage'
                    ? (adminClubs[0]?.roleName ??
                      (adminClubs[0]?.role === 'OWNER' ? 'Club owner' : 'Queue Master'))
                    : me?.profile
                      ? `${me.profile.skillRating.toFixed(2)} skill`
                      : 'Player'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
            {isSuperAdmin ? (
              <Button asChild variant="dark" size="sm" className="w-full">
                <Link href="/admin">
                  <ShieldCheck className="size-3.5" /> Super Admin
                </Link>
              </Button>
            ) : null}
            {isAdmin ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={mode === 'manage' ? '/app' : '/manage'}>
                  <ArrowLeftRight className="size-3.5" />
                  {mode === 'manage' ? 'Player view' : 'Manage clubs'}
                </Link>
              </Button>
            ) : null}
          </div>
        </aside>

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl lg:hidden">
          <Link
            href={mode === 'manage' ? '/manage' : '/app'}
            aria-label="PickleQueue home"
            className="inline-flex min-h-11 items-center"
          >
            <Logo compact />
          </Link>
          <div className="flex items-center gap-2">
            {isSuperAdmin ? (
              <Button asChild variant="ghost" size="icon-sm" aria-label="Super Admin">
                <Link href="/admin">
                  <ShieldCheck className="size-4" />
                </Link>
              </Button>
            ) : null}
            {isAdmin ? (
              <Button asChild variant="ghost" size="icon-sm" aria-label="Switch view">
                <Link href={mode === 'manage' ? '/app' : '/manage'}>
                  <ArrowLeftRight className="size-4" />
                </Link>
              </Button>
            ) : null}
            <Link
              href="/app/profile"
              className="grid size-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Profile"
            >
              <Avatar name={me?.profile?.displayName ?? me?.name ?? 'Player'} size="sm" />
            </Link>
          </div>
        </header>

        <main className="min-h-dvh pb-24 lg:pl-[17.5rem] lg:pb-0">
          <div className="mx-auto w-full max-w-[86rem] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
            {children}
          </div>
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
          aria-label="Primary navigation"
        >
          <div className="grid h-16 grid-cols-5">
            {nav.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 text-[0.6rem] font-semibold transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={cn(
                      'grid h-7 w-10 place-items-center rounded-full transition-colors',
                      active ? 'bg-lime-soft text-primary' : '',
                    )}
                  >
                    <Icon className="size-[1.15rem]" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </RequireAuth>
  );
}
