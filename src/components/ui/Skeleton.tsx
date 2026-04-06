import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('shimmer bg-slate-300 dark:bg-slate-800/80 rounded-lg relative overflow-hidden', className)} {...props} />
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <div className="space-y-3">
    <div className="flex gap-4 p-4 bg-secondary rounded-t-lg">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border-b border-border">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-card/50 border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-500">
    <Skeleton className="h-48 w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2 opacity-70" />
    </div>
    <div className="pt-2">
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  </div>
);

export const StatSkeleton: React.FC = () => (
  <div className="bg-card/50 border border-border/50 rounded-2xl p-5 space-y-3 shadow-sm">
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3 opacity-70" />
      </div>
    </div>
  </div>
);
