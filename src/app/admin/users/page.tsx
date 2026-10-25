'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Search, UserPlus, Users } from 'lucide-react';
import { useAdminUsers } from '@/lib/admin-queries';
import { formatDateTime, relativeTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { AccountStatusBadge, PlatformRoleBadge } from '@/components/admin/status';
import { AdminPagination } from '@/components/admin/pagination';
import type { AccountStatus } from '@/lib/types';

const tabs: Array<{ value?: AccountStatus; label: string }> = [
  { value: undefined, label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'DELETED', label: 'Deleted' },
];

export default function AdminUsersPage() {
  const [status, setStatus] = React.useState<AccountStatus | undefined>();
  const [role, setRole] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [createdFrom, setCreatedFrom] = React.useState('');
  const [createdTo, setCreatedTo] = React.useState('');
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const users = useAdminUsers({
    page,
    limit: 20,
    status,
    platformRole: role || undefined,
    q: query || undefined,
    from: createdFrom ? new Date(`${createdFrom}T00:00:00`).toISOString() : undefined,
    to: createdTo ? new Date(`${createdTo}T23:59:59`).toISOString() : undefined,
    sort: 'createdAt',
    direction: 'desc',
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account administration"
        title="Users"
        description="Search accounts, review their state and use controlled recovery or suspension workflows."
        actions={
          <Button asChild>
            <Link href="/admin/users/new">
              <UserPlus className="size-4" /> Create user
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div
              className="flex gap-1 overflow-x-auto rounded-full border border-border bg-secondary/35 p-1 no-scrollbar"
              role="tablist"
              aria-label="Account status"
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
                    className={`inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-card'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block sm:w-64">
                <span className="sr-only">Search users</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or email"
                  className="pl-10"
                />
              </label>
              <Select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by platform role"
                className="sm:w-44"
              >
                <option value="">All platform roles</option>
                <option value="USER">User</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Created
            </span>
            <Input
              type="date"
              value={createdFrom}
              onChange={(event) => {
                setCreatedFrom(event.target.value);
                setPage(1);
              }}
              aria-label="Created from"
              className="sm:w-40"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={createdTo}
              onChange={(event) => {
                setCreatedTo(event.target.value);
                setPage(1);
              }}
              aria-label="Created to"
              className="sm:w-40"
            />
            {createdFrom || createdTo ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCreatedFrom('');
                  setCreatedTo('');
                  setPage(1);
                }}
              >
                Clear dates
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {users.isLoading ? (
        <PageSkeleton />
      ) : users.isError ? (
        <ErrorState error={users.error} onRetry={() => void users.refetch()} />
      ) : !users.data?.items.length ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="No users found"
          description="Try a different search term or filter."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:block">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-secondary/40 text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Account</th>
                  <th className="px-4 py-3 font-bold">Platform role</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Registration</th>
                  <th className="px-4 py-3 font-bold">Created</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.data.items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/70 last:border-0 hover:bg-secondary/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{user.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PlatformRoleBadge role={user.platformRole} />
                    </td>
                    <td className="px-4 py-3">
                      <AccountStatusBadge status={user.accountStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {user.registrationStatus ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{relativeTime(user.createdAt)}</p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {formatDateTime(user.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${user.id}`}>Manage</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:hidden">
            {users.data.items.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="block rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:bg-secondary/20"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={user.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold">{user.name}</p>
                      <PlatformRoleBadge role={user.platformRole} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <AccountStatusBadge status={user.accountStatus} />
                      {user.registrationStatus ? (
                        <Badge tone="neutral">{user.registrationStatus}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>

          <AdminPagination
            page={users.data.meta.page}
            pages={users.data.meta.totalPages}
            total={users.data.meta.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
