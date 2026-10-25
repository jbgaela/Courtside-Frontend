import { clearPrivateClientCaches, clearPrivateLocalData } from './private-client-data';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';
export const API_INTERNAL_URL = process.env.API_INTERNAL_URL?.replace(/\/$/, '') ?? API_URL;
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

const CSRF_KEY = 'pq.csrf';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Array<{ path?: string; message: string; code?: string }>,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class OfflineError extends Error {
  constructor() {
    super('You are offline. Reconnect to make changes.');
    this.name = 'OfflineError';
  }
}

type Listener = (token: string | null) => void;
let csrfToken: string | null = null;
let csrfLoaded = false;
const csrfListeners = new Set<Listener>();

function readStoredCsrf(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(CSRF_KEY);
  } catch {
    return null;
  }
}

export function getCsrfToken(): string | null {
  if (!csrfLoaded) {
    csrfToken = readStoredCsrf();
    csrfLoaded = true;
  }
  return csrfToken;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
  csrfLoaded = true;
  if (typeof window !== 'undefined') {
    try {
      if (token) window.sessionStorage.setItem(CSRF_KEY, token);
      else window.sessionStorage.removeItem(CSRF_KEY);
    } catch {
      // Storage can be unavailable in private mode; the in-memory token still works.
    }
  }
  for (const listener of csrfListeners) listener(token);
}

export function onCsrfToken(listener: Listener): () => void {
  csrfListeners.add(listener);
  return () => csrfListeners.delete(listener);
}

function captureCsrf(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const record = data as Record<string, unknown>;
  if (typeof record.csrfToken === 'string') {
    setCsrfToken(record.csrfToken);
    return;
  }
  if (record.user && typeof record.user === 'object') {
    const user = record.user as Record<string, unknown>;
    if (typeof user.csrfToken === 'string') setCsrfToken(user.csrfToken);
  }
}

function headersFor(method: string, body: unknown, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }
  if (method !== 'GET' && method !== 'HEAD') {
    const token = getCsrfToken();
    if (token) headers.set('x-csrf-token', token);
  }
  return headers;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
  headers?: HeadersInit;
  cache?: RequestCache;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  if (
    typeof window !== 'undefined' &&
    method !== 'GET' &&
    typeof navigator !== 'undefined' &&
    !navigator.onLine
  ) {
    throw new OfflineError();
  }
  const headers = headersFor(method, options.body, options.headers);
  if (options.idempotencyKey) headers.set('idempotency-key', options.idempotencyKey);
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    cache: options.cache ?? 'no-store',
    signal: options.signal,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  let payload: unknown = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const error = (
      payload as {
        error?: {
          code?: string;
          message?: string;
          details?: Array<{ path?: string; message: string; code?: string }>;
          requestId?: string;
        };
      } | null
    )?.error;
    if (response.status === 401) {
      const hadSessionToken = Boolean(getCsrfToken());
      setCsrfToken(null);
      // Drop any last-seen club data even if the session expired without an
      // explicit logout. Cached HTML is separately private-route protected.
      clearPrivateLocalData();
      if (hadSessionToken) void clearPrivateClientCaches();
    }
    throw new ApiError(
      response.status,
      error?.code ?? 'REQUEST_FAILED',
      error?.message ?? `Request failed (${response.status})`,
      error?.details,
      error?.requestId,
    );
  }

  const data = (payload as { data?: T } | null)?.data;
  captureCsrf(data);
  if (data === undefined) return undefined as T;
  return data;
}

export function newIdempotencyKey(prefix = 'op'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE', body }),
};

/** Server-side public reads. Never used for authenticated data. */
export async function serverPublicRequest<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_INTERNAL_URL}${path}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: T };
    return payload.data ?? null;
  } catch {
    return null;
  }
}
