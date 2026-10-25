'use client';

import { useEffect, useRef, useState } from 'react';

interface Cached<T> {
  data: T;
  savedAt: string;
}

/**
 * Read-only last-seen fallback for offline use. It is deliberately labelled with
 * a timestamp everywhere it is shown; it is never treated as live data.
 */
export function useLastSeen<T>(key: string, data: T | undefined) {
  const [cached, setCached] = useState<Cached<T> | null>(null);
  const latest = useRef(data);

  useEffect(() => {
    latest.current = data;
    if (!data) return;
    try {
      const payload: Cached<T> = { data, savedAt: new Date().toISOString() };
      window.localStorage.setItem(key, JSON.stringify(payload));
      // Persisting a read-only fallback is an external-system sync, not derived render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCached(payload);
    } catch {
      // Storage may be blocked; live data remains available for this session.
    }
  }, [data, key]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Cached<T>;
      // Hydrating the offline fallback from localStorage is an external read.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed?.data && parsed.savedAt) setCached(parsed);
    } catch {
      // Ignore corrupt cache entries.
    }
  }, [key]);

  return cached;
}
