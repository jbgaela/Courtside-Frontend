const CSRF_KEY = 'pq.registration.csrf';
const EMAIL_KEY = 'pq.registration.email';
const RETURN_KEY = 'pq.returnTo';

function storage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function setRegistrationCsrf(token: string | null): void {
  const store = storage();
  if (!store) return;
  try {
    if (token) store.setItem(CSRF_KEY, token);
    else store.removeItem(CSRF_KEY);
  } catch {
    // Private browsing can block storage; the caller still receives the token.
  }
}

export function getRegistrationCsrf(): string | null {
  return storage()?.getItem(CSRF_KEY) ?? null;
}

export function setRegistrationEmail(email: string | null): void {
  const store = storage();
  if (!store) return;
  try {
    if (email) store.setItem(EMAIL_KEY, email);
    else store.removeItem(EMAIL_KEY);
  } catch {
    // Best-effort display data only.
  }
}

export function getRegistrationEmail(): string | null {
  return storage()?.getItem(EMAIL_KEY) ?? null;
}

function safeReturnPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) return null;
  return path;
}

/** Persist the intended destination across registration, approval and activation. */
export function setReturnTo(path: string | null): void {
  const store = storage();
  if (!store) return;
  try {
    const safe = safeReturnPath(path);
    if (safe) store.setItem(RETURN_KEY, safe);
    else store.removeItem(RETURN_KEY);
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export function getReturnTo(): string | null {
  return safeReturnPath(storage()?.getItem(RETURN_KEY));
}

export function consumeReturnTo(): string | null {
  const value = getReturnTo();
  setReturnTo(null);
  return value;
}

export function clearRegistrationClientState(): void {
  setRegistrationCsrf(null);
  setRegistrationEmail(null);
}
