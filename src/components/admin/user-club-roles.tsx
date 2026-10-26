'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, Plus, Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, api } from '@/lib/api';
import { adminQueryKeys, useAdminRoles, useAdminUserClubRoles } from '@/lib/admin-queries';
import type { ClubSummary } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Select } from '@/components/ui/input';
import { AdminReauthDialog } from '@/components/admin/reauth-dialog';

export function AdminUserClubRolesCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const memberships = useAdminUserClubRoles(userId);
  const roles = useAdminRoles({ scope: 'CLUB' });
  const clubs = useQuery({
    queryKey: ['admin', 'club-options'],
    queryFn: () => api.get<ClubSummary[]>('/api/v1/clubs?limit=50'),
  });
  const [adding, setAdding] = React.useState(false);
  const [clubId, setClubId] = React.useState('');
  const [roleKey, setRoleKey] = React.useState('PLAYER');
  const [working, setWorking] = React.useState<string | null>(null);
  const [reauthOpen, setReauthOpen] = React.useState(false);
  const pendingAction = React.useRef<null | (() => Promise<void>)>(null);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userClubRoles(userId) }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(userId) }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
    ]);
  };

  const run = async (key: string, action: () => Promise<void>) => {
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
      toast.error(error instanceof Error ? error.message : 'The role change did not go through');
    } finally {
      setWorking(null);
    }
  };

  const roleOptions = roles.data?.items ?? [];
  const current = memberships.data ?? [];

  const changeRole = (membershipId: string, clubIdValue: string, nextRole: string) => {
    if (!nextRole) return;
    void run(`change-${membershipId}`, async () => {
      await api.post('/api/v1/admin/roles/assign', { userId, clubId: clubIdValue, roleKey: nextRole });
      toast.success('Club role updated');
    });
  };

  const removeRole = (membershipId: string, clubName: string) => {
    if (
      !window.confirm(
        `Remove this user from ${clubName}? They will lose access to that club immediately.`,
      )
    ) {
      return;
    }
    void run(`remove-${membershipId}`, async () => {
      await api.delete(`/api/v1/admin/roles/assignments/${membershipId}`);
      toast.success('Club role removed');
    });
  };

  const assign = () => {
    if (!clubId || !roleKey) {
      toast.error('Choose a club and a role');
      return;
    }
    void run('assign', async () => {
      await api.post('/api/v1/admin/roles/assign', { userId, clubId, roleKey });
      toast.success('Club role assigned');
      setAdding(false);
      setClubId('');
      setRoleKey('PLAYER');
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Club roles</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Roles are scoped to one club. A person can manage one club and be a player at another.
            Changes apply on their next request.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setAdding((value) => !value)}>
          <Plus className="size-3.5" /> Assign role
        </Button>
      </div>

      {adding ? (
        <div className="mt-4 rounded-xl border border-[#d9edb2] bg-lime-soft/35 p-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Club" htmlFor="assign-club">
              <Select id="assign-club" value={clubId} onChange={(event) => setClubId(event.target.value)}>
                <option value="">Choose a club…</option>
                {(clubs.data ?? []).map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Role" htmlFor="assign-role">
              <Select id="assign-role" value={roleKey} onChange={(event) => setRoleKey(event.target.value)}>
                {roleOptions
                  .filter((role) => role.key !== 'OWNER')
                  .map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.name} · {role.permissions.length} permissions
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => void assign()} disabled={working !== null}>
              {working === 'assign' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserCog className="size-3.5" />
              )}
              Assign club role
            </Button>
          </div>
        </div>
      ) : null}

      {memberships.isLoading ? (
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-secondary/50" />
      ) : memberships.isError ? (
        <p className="mt-4 text-sm text-destructive">Club roles could not be loaded.</p>
      ) : current.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center">
          <Building2 className="mx-auto size-6 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-semibold">No club roles yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This account can play, but it cannot access any club management surface.
          </p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {current.map((membership) => (
            <div key={membership.id} className="flex flex-wrap items-center gap-3 p-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Building2 className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{membership.clubName}</p>
                <p className="text-[0.68rem] text-muted-foreground">
                  {membership.roleName} · {membership.permissions.length} permissions
                  {membership.clubArchived ? ' · archived' : ''}
                </p>
              </div>
              {membership.role === 'OWNER' ? (
                <Badge tone="forest">Owner — transfer to change</Badge>
              ) : (
                <>
                  <Select
                    value={membership.role}
                    onChange={(event) =>
                      void changeRole(membership.id, membership.clubId, event.target.value)
                    }
                    disabled={working !== null || membership.clubArchived}
                    className="h-9 w-auto min-w-40 text-xs"
                    aria-label={`Role at ${membership.clubName}`}
                  >
                    {roleOptions
                      .filter((role) => role.key !== 'OWNER')
                      .map((role) => (
                        <option key={role.key} value={role.key}>
                          {role.name}
                        </option>
                      ))}
                    {!roleOptions.some((role) => role.key === membership.role) ? (
                      <option value={membership.role}>{membership.roleName}</option>
                    ) : null}
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove role at ${membership.clubName}`}
                    disabled={working !== null}
                    onClick={() => removeRole(membership.id, membership.clubName)}
                  >
                    {working === `remove-${membership.id}` ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

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
          if (action) void run('retry', action);
        }}
      />
    </div>
  );
}
