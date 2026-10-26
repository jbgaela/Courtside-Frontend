'use client';

import * as React from 'react';
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Eye,
  KeyRound,
  ListOrdered,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, api } from '@/lib/api';
import { useAdminPermissionCatalog, useAdminRole } from '@/lib/admin-queries';
import type { AdminPermissionDefinition } from '@/lib/admin-types';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, Input, Textarea } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/feedback';
import { AdminReauthDialog } from '@/components/admin/reauth-dialog';

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Clubs: Building2,
  Members: Users,
  Sessions: CalendarDays,
  'Queue & matches': ListOrdered,
  Scores: Trophy,
  System: ShieldCheck,
};

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  SUPER_ADMIN: ShieldCheck,
  OWNER: ShieldCheck,
  QUEUE_MASTER: ClipboardList,
  PLAYER: Users,
  CLUB_MANAGER: Building2,
  VIEWER: Eye,
};

export function roleIcon(key: string) {
  return ROLE_ICONS[key] ?? KeyRound;
}

function isReauthError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    error.message.toLowerCase().includes('confirm your password')
  );
}

interface RoleEditorProps {
  roleId: string | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RoleEditor({ roleId, onClose, onSaved }: RoleEditorProps) {
  const open = roleId !== null;
  const isNew = roleId === 'new';
  const queryClient = useQueryClient();
  const catalog = useAdminPermissionCatalog();
  const role = useAdminRole(isNew || !roleId ? undefined : roleId);
  const [tab, setTab] = React.useState<'basic' | 'permissions'>('basic');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [permissions, setPermissions] = React.useState<string[]>(['club.view']);
  const [search, setSearch] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reauthOpen, setReauthOpen] = React.useState(false);
  const pendingSave = React.useRef<null | (() => Promise<void>)>(null);

