'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    let registration: ServiceWorkerRegistration | undefined;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        if (registration.waiting) {
          toast.info('A new PickleQueue version is ready.', {
            duration: 12_000,
            action: { label: 'Reload', onClick: () => window.location.reload() },
          });
        }
        registration.addEventListener('updatefound', () => {
          const worker = registration?.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              toast.info('A new PickleQueue version is ready.', {
                duration: 12_000,
                action: { label: 'Reload', onClick: () => window.location.reload() },
              });
            }
          });
        });
      } catch {
        // Registration failure should not break the app.
      }
    };

    void register();
    // Do not reload automatically when a worker takes control. The update toast
    // gives the user an explicit reload action, avoiding surprise navigation
    // while they are scoring a match.
  }, []);

  return null;
}
