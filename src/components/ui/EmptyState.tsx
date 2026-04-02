import React from 'react';
import { BookOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  message = 'No items found.',
  icon,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
      {icon || <BookOpen className="h-8 w-8 text-muted-foreground" />}
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