  React.useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setTab('basic');
    setSearch('');
    setError(null);
    if (isNew) {
      setName('');
      setDescription('');
      setPermissions(['club.view']);
      return;
    }
    if (role.data) {
      setName(role.data.name);
      setDescription(role.data.description ?? '');
      setPermissions(role.data.permissions);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, isNew, role.data]);

  const data = isNew ? null : role.data;
  const protectedRole = Boolean(data?.isProtected) || data?.scope === 'PLATFORM';

  const togglePermission = (key: string) => {
    setPermissions((current) =>
      current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key],
    );
  };

  const saveRequest = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        await api.post('/api/v1/admin/roles', {
          name: name.trim(),
          description: description.trim() || null,
          permissions,
        });
        toast.success('Role created');
      } else if (data) {
        await api.patch(`/api/v1/admin/roles/${data.id}`, {
          name: name.trim(),
          description: description.trim() || null,
          permissions,
          expectedVersion: data.version,
        });
        toast.success('Role updated');
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'role'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'permission-matrix'] });
      onSaved();
      onClose();
    } catch (err) {
      if (isReauthError(err)) {
        pendingSave.current = saveRequest;
        setReauthOpen(true);
        return;
      }
      const message =
        err instanceof ApiError && err.details?.length
          ? err.details[0]?.message
          : err instanceof Error
            ? err.message
            : 'The role could not be saved';
      setError(message ?? 'The role could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (!name.trim()) {
      setError('Give this role a name');
      setTab('basic');
      return;
    }
    if (!permissions.includes('club.view')) {
      setError('Include View club so members can open the club');
      setTab('permissions');
      return;
    }
    void saveRequest();
  };

  const filteredGroups = React.useMemo(() => {
    const groups = catalog.data?.groups ?? [];
    if (!search.trim()) return groups;
    const term = search.toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (permission) =>
            permission.label.toLowerCase().includes(term) ||
            permission.description.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [catalog.data?.groups, search]);

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
        <DialogContent
          className="left-auto right-0 top-0 flex h-dvh w-full max-w-[40rem] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-y-0 border-r-0 p-0 shadow-2xl sm:w-[40rem]"
        >
          <div className="border-b border-border px-5 py-4 pr-14 sm:px-6">
            <DialogTitle className="font-display text-xl font-extrabold">
              {isNew ? 'Create Role' : protectedRole ? 'View Role' : 'Edit Role'}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {isNew
                ? 'Name the role and choose the club capabilities it grants.'
                : 'Configure what this role can access and do inside assigned clubs.'}
            </DialogDescription>
          </div>

          {!isNew && role.isLoading ? (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <PageSkeleton />
            </div>
          ) : !isNew && role.isError ? (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <p className="text-sm text-destructive">This role could not be loaded.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  {React.createElement(roleIcon(data?.key ?? 'CUSTOM'), { className: 'size-6' })}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold">
                    {isNew ? name || 'New role' : data?.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {isNew
                      ? 'Club scope'
                      : (data?.description ??
                        (data?.scope === 'PLATFORM'
                          ? 'Platform administration'
                          : 'Club role'))}
                  </p>
                </div>
                {protectedRole ? (
                  <Badge tone="neutral" className="ml-auto">
                    System
                  </Badge>
                ) : null}
              </div>

              <div className="flex gap-1 border-b border-border px-5 sm:px-6" role="tablist">
                {(
                  [
                    ['basic', 'Basic Information'],
                    ['permissions', 'Permissions'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={tab === value}
                    onClick={() => setTab(value)}
                    className={cn(
                      'relative min-h-12 px-2 text-xs font-bold transition-colors sm:px-3',
                      tab === value ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                    {tab === value ? (
                      <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-primary" />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                {protectedRole ? (
                  <div className="mb-4 rounded-xl border border-[#d9edb2] bg-lime-soft/50 p-3 text-xs leading-relaxed text-[#3f5c16]">
                    <ShieldCheck className="mr-1 inline size-3.5" />
                    This is a protected system role. Its permissions are fixed so a club cannot lose
                    the ability to run. Duplicate it to create a customizable role.
                  </div>
                ) : null}

                {error ? (
                  <p role="alert" className="mb-4 rounded-xl bg-[#fbe9e7] p-3 text-xs text-destructive">
                    {error}
                  </p>
                ) : null}

                {tab === 'basic' ? (
                  <div className="space-y-5">
                    <Field
                      label="Role name"
                      htmlFor="role-name"
                      hint="Use a name people recognize, such as Club Manager or Coach."
                    >
                      <Input
                        id="role-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Club Manager"
                        maxLength={80}
                        disabled={protectedRole}
                      />
                    </Field>
                    <Field
                      label="Description"
                      htmlFor="role-description"
                      hint="Explain what this role is responsible for. This appears in the role list."
                    >
                      <Textarea
                        id="role-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Manage club information, members, courts and sessions."
                        maxLength={300}
                        disabled={protectedRole}
                      />
                    </Field>
                    <div>
                      <p className="text-[0.8rem] font-semibold tracking-wide text-foreground/80">
                        Scope
                      </p>
                      <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-3.5 py-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {data?.scope === 'PLATFORM' ? 'Platform' : 'All assigned clubs'}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {data?.scope === 'PLATFORM'
                              ? 'Platform administration is reserved for Super Admins.'
                              : 'This role applies only where a membership assigns it. It never grants access to another club.'}
                          </p>
                        </div>
                        <Badge tone="info">
                          {data?.scope === 'PLATFORM' ? 'Platform' : 'Club scope'}
                        </Badge>
                      </div>
                    </div>
                    {!isNew && data ? (
                      <div className="rounded-xl border border-border p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold">Assigned members</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {data.userCount} active membership
                              {data.userCount === 1 ? '' : 's'} use this role.
                            </p>
                          </div>
                          <Badge tone={data.userCount ? 'success' : 'neutral'}>
                            {data.userCount}
                          </Badge>
                        </div>
                        {data.memberships.length > 0 ? (
                          <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
                            {data.memberships.slice(0, 20).map((membership) => (
                              <div
                                key={membership.id}
                                className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-2.5 py-2 text-xs"
                              >
                                <span className="min-w-0 truncate font-semibold">
                                  {membership.userName}
                                </span>
                                <span className="shrink-0 text-muted-foreground">
                                  {membership.clubName}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
                          Assign or remove this role from Admin → Users → a user → Club roles.
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search permissions…"
                        className="pl-10"
                        aria-label="Search permissions"
                      />
                    </div>

                    {catalog.isLoading ? (
                      <div className="space-y-3">
                        <div className="h-24 animate-pulse rounded-xl bg-secondary/60" />
                        <div className="h-24 animate-pulse rounded-xl bg-secondary/60" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredGroups.map((group) => {
                          const Icon = GROUP_ICONS[group.name] ?? KeyRound;
                          const selectedCount = group.permissions.filter((permission) =>
                            permissions.includes(permission.key),
                          ).length;
                          return (
                            <div
                              key={group.name}
                              className="overflow-hidden rounded-xl border border-border"
                            >
                              <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3.5 py-2.5">
                                <Icon className="size-4 text-primary" />
                                <p className="text-xs font-bold">{group.name}</p>
                                <span className="ml-auto text-[0.62rem] text-muted-foreground">
                                  {selectedCount}/{group.permissions.length}
                                </span>
                              </div>
                              <div className="divide-y divide-border/70">
                                {group.permissions.map((permission) => (
                                  <PermissionRow
                                    key={permission.key}
                                    permission={permission}
                                    checked={permissions.includes(permission.key)}
                                    disabled={protectedRole}
                                    onChange={() => togglePermission(permission.key)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {filteredGroups.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                            No permissions match that search.
                          </p>
                        ) : null}
                      </div>
                    )}

                    <div className="rounded-xl border border-[#d9edb2] bg-lime-soft/50 p-3 text-xs leading-relaxed text-[#3f5c16]">
                      <ShieldCheck className="mr-1 inline size-3.5" />
                      This role grants only the permissions selected here, inside the clubs where it
                      is assigned. Backend authorization is re-checked on every request.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-3.5 sm:px-6">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  {protectedRole ? 'Close' : 'Cancel'}
                </Button>
                {!protectedRole ? (
                  <Button type="button" onClick={() => void save()} disabled={saving}>
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {isNew ? 'Create role' : 'Save changes'}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AdminReauthDialog
        open={reauthOpen}
        onOpenChange={(next) => {
          setReauthOpen(next);
          if (!next) pendingSave.current = null;
        }}
        onSuccess={() => {
          setReauthOpen(false);
          const retry = pendingSave.current;
          pendingSave.current = null;
          if (retry) void retry();
        }}
      />
    </>
  );
}

function PermissionRow({
  permission,
  checked,
  disabled,
  onChange,
}: {
  permission: AdminPermissionDefinition;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        'flex min-h-12 cursor-pointer items-start gap-3 px-3.5 py-2.5 transition-colors hover:bg-secondary/20',
        disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 size-5 shrink-0 accent-[#164430]"
      />
      <span className="min-w-0">
        <span className="block text-xs font-bold">{permission.label}</span>
        <span className="mt-0.5 block text-[0.68rem] leading-relaxed text-muted-foreground">
          {permission.description}
        </span>
      </span>
    </label>
  );
}
