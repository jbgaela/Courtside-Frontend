'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, setCsrfToken } from './api';
import { clearPrivateClientCaches, clearPrivateLocalData } from './private-client-data';
import type { Me } from './types';

interface AuthState {
  me: Me | null;
  loading: boolean;
  error: Error | null;
  setMe: (me: Me | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | null>(null);

async function fetchMe(): Promise<Me | null> {
  try {
    return await api.get<Me>('/api/v1/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (query.data) setCsrfToken(query.data.csrfToken);
  }, [query.data]);

  const setMe = React.useCallback(
    (me: Me | null) => {
      const previous = queryClient.getQueryData<Me | null>(['me']);
      if (previous?.id !== me?.id) {
        clearPrivateLocalData();
        void clearPrivateClientCaches();
      }
      queryClient.setQueryData(['me'], me);
      setCsrfToken(me?.csrfToken ?? null);
    },
    [queryClient],
  );

  const refresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  }, [queryClient]);

  const logout = React.useCallback(async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Clearing local auth state must succeed even if the server session is already gone.
    }
    setCsrfToken(null);
    clearPrivateLocalData();
    await clearPrivateClientCaches();
    queryClient.setQueryData(['me'], null);
    queryClient.clear();
  }, [queryClient]);

  const value = React.useMemo<AuthState>(
    () => ({
      me: query.data ?? null,
      loading: query.isLoading,
      error: query.error instanceof Error ? query.error : null,
      setMe,
      refresh,
      logout,
    }),
    [query.data, query.isLoading, query.error, setMe, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function useIsAdmin(): boolean {
  const { me } = useAuth();
  return Boolean(
    me?.memberships.some(
      (membership) => membership.role === 'OWNER' || membership.role === 'QUEUE_MASTER',
    ),
  );
}
