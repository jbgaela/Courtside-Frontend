import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

const palette = [
  'bg-[#e3f2cf] text-[#42601c]',
  'bg-[#dcefe5] text-[#235b3d]',
  'bg-[#e6edf8] text-[#36547d]',
  'bg-[#f7ecd8] text-[#7a5621]',
  'bg-[#f1e5ef] text-[#71375f]',
  'bg-[#e9ecdd] text-[#4f5a2b]',
];

function pick(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length] ?? palette[0]!;
}

export function Avatar({
  name,
  size = 'md',
  className,
  color,
}: {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string | null;
}) {
  const sizes = {
    xs: 'size-6 text-[0.55rem]',
    sm: 'size-8 text-[0.65rem]',
    md: 'size-10 text-xs',
    lg: 'size-12 text-sm',
    xl: 'size-16 text-lg',
  };
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-bold tracking-wide ring-2 ring-white',
        color ? '' : pick(name),
        sizes[size],
        className,
      )}
      style={color ? { backgroundColor: `${color}22`, color } : undefined}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  names,
  max = 4,
  size = 'sm',
}: {
  names: string[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}) {
  const shown = names.slice(0, max);
  const remaining = names.length - shown.length;
  return (
    <span className="flex -space-x-2">
      {shown.map((name) => (
        <Avatar key={name} name={name} size={size} />
      ))}
      {remaining > 0 ? (
        <span className="grid size-8 place-items-center rounded-full bg-secondary text-[0.6rem] font-bold text-secondary-foreground ring-2 ring-white">
          +{remaining}
        </span>
      ) : null}
    </span>
  );
}
