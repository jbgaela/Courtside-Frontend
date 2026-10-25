'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  LogOut,
  MailCheck,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useStats } from '@/lib/queries';
import { skillLabel } from '@/lib/format';
import { PageHeader, StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Field, Input, Textarea } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/feedback';

export default function ProfilePage() {
  const { me, refresh, logout } = useAuth();
  const router = useRouter();
  const stats = useStats();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [skill, setSkill] = useState('3');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(me.name);
    setDisplayName(me.profile?.displayName ?? me.name);
    setSkill(String(me.profile?.skillRating ?? 3));
    setBio(me.profile?.bio ?? '');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [me]);

  if (!me) return <PageSkeleton />;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.patch('/api/v1/users/me/profile', {
        name: name.trim(),
        displayName: displayName.trim(),
        skillRating: Number(skill),
        bio: bio.trim() || null,
      });
      await refresh();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update your profile');
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Your player card"
        description="Keep your skill and display name current so rotations stay fair."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/app/notifications">
              <Bell className="size-4" /> Notifications
            </Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
        <div className="relative bg-forest px-5 py-6 text-white sm:px-7">
          <div className="pickle-pattern absolute inset-0 opacity-30" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={displayName || name} size="xl" color="#c9f56a" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="lime">Player</Badge>
                  {me.emailVerified ? (
                    <Badge tone="success" dot>
                      Verified email
                    </Badge>
                  ) : (
                    <Badge tone="warning">Email unverified</Badge>
                  )}
                </div>
                <h1 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.04em]">
                  {displayName || me.name}
                </h1>
                <p className="mt-1 text-xs text-white/55">{me.email}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-center">
              <p className="font-display text-3xl font-extrabold text-lime">
                {skillLabel(me.profile?.skillRating ?? 3)}
              </p>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/45">
                Skill rating
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-7">
          <StatCard
            label="Games played"
            value={stats.data?.matchesPlayed ?? 0}
            icon={<Trophy className="size-4" />}
          />
          <StatCard
            label="Win rate"
            value={`${stats.data?.winRate ?? 0}%`}
            icon={<Sparkles className="size-4" />}
            accent
          />
          <StatCard
            label="Clubs"
            value={me.memberships.length}
            icon={<ShieldCheck className="size-4" />}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Profile details</h2>
              <Badge tone="neutral">Visible to club members</Badge>
            </div>
            <form className="mt-4 space-y-4" onSubmit={(event) => void save(event)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name">
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </Field>
                <Field
                  label="Display name"
                  htmlFor="displayName"
                  hint="Used on queue and scoreboards."
                >
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                    maxLength={50}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-[0.4fr_0.6fr]">
                <Field label="Skill rating" htmlFor="skill" hint="1.00 – 7.00">
                  <Input
                    id="skill"
                    type="number"
                    min={1}
                    max={7}
                    step={0.25}
                    value={skill}
                    onChange={(event) => setSkill(event.target.value)}
                    required
                  />
                </Field>
                <Field label="Bio" htmlFor="bio" hint="Optional. Keep it short.">
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    maxLength={300}
                    className="min-h-[74px]"
                    placeholder="Left-handed, loves the kitchen line."
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
                <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
                  Skill changes are recorded in your rating history.
                </p>
                <Button type="submit" disabled={saving}>
                  <Save className="size-4" /> {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-base font-bold">Clubs</h2>
              <div className="mt-3 space-y-2">
                {me.memberships.length > 0 ? (
                  me.memberships.map((club) => (
                    <Link
                      key={club.clubId}
                      href={`/app/clubs/${club.clubSlug}`}
                      className="flex items-center justify-between rounded-xl border border-border/80 px-3 py-2.5 hover:bg-secondary/50"
                    >
                      <div>
                        <p className="text-xs font-bold">{club.clubName}</p>
                        <p className="text-[0.6rem] text-muted-foreground">{club.role}</p>
                      </div>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">You have not joined a club yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-base font-bold">Account</h2>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2.5">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <MailCheck className="size-3.5" /> Email
                  </span>
                  <span className="font-semibold">
                    {me.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2.5">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Settings className="size-3.5" /> Member since
                  </span>
                  <span className="font-semibold">
                    {new Date(me.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {!me.emailVerified ? (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/verify-email">Verify email</Link>
                  </Button>
                ) : null}
                {me.memberships.some((club) => club.role !== 'PLAYER') ? (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/manage">
                      <ShieldCheck className="size-3.5" /> Queue Master view
                    </Link>
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive"
                  onClick={() => void signOut()}
                >
                  <LogOut className="size-3.5" /> Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-[1.35rem] border border-[#d9edb2] bg-lime-soft/60 p-5">
            <CheckCircle2 className="size-5 text-[#486b1c]" />
            <p className="mt-2 font-display text-base font-bold text-[#385513]">
              Fairness starts with you
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#3e5716]">
              An accurate skill rating helps the engine build competitive matches without leaving
              anyone out.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
