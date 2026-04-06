import React from 'react';
import { useNotifications, useMarkAllRead, useMarkNotificationRead } from '@/hooks/useNotifications';
import { Bell, BookOpen, AlertTriangle, CheckCircle, X, Inbox } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import { timeAgo } from '@/utils/helpers';

import { useAuth } from '@/context/AuthContext';

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  overdue: { icon: AlertTriangle, color: 'text-destructive' },
  due_soon: { icon: Bell, color: 'text-warning' },
  approved: { icon: CheckCircle, color: 'text-success' },
  returned: { icon: BookOpen, color: 'text-accent' },
};

const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications(user?.uid);
  const markAllRead = useMarkAllRead();
  const markRead = useMarkNotificationRead();

  return (
    <div className="absolute right-4 top-14 z-50 w-80 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Notifications</h3>
        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <button 
              onClick={() => markAllRead.mutate()} 
              className="text-[10px] font-black uppercase text-accent hover:underline tracking-tighter"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Syncing alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-6">
            <div className="p-3 bg-secondary/50 rounded-full mb-3">
              <Inbox className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground">All caught up!</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">No new alerts at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n: any) => {
              const config = typeConfig[n.type] || typeConfig.returned;
              const Icon = config.icon;
              return (
                <div 
                  key={n.id} 
                  onClick={() => !n.read && markRead.mutate(n.id)}
                  className={`flex gap-3 px-4 py-4 hover:bg-secondary/20 transition-colors cursor-pointer relative group ${!n.read ? 'bg-accent/5' : ''}`}
                >
                  {!n.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                  )}
                  <div className={`p-2 rounded-xl bg-background border border-border group-hover:border-accent/40 transition-colors`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${!n.read ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                      {n.message}
                    </p>
                    <p className="text-[9px] font-black text-muted-foreground/60 mt-1.5 uppercase tracking-widest">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {notifications.length > 5 && (
        <div className="px-4 py-2 border-t border-border bg-secondary/10">
          <button className="w-full text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-accent transition-colors">
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
