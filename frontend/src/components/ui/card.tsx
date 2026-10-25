import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('panel min-w-0', className)} {...props} />;
}
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('panel-head', className)} {...props} />;
}
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('panel-body', className)} {...props} />;
}
