import React from 'react';
import { useMarkAllRead } from '@/hooks/useNotifications';
import { Bell, BookOpen, AlertTriangle, CheckCircle, X } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import { timeAgo } from '@/utils/helpers';

// Demo notifications for UI
const demoNotifications = [
  { id: '1', type: 'overdue', message: '"Clean Code" is 3 days overdue', createdAt: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: '2', type: 'due_soon', message: '"Design Patterns" is due in 2 days', createdAt: new Date(Date.now() - 7200000).toISOString(), read: false },
  { id: '3', type: 'approved', message: 'Your borrow request for "The Pragmatic Programmer" was approved', createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
  { id: '4', type: 'returned', message: '"Refactoring" was returned successfully', createdAt: new Date(Date.now() - 172800000).toISOString(), read: true },
];

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  overdue: { icon: AlertTriangle, color: 'text-destructive' },
  due_soon: { icon: Bell, color: 'text-warning' },
  approved: { icon: CheckCircle, color: 'text-success' },
  returned: { icon: BookOpen, color: 'text-accent' },
};

const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const markAllRead = useMarkAllRead();

  return (
    <div className="absolute right-4 top-14 z-50 w-80 bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => markAllRead.mutate()} className="text-xs text-accent hover:underline">
            Mark all read
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {demoNotifications.map((n) => {
          const config = typeConfig[n.type] || typeConfig.returned;
          const Icon = config.icon;
          return (
            <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-border ${!n.read ? 'bg-secondary/50' : ''}`}>
              <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationPanel;
