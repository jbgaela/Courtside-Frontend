'use client';

import * as React from 'react';
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, api } from '@/lib/api';
import {
  adminQueryKeys,
  useAdminPermissionMatrix,
  useAdminRoles,
} from '@/lib/admin-queries';
import type { AdminRoleSummary } from '@/lib/admin-types';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/feedback';
import { RoleEditor, roleIcon } from '@/components/admin/role-editor';
import { AdminReauthDialog } from '@/components/admin/reauth-dialog';

type Tab = 'roles' | 'matrix';

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = React.useState<Tab>('roles');
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [editor, setEditor] = React.useState<string | 'new' | null>(null);
  const [deleting, setDeleting] = React.useState<AdminRoleSummary | null>(null);
  const [working, setWorking] = React.useState<string | null>(null);
  const [reauthOpen, setReauthOpen] = React.useState(false);
  const pendingAction = React.useRef<null | (() => Promise<void>)>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const roles = useAdminRoles({ q: query || undefined });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'permission-matrix'] }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
    ]);
  };

  const runWithReauth = async (key: string, action: () => Promise<void>) => {
    setWorking(key);
    try {
      await action();
      await refresh();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        error.message.toLowerCase().includes('confirm your password')
      ) {
        pendingAction.current = action;
        setReauthOpen(true);
        return;
      }
      toast.error(error instanceof Error ? error.message : 'The action could not be completed');
    } finally {
      setWorking(null);
    }
  };

  const duplicate = (role: AdminRoleSummary) => {
    void runWithReauth(`duplicate-${role.id}`, async () => {
      await api.post(`/api/v1/admin/roles/${role.id}/duplicate`, {});
      toast.success(`Duplicated ${role.name}. Edit the copy to customize it.`);
    });
  };

  const remove = () => {
    if (!deleting) return;
    const role = deleting;
    void runWithReauth(`delete-${role.id}`, async () => {
      await api.delete(`/api/v1/admin/roles/${role.id}`);
      toast.success(`${role.name} deleted`);
      setDeleting(null);
    });
  };

  const items = roles.data?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Access control"
        title="Roles & Permissions"
        description="Manage user roles and configure what each role can access and do in the system."
        actions={
          <Button type="button" onClick={() => setEditor('new')}>
            <Plus className="size-4" /> Create role
          </Button>
        }
      />

      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Access control">
        {(
          [
            ['roles', 'Roles'],
            ['matrix', 'Permission Matrix'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              'relative min-h-11 px-3 text-xs font-bold transition-colors sm:px-4',
              tab === value ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
            {tab === value ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'roles' ? (
        <>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative block sm:w-72">
                  <span className="sr-only">Search roles</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search roles…"
                    className="pl-10"
                    aria-label="Search roles"
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  {items.length} role{items.length === 1 ? '' : 's'} · permissions are enforced by
                  the API
                </p>
              </div>
            </CardContent>
          </Card>

          {roles.isLoading ? (
            <PageSkeleton />
          ) : roles.isError ? (
            <ErrorState error={roles.error} onRetry={() => void roles.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="size-5" />}
              title="No roles found"
              description="Try a different search, or create a role for your club team."
              action={
                <Button type="button" onClick={() => setEditor('new')}>
                  <Plus className="size-4" /> Create role
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:block">
                <table className="w-full text-left">
                  <thead className="border-b border-border bg-secondary/40 text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-bold">Role Name</th>
                      <th className="px-4 py-3 font-bold">Description</th>
                      <th className="px-4 py-3 font-bold">Users</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((role) => {
                      const Icon = roleIcon(role.key);
                      return (
                        <tr
                          key={role.id}
                          className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-secondary/20"
                          onClick={() => setEditor(role.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                                <Icon className="size-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold">{role.name}</p>
                                <p className="truncate text-[0.62rem] text-muted-foreground">
                                  {role.key === 'SUPER_ADMIN'
                                    ? 'Platform administration'
                                    : 'Club scope'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[26rem] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                            {role.description ?? 'No description'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">{role.userCount}</td>
                          <td className="px-4 py-3">
                            <Badge tone={role.isProtected ? 'neutral' : 'success'} dot>
                              {role.isProtected ? 'System' : 'Active'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${role.name}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditor(role.id);
                                }}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Duplicate ${role.name}`}
                                disabled={working !== null || role.scope === 'PLATFORM'}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  duplicate(role);
                                }}
                              >
                                {working === `duplicate-${role.id}` ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-destructive"
                                aria-label={`Delete ${role.name}`}
                                disabled={role.isSystem || role.isProtected || working !== null}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDeleting(role);
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:hidden">
                {items.map((role) => {
                  const Icon = roleIcon(role.key);
                  return (
                    <Card key={role.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold">{role.name}</p>
                              <Badge tone={role.isProtected ? 'neutral' : 'success'} dot>
                                {role.isProtected ? 'System' : 'Active'}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {role.description ?? 'No description'}
                            </p>
                            <p className="mt-2 text-[0.65rem] text-muted-foreground">
                              {role.userCount} user{role.userCount === 1 ? '' : 's'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditor(role.id)}
                              >
                                <Pencil className="size-3.5" /> {role.isProtected ? 'View' : 'Edit'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={working !== null || role.scope === 'PLATFORM'}
                                onClick={() => duplicate(role)}
                              >
                                <Copy className="size-3.5" /> Duplicate
                              </Button>
                              {!role.isSystem && !role.isProtected ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => setDeleting(role)}
                                >
                                  <Trash2 className="size-3.5" /> Delete
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      ) : (
        <PermissionMatrix onOpenRole={setEditor} />
      )}

      <RoleEditor
        roleId={editor}
        onClose={() => setEditor(null)}
        onSaved={() => void refresh()}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(next) => (!next ? setDeleting(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              This role will be removed from the role list. It cannot be deleted while active
              members or pending invitations still use it. The audit trail is retained.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void remove()}
              disabled={working !== null}
            >
              {working?.startsWith('delete-') ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminReauthDialog
        open={reauthOpen}
        onOpenChange={(next) => {
          setReauthOpen(next);
          if (!next) pendingAction.current = null;
        }}
        onSuccess={() => {
          setReauthOpen(false);
          const action = pendingAction.current;
          pendingAction.current = null;
          if (action) void runWithReauth('retry', action);
        }}
      />
    </div>
  );
}

function PermissionMatrix({ onOpenRole }: { onOpenRole: (id: string) => void }) {
  const matrix = useAdminPermissionMatrix();
  if (matrix.isLoading) return <PageSkeleton />;
  if (matrix.isError) return <ErrorState error={matrix.error} onRetry={() => void matrix.refetch()} />;
  const roles = (matrix.data?.roles ?? []).filter((role) => role.scope === 'CLUB');
  const permissions = matrix.data?.permissions ?? [];
  const groups = Array.from(new Set(permissions.map((permission) => permission.group)));

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Permission Matrix</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              A read-only view of every club permission and the roles that hold it. Edit a custom
              role from the Roles tab; protected system roles stay fixed.
            </p>
          </div>
          <Badge tone="neutral">
            <ShieldCheck className="size-3" /> Backend enforced
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[44rem] text-left text-xs">
            <thead className="bg-secondary/40">
              <tr>
                <th className="sticky left-0 z-10 min-w-56 bg-secondary/95 px-3 py-2.5 font-bold">
                  Permission
                </th>
                {roles.map((role) => (
                  <th key={role.id} className="min-w-28 px-2 py-2.5 text-center font-bold">
                    <button
                      type="button"
                      onClick={() => onOpenRole(role.id)}
                      className="mx-auto block max-w-28 truncate hover:text-primary hover:underline"
                      title={role.name}
                    >
                      {role.name}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <React.Fragment key={group}>
                  <tr className="border-t border-border bg-secondary/25">
                    <td
                      colSpan={roles.length + 1}
                      className="px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {group}
                    </td>
                  </tr>
                  {permissions
                    .filter((permission) => permission.group === group)
                    .map((permission) => (
                      <tr key={permission.key} className="border-t border-border/70">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2.5">
                          <p className="font-semibold">{permission.label}</p>
                          <p className="mt-0.5 text-[0.62rem] text-muted-foreground">
                            {permission.description}
                          </p>
                        </td>
                        {roles.map((role) => {
                          const allowed =
                            role.key === 'OWNER' || role.permissions.includes(permission.key);
                          return (
                            <td key={role.id} className="px-2 py-2.5 text-center">
                              {allowed ? (
                                <Check
                                  className="mx-auto size-4 text-success"
                                  aria-label="Allowed"
                                />
                              ) : (
                                <Minus
                                  className="mx-auto size-4 text-muted-foreground/50"
                                  aria-label="Not allowed"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
