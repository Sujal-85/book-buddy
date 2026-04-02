import React from 'react';
import { cn } from '@/lib/utils';

interface LibCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const LibCard: React.FC<LibCardProps> = ({ className, children, ...props }) => (
  <div className={cn('bg-card border border-border rounded-lg p-4', className)} {...props}>
    {children}
  </div>
);

export default LibCard;
