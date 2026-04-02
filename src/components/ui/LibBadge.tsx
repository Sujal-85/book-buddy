import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'available' | 'issued' | 'overdue' | 'pending' | 'returned' | 'default';

const variantClasses: Record<BadgeVariant, string> = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  returned: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  default: 'bg-secondary text-secondary-foreground',
};

interface LibBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const LibBadge: React.FC<LibBadgeProps> = ({ variant = 'default', children, className }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)}>
    {children}
  </span>
);

export default LibBadge;
