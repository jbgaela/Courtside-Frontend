'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  ChevronRight,
  Download,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

export default function ManageMorePage() {
  const { me, logout } = useAuth();
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<
    (Event & { prompt?: () => Promise<void> }) | null
  >(null);
  const adminClubs =
    me?.memberships.filter(
      (membership) => membership.role === 'OWNER' || membership.role === 'QUEUE_MASTER',
    ) ?? [];

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as Event & { prompt?: () => Promise<void> });
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const signOut = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="More"
        title="Queue Master tools"
        description="Your clubs, account and installable app."
      />

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={me?.profile?.displayName ?? me?.name ?? 'Queue Master'} size="lg" />
            <div className="min-w-[10rem] flex-1">
              <p className="truncate font-display text-lg font-bold">
                {me?.profile?.displayName ?? me?.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{me?.email}</p>
            </div>
            <Badge tone="lime">Queue Master</Badge>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/app/profile">
                <User className="size-3.5" /> Player profile
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/notifications">
                <Bell className="size-3.5" /> Notifications
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/app">
                <Smartphone className="size-3.5" /> Player view
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => void signOut()}
            >
              <LogOut className="size-3.5" /> Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 font-display text-lg font-bold">Clubs you manage</h2>
        <div className="space-y-2">
          {adminClubs.map((club) => (
            <Link
              key={club.clubId}
              href={`/manage/clubs/${club.clubId}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <Building2 className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{club.clubName}</p>
                <p className="text-[0.62rem] text-muted-foreground">{club.role.toLowerCase()}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Download className="size-4 text-primary" />
            <h2 className="font-display text-base font-bold">Install PickleQueue</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Install the PWA to open the live board full-screen on a tablet. Offline mode is
            read-only — score submission always requires a connection.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={!installPrompt}
            onClick={async () => {
              await installPrompt?.prompt?.();
            }}
          >
            <Download className="size-3.5" />{' '}
            {installPrompt ? 'Install app' : 'Use browser install menu'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-[#47671b]" />
          API v1 · secure http-only sessions
        </div>
        <Link
          href="/public/sessions/s_riverside_saturday"
          target="_blank"
          className="inline-flex min-h-6 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Public demo <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}
