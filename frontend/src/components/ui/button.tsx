import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
export const buttonVariants = cva(
  'btn inline-flex items-center justify-center gap-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'primary',
        outline: '',
        ghost: 'ghost',
        white: 'white',
        destructive: 'danger',
      },
      size: { default: '', sm: 'small', icon: 'icon-btn' },
    },
    defaultVariants: { variant: 'outline', size: 'default' },
  },
);
export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
