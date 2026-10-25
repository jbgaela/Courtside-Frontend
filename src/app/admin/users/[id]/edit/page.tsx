'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { adminQueryKeys, useAdminUser } from '@/lib/admin-queries';
import type { AdminUserDetail } from '@/lib/admin-types';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';

export default function AdminEditUserPage() {
  const params = useParams<{ id: string }>();
  const user = useAdminUser(params.id);

  if (user.isLoading) return <PageSkeleton />;
  if (user.isError) return <ErrorState error={user.error} onRetry={() => void user.refetch()} />;
  if (!user.data) return <PageSkeleton />;
  return <EditUserForm key={user.data.id} user={user.data} />;
}

function EditUserForm({ user }: { user: AdminUserDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState(user.name);
  const [displayName, setDisplayName] = React.useState(user.profile?.displayName ?? user.name);
  const [skillRating, setSkillRating] = React.useState(String(user.profile?.skillRating ?? 3));
  const [bio, setBio] = React.useState(user.profile?.bio ?? '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/api/v1/admin/users/${user.id}`, {
        name,
        displayName,
        skillRating: Number(skillRating),
        bio: bio.trim() || null,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(user.id) }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
      ]);
      toast.success('Account updated');
      router.push(`/admin/users/${user.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update the account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Link
        href={`/admin/users/${user.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to account
      </Link>
      <PageHeader
        eyebrow="Account administration"
        title="Edit account"
        description="Only allowlisted profile fields are editable. Platform roles, passwords, status and secrets are managed by dedicated workflows."
      />
      <Card>
        <CardContent className="p-5 sm:p-6">
          <form className="max-w-2xl space-y-4" onSubmit={(event) => void submit(event)}>
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
            <Field label="Display name" htmlFor="displayName">
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                minLength={1}
                maxLength={50}
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
            <Field label="Bio" htmlFor="bio">
              <Textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={300}
                placeholder="Short player bio"
              />
            </Field>
            {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild type="button" variant="outline">
                <Link href={`/admin/users/${user.id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
