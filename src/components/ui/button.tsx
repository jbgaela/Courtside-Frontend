import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.985] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_rgba(22,68,48,0.8)] hover:bg-forest-soft',
        accent:
          'bg-accent text-accent-foreground shadow-[0_10px_24px_-14px_rgba(120,170,30,0.9)] hover:bg-[#d6fa82]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-[#dde7d6]',
        outline:
          'border border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary/60',
        ghost: 'text-foreground hover:bg-secondary/70',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-[#a52f28]',
        dark: 'bg-forest text-primary-foreground hover:bg-[#174b33]',
        link: 'text-primary underline-offset-4 hover:underline rounded-md px-0',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3.5 text-xs max-sm:h-11 max-sm:text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11 p-0',
        'icon-sm': 'size-9 p-0 max-sm:size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
