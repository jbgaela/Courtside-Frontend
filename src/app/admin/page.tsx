'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  UserRoundCheck,
  UserX,
  Users,
} from 'lucide-react';
import { useAdminOverview } from '@/lib/admin-queries';
import { formatDateTime, relativeTime } from '@/lib/format';
import { PageHeader, SectionHeading, StatCard } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { RegistrationStatusBadge } from '@/components/admin/status';

export default function AdminOverviewPage() {
  const overview = useAdminOverview();

  if (overview.isLoading) return <PageSkeleton />;
  if (overview.isError) {
    return <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  }
  if (!overview.data) return <PageSkeleton />;
  const { counts, recentPending, recentAudit } = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Dashboard"
        description="Platform overview and the registration decisions waiting for your review."
        actions={
          <Button asChild className="h-auto whitespace-normal py-2.5 text-center">
            <Link href="/admin/registrations?status=PENDING">
              <ClipboardCheck className="size-4" /> Review pending registrations
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending registrations"
          value={counts.pendingRegistrations}
          hint={counts.pendingRegistrations ? 'Requires review' : 'All caught up'}
          icon={<ClipboardCheck className="size-4" />}
          accent={counts.pendingRegistrations > 0}
        />
        <StatCard
          label="Active users"
          value={counts.activeUsers}
          hint="Approved and active"
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Suspended"
          value={counts.suspendedUsers}
          hint="Access paused"
          icon={<UserX className="size-4" />}
        />
        <StatCard
          label="New this week"
          value={counts.newThisWeek}
          hint="Accounts created"
          icon={<UserPlus className="size-4" />}
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.75fr)] lg:items-start">
        <Card className="min-w-0">
          <CardContent className="p-5 sm:p-6">
            <SectionHeading
              title="Recent pending registrations"
              description="New applications waiting for a decision."
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/registrations?status=PENDING">
                    View all <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              }
            />
            {recentPending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/25 px-4 py-10 text-center">
                <CheckCircle2 className="mx-auto size-8 text-success" />
                <p className="mt-3 font-display text-lg font-bold">No pending applications</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  New registrations will appear here for review.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1.5fr)_0.7fr_0.8fr_0.7fr] gap-3 border-b border-border bg-secondary/40 px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:grid">
                  <span>Applicant</span>
                  <span>Skill</span>
                  <span>Submitted</span>
                  <span className="text-right">Action</span>
                </div>
                {recentPending.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="grid gap-3 border-b border-border/70 px-4 py-3.5 last:border-0 sm:grid-cols-[minmax(0,1.5fr)_0.7fr_0.8fr_0.7fr] sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={applicant.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{applicant.name}</p>
                        <p className="truncate text-[0.68rem] text-muted-foreground">
                          {applicant.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="sm:hidden">Skill </span>
                      {applicant.skillRating.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="sm:hidden">Submitted </span>
                      {relativeTime(applicant.submittedAt)}
                    </div>
                    <div className="flex justify-end">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/registrations/${applicant.id}`}>Review</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <SectionHeading
                title="Recent admin activity"
                description="The latest platform actions."
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/admin/audit-logs">Audit logs</Link>
                  </Button>
                }
              />
              {recentAudit.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No administrative activity yet.
                </p>
              ) : (
                <ol className="space-y-3.5">
                  {recentAudit.map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                        <ShieldCheck className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-relaxed">{event.summary}</p>
                        <p className="mt-0.5 text-[0.62rem] text-muted-foreground">
                          {event.actor?.name ?? 'System'} · {relativeTime(event.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-forest text-white">
            <CardContent className="relative p-5 sm:p-6">
              <div className="pickle-pattern absolute inset-0 opacity-30" />
              <div className="relative">
                <span className="grid size-10 place-items-center rounded-xl bg-lime/15 text-lime">
                  <UserRoundCheck className="size-5" />
                </span>
                <h2 className="mt-3 font-display text-xl font-extrabold">
                  Keep access intentional
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-white/55">
                  Review every applicant, preserve club-role isolation and use audited recovery
                  workflows instead of sharing passwords.
                </p>
                <Button
                  asChild
                  variant="accent"
                  size="sm"
                  className="mt-4 h-auto whitespace-normal py-2.5 text-center"
                >
                  <Link href="/admin/users">
                    Open user directory <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <SectionHeading
            title="Registration queue health"
            description="A compact status view of the review workload."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/registrations">All registrations</Link>
              </Button>
            }
          />
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge tone="warning" dot>
              <Clock3 className="size-3" /> Pending {counts.pendingRegistrations}
            </Badge>
            <Badge tone="success" dot>
              Active users {counts.activeUsers}
            </Badge>
            <Badge tone="neutral" dot>
              Suspended {counts.suspendedUsers}
            </Badge>
            <Badge tone="info" dot>
              New this week {counts.newThisWeek}
            </Badge>
            <span className="ml-auto flex items-center gap-1">
              <RefreshCw className="size-3" /> Data refreshes on page actions
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[0.65rem] text-muted-foreground">
            <span>
              Last opened {formatDateTime(new Date().toISOString())}
            </span>
            {recentPending[0] ? (
              <span className="flex items-center gap-1">
                Oldest pending <RegistrationStatusBadge status="PENDING" />{' '}
                {relativeTime(recentPending[0].submittedAt)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
