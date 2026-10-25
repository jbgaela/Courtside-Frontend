/**
 * Only allow a single-slash internal path. This prevents protocol-relative and
 * scheme-bearing redirects such as `//evil.example` and `\\evil.example`.
 */
export function safeInternalPath(value: string | undefined | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('\\') || /%(?:2f|5c)/i.test(value)) return null;
  try {
    const parsed = new URL(value, 'https://picklequeue.invalid');
    if (parsed.origin !== 'https://picklequeue.invalid') return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
