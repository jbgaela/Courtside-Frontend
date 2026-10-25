'use client';

import * as React from 'react';
import { Search, ScrollText } from 'lucide-react';
import { useAdminAudit } from '@/lib/admin-queries';
import { formatDateTime, relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { AdminPagination } from '@/components/admin/pagination';

const outcomes = ['', 'SUCCESS', 'DENIED', 'FAILED'] as const;

export default function AdminAuditLogsPage() {
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const audit = useAdminAudit({
    page,
    limit: 30,
    q: query || undefined,
    outcome: outcome || undefined,
  });

  const items = audit.data?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Platform security"
        title="Audit logs"
        description="Registration, account lifecycle and administrative actions with requester context."
      />
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-sm">
              <span className="sr-only">Search audit logs</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search action, actor or target"
                className="pl-10"
              />
            </label>
            <Select
              value={outcome}
              onChange={(event) => {
                setOutcome(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by outcome"
              className="sm:w-44"
            >
              {outcomes.map((value) => (
                <option key={value || 'all'} value={value}>
                  {value ? value.charAt(0) + value.slice(1).toLowerCase() : 'All outcomes'}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {audit.isLoading ? (
        <PageSkeleton />
      ) : audit.isError ? (
        <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="size-5" />}
          title="No audit events"
          description="Administrative actions and account lifecycle events will appear here."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:block">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-secondary/40 text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">When</th>
                  <th className="px-4 py-3 font-bold">Action</th>
                  <th className="px-4 py-3 font-bold">Actor</th>
                  <th className="px-4 py-3 font-bold">Target</th>
                  <th className="px-4 py-3 font-bold">Outcome</th>
                  <th className="px-4 py-3 font-bold">Request</th>
                </tr>
              </thead>
              <tbody>
                {items.map((event) => (
                  <tr key={event.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium">{relativeTime(event.createdAt)}</p>
                      <p className="text-[0.63rem] text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold">{event.action}</p>
                      <p className="max-w-xs truncate text-[0.65rem] text-muted-foreground">
                        {event.summary}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">{event.actor?.name ?? 'System'}</td>
                    <td className="px-4 py-3 text-xs">{event.target?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          event.outcome === 'SUCCESS'
                            ? 'success'
                            : event.outcome === 'DENIED'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {event.outcome}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[0.6rem] text-muted-foreground">
                      {event.requestId ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:hidden">
            {items.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{event.action}</p>
                    <p className="mt-1 text-[0.68rem] leading-relaxed text-muted-foreground">
                      {event.summary}
                    </p>
                  </div>
                  <Badge
                    tone={
                      event.outcome === 'SUCCESS'
                        ? 'success'
                        : event.outcome === 'DENIED'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {event.outcome}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] text-muted-foreground">
                  <span>{event.actor?.name ?? 'System'}</span>
                  <span>→ {event.target?.name ?? 'platform'}</span>
                  <span>{relativeTime(event.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          <AdminPagination
            page={audit.data?.meta.page ?? page}
            pages={audit.data?.meta.totalPages ?? 1}
            total={audit.data?.meta.total ?? items.length}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
