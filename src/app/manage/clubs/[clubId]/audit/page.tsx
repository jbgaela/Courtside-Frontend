'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, ShieldCheck } from 'lucide-react';
import { useAudit, useClub } from '@/lib/queries';
import { formatDateTime, relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { ClubAdminNav } from '@/components/manage/club-admin-nav';

export default function ClubAuditPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const club = useClub(clubId);
  const audit = useAudit(clubId);

  if (club.isLoading || audit.isLoading) return <PageSkeleton />;
  if (club.isError || !club.data) {
    return (
      <ErrorState title="Club unavailable" error={club.error} onRetry={() => void club.refetch()} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/manage/clubs/${clubId}`}>
            <ArrowLeft className="size-4" /> {club.data.name}
          </Link>
        </Button>
        <Badge tone="neutral">{club.data.viewerRole}</Badge>
      </div>
      <PageHeader
        eyebrow="Audit"
        title="Club history"
        description="Privileged actions, overrides and configuration changes."
        actions={
          <Badge tone="neutral">
            <ShieldCheck className="mr-1 size-3.5" /> Immutable log
          </Badge>
        }
      />
      <ClubAdminNav clubId={clubId} />

      {audit.isError ? (
        <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
      ) : audit.data && audit.data.length > 0 ? (
        <Card>
          <CardContent className="p-5">
            <div className="relative space-y-1 before:absolute before:bottom-3 before:left-[1.1rem] before:top-3 before:w-px before:bg-border">
              {audit.data.map((event) => (
                <div key={event.id} className="relative flex gap-3 rounded-xl px-1 py-2.5">
                  <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-primary">
                    <ClipboardList className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{event.summary}</p>
                      <Badge tone="neutral">{event.action}</Badge>
                    </div>
                    <p className="mt-0.5 text-[0.62rem] text-muted-foreground">
                      {formatDateTime(event.createdAt)} · {relativeTime(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No audit events yet"
          description="Privileged actions will appear here."
          icon={<ClipboardList className="size-5" />}
        />
      )}
    </div>
  );
}
