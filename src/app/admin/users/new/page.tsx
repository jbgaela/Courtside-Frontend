'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Copy, KeyRound, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { adminQueryKeys } from '@/lib/admin-queries';
import type { AdminClaimResult } from '@/lib/admin-types';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminCreateUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [skillRating, setSkillRating] = React.useState('3');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AdminClaimResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  const claimUrl = result
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${result.claimPath}`
    : '';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await api.post<AdminClaimResult>('/api/v1/admin/users', {
        name,
        email,
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        skillRating: Number(skillRating),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setResult(response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
      ]);
      toast.success('Account created. Share the one-time claim link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the account');
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success('Claim link copied');
    } catch {
      toast.error('Copy failed. Select and copy the link manually.');
    }
  };

  return (
    <div className="space-y-5">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to users
      </Link>
      <PageHeader
        eyebrow="Account administration"
        title="Create user"
        description="Create an approved account without a permanent default password. The recipient claims it with a one-time link."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <form className="space-y-4" onSubmit={(event) => void submit(event)}>
              <Field label="Full name" htmlFor="name">
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Jamie Rivera"
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="person@example.com"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name (optional)" htmlFor="displayName">
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    maxLength={50}
                    placeholder="Jamie R."
                  />
                </Field>
                <Field label="Skill level" htmlFor="skill">
                  <Select
                    id="skill"
                    value={skillRating}
                    onChange={(event) => setSkillRating(event.target.value)}
                  >
                    <option value="1.5">Beginner</option>
                    <option value="2.5">Lower intermediate</option>
                    <option value="3">Intermediate</option>
                    <option value="3.75">Upper intermediate</option>
                    <option value="4.5">Advanced</option>
                    <option value="5.5">Competitive</option>
                  </Select>
                </Field>
              </div>
              <Field label="Internal note (optional)" htmlFor="note">
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={1000}
                  placeholder="How was this account requested and verified?"
                />
              </Field>
              <div className="rounded-xl border border-[#d9edb2] bg-lime-soft/50 p-3 text-xs leading-relaxed text-[#3f5c16]">
                <KeyRound className="mr-1 inline size-3.5" />
                No email is sent. The account remains awaiting activation until the recipient redeems
                a one-time claim link.
              </div>
              {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button asChild type="button" variant="outline">
                  <Link href="/admin/users">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  Create account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="p-5 sm:p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-forest text-lime">
              <KeyRound className="size-5" />
            </span>
            <h2 className="mt-3 font-display text-xl font-bold">One-time claim</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Verify the recipient&apos;s identity out of band before sharing the claim link. The
              credential is stored hashed, displayed once and expires automatically.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              The recipient sets their own password. Email ownership is not assumed or marked
              verified.
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-[0.65rem] leading-relaxed text-muted-foreground">
              Do not send claim links over unapproved public channels. If a link is lost, generate a
              fresh one from the account detail page after reauthentication.
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(result)} onOpenChange={() => undefined}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account created</DialogTitle>
            <DialogDescription>
              {result?.user.name} can now activate their account with this one-time link. It is not
              shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <p className="break-all text-xs font-medium">{claimUrl}</p>
            <p className="mt-2 text-[0.65rem] text-muted-foreground">
              Expires {result ? new Date(result.claimExpiresAt).toLocaleString() : ''}
            </p>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void copy()}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied' : 'Copy claim link'}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => router.push('/admin/users')}>
              All users
            </Button>
            <Button
              onClick={() => {
                if (result) router.push(`/admin/users/${result.user.id}`);
              }}
            >
              Open account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
