const LAST_SEEN_PREFIX = 'pq.lastSeen.';

/** Remove read-only snapshots that may contain club-only queue/player data. */
export function clearPrivateLocalData(): void {
  if (typeof window === 'undefined') return;
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(LAST_SEEN_PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage may be unavailable in private browsing.
  }
}

/** Clear cached navigations and assets after logout/account switching. */
export async function clearPrivateClientCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const keys = await window.caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith('picklequeue-')).map((key) => window.caches.delete(key)),
    );
  } catch {
    // CacheStorage can be unavailable or blocked; the server session remains revoked.
  }
}
