'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Search } from 'lucide-react';
import { useAdminRegistrations } from '@/lib/admin-queries';
import { formatDateTime, relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { RegistrationStatusBadge } from '@/components/admin/status';
import { AdminPagination } from '@/components/admin/pagination';
import type { RegistrationStatus } from '@/lib/types';

const tabs: Array<{ value?: RegistrationStatus; label: string }> = [
  { value: undefined, label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminRegistrationsPage() {
  const [status, setStatus] = React.useState<RegistrationStatus | undefined>('PENDING');
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const registrations = useAdminRegistrations({ page, limit: 20, status, q: query || undefined });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Access control"
        title="Registrations"
        description="Review new account applications and make a clear, auditable decision."
        actions={
          <Badge tone="warning" dot>
            {registrations.data?.meta.counts.pending ?? '—'} pending
          </Badge>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex gap-1 overflow-x-auto rounded-full border border-border bg-secondary/35 p-1 no-scrollbar"
              role="tablist"
              aria-label="Registration status"
            >
              {tabs.map((tab) => {
                const active = status === tab.value;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setStatus(tab.value);
                      setPage(1);
                    }}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-card'
                    }`}
                  >
                    {tab.label}
                    {tab.value ? (
                      <span className={active ? 'text-white/60' : 'text-muted-foreground/70'}>
                        {registrations.data?.meta.counts[
                          tab.value.toLowerCase() as 'pending' | 'approved' | 'rejected'
                        ] ?? 0}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <label className="relative block w-full lg:max-w-xs">
              <span className="sr-only">Search registrations</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email"
                className="pl-10"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {registrations.isLoading ? (
        <PageSkeleton />
      ) : registrations.isError ? (
        <ErrorState error={registrations.error} onRetry={() => void registrations.refetch()} />
      ) : !registrations.data?.items.length ? (
        <EmptyState
          icon={<ClipboardCheck className="size-5" />}
          title={status === 'PENDING' ? 'No pending registrations' : 'No registrations found'}
          description={
            status === 'PENDING'
              ? 'New account applications will appear here for review.'
              : 'Try another status or search term.'
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:block">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-secondary/40 text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Applicant</th>
                  <th className="px-4 py-3 font-bold">Skill</th>
                  <th className="px-4 py-3 font-bold">Submitted</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.data.items.map((registration) => (
                  <tr
                    key={registration.id}
                    className="border-b border-border/70 last:border-0 hover:bg-secondary/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={registration.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{registration.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {registration.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {registration.skillRating.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">
                        {relativeTime(registration.submittedAt)}
                      </p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {formatDateTime(registration.submittedAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <RegistrationStatusBadge status={registration.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/registrations/${registration.id}`}>
                          {registration.status === 'PENDING' ? 'Review' : 'View'}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:hidden">
            {registrations.data.items.map((registration) => (
              <Link
                key={registration.id}
                href={`/admin/registrations/${registration.id}`}
                className="block rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:bg-secondary/20"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={registration.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold">{registration.name}</p>
                      <RegistrationStatusBadge status={registration.status} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{registration.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.68rem] text-muted-foreground">
                      <span>Skill {registration.skillRating.toFixed(2)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDateTime(registration.submittedAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>

          <AdminPagination
            page={registrations.data.meta.page}
            pages={registrations.data.meta.totalPages}
            total={registrations.data.meta.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
