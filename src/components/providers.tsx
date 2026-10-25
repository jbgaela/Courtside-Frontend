'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import { PwaRegistrar } from '@/components/pwa/pwa-registrar';
import { OfflineBanner } from '@/components/system/offline-banner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            gcTime: 30 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineBanner />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              'rounded-xl border border-border bg-card text-foreground shadow-lift text-sm',
          }}
        />
        <PwaRegistrar />
      </AuthProvider>
    </QueryClientProvider>
  );
}
