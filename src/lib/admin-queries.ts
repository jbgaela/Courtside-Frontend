'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type {
  AdminAuditList,
  AdminOverview,
  AdminRegistrationDetail,
  AdminRegistrationList,
  AdminUserDetail,
  AdminUserList,
} from './admin-types';

export const adminQueryKeys = {
  overview: ['admin', 'overview'] as const,
  registrations: (params: Record<string, string | number | undefined>) =>
    ['admin', 'registrations', params] as const,
  registration: (id: string) => ['admin', 'registration', id] as const,
  registrationCounts: ['admin', 'registration-counts'] as const,
  users: (params: Record<string, string | number | undefined>) =>
    ['admin', 'users', params] as const,
  user: (id: string) => ['admin', 'user', id] as const,
  audit: (params: Record<string, string | number | undefined>) =>
    ['admin', 'audit', params] as const,
};

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function useAdminOverview() {
  return useQuery({
    queryKey: adminQueryKeys.overview,
    queryFn: () => api.get<AdminOverview>('/api/v1/admin/overview'),
  });
}

export function useAdminRegistrations(params: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}) {
  const normalized = { page: params.page ?? 1, limit: params.limit ?? 20, ...params };
  return useQuery({
    queryKey: adminQueryKeys.registrations(normalized),
    queryFn: () =>
      api.get<AdminRegistrationList>(`/api/v1/admin/registrations${queryString(normalized)}`),
  });
}

export function useAdminRegistration(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.registration(id ?? ''),
    queryFn: () => api.get<AdminRegistrationDetail>(`/api/v1/admin/registrations/${id}`),
    enabled: Boolean(id),
  });
}

export function useAdminUsers(params: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  registrationStatus?: string;
  platformRole?: string;
  from?: string;
  to?: string;
  sort?: string;
  direction?: string;
}) {
  const normalized = { page: params.page ?? 1, limit: params.limit ?? 20, ...params };
  return useQuery({
    queryKey: adminQueryKeys.users(normalized),
    queryFn: () => api.get<AdminUserList>(`/api/v1/admin/users${queryString(normalized)}`),
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.user(id ?? ''),
    queryFn: () => api.get<AdminUserDetail>(`/api/v1/admin/users/${id}`),
    enabled: Boolean(id),
  });
}

export function useAdminAudit(params: {
  page?: number;
  limit?: number;
  q?: string;
  action?: string;
  outcome?: string;
}) {
  const normalized = { page: params.page ?? 1, limit: params.limit ?? 30, ...params };
  return useQuery({
    queryKey: adminQueryKeys.audit(normalized),
    queryFn: () => api.get<AdminAuditList>(`/api/v1/admin/audit-logs${queryString(normalized)}`),
  });
}
