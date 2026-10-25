'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ClubSummary } from '@/lib/types';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';

export default function CreateClubPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [joinPolicy, setJoinPolicy] = useState('OPEN');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const club = await api.post<ClubSummary>('/api/v1/clubs', {
        name,
        description: description || undefined,
        location: location || undefined,
        joinPolicy,
      });
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ['clubs'] });
      toast.success('Club created');
      router.replace(`/manage/clubs/${club.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create the club');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/app/discover">
          <ArrowLeft className="size-4" /> Back to discover
        </Link>
      </Button>
      <PageHeader
        eyebrow="Create a club"
        title="Bring your crew to PickleQueue"
        description="You become the club owner. Add courts and sessions next."
      />
      <Card>
        <CardContent className="space-y-5 p-6">
          <form className="space-y-4" onSubmit={(event) => void submit(event)}>
            <Field label="Club name" htmlFor="name">
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Riverside Pickleball Club"
                required
                minLength={2}
                maxLength={80}
              />
            </Field>
            <Field
              label="Description"
              htmlFor="description"
              hint="Optional, but it helps players find you."
            >
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Friendly open play on three courts every Saturday."
                maxLength={600}
              />
            </Field>
            <Field label="Location" htmlFor="location">
              <Input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Riverside Courts, Austin"
                maxLength={120}
              />
            </Field>
            <Field label="Join policy" htmlFor="joinPolicy">
              <Select
                id="joinPolicy"
                value={joinPolicy}
                onChange={(event) => setJoinPolicy(event.target.value)}
              >
                <option value="OPEN">Open — players join instantly</option>
                <option value="APPROVAL">Approval — owner approves requests</option>
                <option value="INVITE_ONLY">Invite only</option>
              </Select>
            </Field>
            <div className="rounded-xl bg-secondary/60 p-3.5 text-xs leading-relaxed text-muted-foreground">
              You will be able to add courts, invite Queue Masters and create sessions after the
              club is created.
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Create club
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
