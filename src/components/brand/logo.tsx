import Link from 'next/link';
import { cn } from '@/lib/utils';

export function PickleballMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-10', className)} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#C9F56A" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#0F3524" strokeWidth="2" opacity="0.18" />
      <circle cx="24" cy="22" r="3.2" fill="#0F3524" opacity="0.42" />
      <circle cx="38" cy="18" r="2.6" fill="#0F3524" opacity="0.32" />
      <circle cx="45" cy="29" r="3" fill="#0F3524" opacity="0.38" />
      <circle cx="18" cy="35" r="2.4" fill="#0F3524" opacity="0.3" />
      <circle cx="31" cy="37" r="3.1" fill="#0F3524" opacity="0.4" />
      <circle cx="41" cy="44" r="2.5" fill="#0F3524" opacity="0.3" />
      <circle cx="24" cy="48" r="2.2" fill="#0F3524" opacity="0.26" />
      <path
        d="M13 44c8-3 13-9 17-17 3-6 8-10 15-11"
        fill="none"
        stroke="#0F3524"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
  tone = 'dark',
}: {
  className?: string;
  compact?: boolean;
  tone?: 'dark' | 'light';
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <PickleballMark className="size-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-[1.3rem] font-extrabold tracking-[-0.04em]',
            tone === 'light' ? 'text-white' : 'text-forest',
          )}
        >
          Pickle<span className={tone === 'light' ? 'text-lime' : 'text-[#5d8b22]'}>Queue</span>
        </span>
        {!compact ? (
          <span
            className={cn(
              'mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em]',
              tone === 'light' ? 'text-white/55' : 'text-muted-foreground',
            )}
          >
            Play · Rotate · Connect
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function LogoLink({
  href = '/',
  tone = 'dark',
  className,
}: {
  href?: string;
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <Link href={href} className={cn('inline-flex w-fit', className)} aria-label="PickleQueue home">
      <Logo tone={tone} />
    </Link>
  );
}
