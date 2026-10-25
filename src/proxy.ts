import { NextResponse, type NextRequest } from 'next/server';

function normaliseOrigin(value: string | undefined, fallback: string): string {
  try {
    const parsed = new URL(value || fallback);
    return parsed.origin;
  } catch {
    return fallback;
  }
}

function websocketOrigin(httpOrigin: string): string {
  return httpOrigin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const apiOrigin = normaliseOrigin(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:4000');
  const appOrigin = normaliseOrigin(process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000');
  const devSocketOrigin = isDev ? ` ${websocketOrigin(appOrigin)}` : '';
  const allHttps = appOrigin.startsWith('https://') && apiOrigin.startsWith('https://');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Inline style attributes are used for progress bars and dynamic layout.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin} ${websocketOrigin(apiOrigin)}${devSocketOrigin}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(allHttps ? ['upgrade-insecure-requests'] : []),
  ]
    .join('; ')
    .replace(/\s{2,}/g, ' ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  // HTML carries a request nonce and may contain authenticated application
  // shells. Do not let a CDN or browser HTTP cache reuse it across requests.
  response.headers.set('Cache-Control', 'private, no-store');
  if (!isDev) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000');
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
