import React from 'react';
import { Bell, BookOpen, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const alerts: any[] = [];

const notifications: any[] = [];

const AvailabilityAlerts: React.FC = () => (
  <div className="h-full flex flex-col overflow-hidden">
    <PageHeader title="Availability Alerts" description="Get notified when books become available" />
    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
      {/* Set Alert */}
      <LibCard className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Bell className="h-4 w-4 text-accent" /> Set New Alert</h3>
        <div className="flex gap-3">
          <input placeholder="Search for a book to track..." className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <LibButton onClick={() => toast.success('Alert set! We\'ll notify you when available.')}>Track</LibButton>
        </div>
      </LibCard>

      {/* Active Alerts */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          Active Alerts 
          <LibBadge variant="default" className="text-[10px]">{alerts.length}</LibBadge>
        </h3>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((a) => (
              <LibCard key={a.id} className={`flex items-center justify-between transition-all ${a.status === 'available' ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${a.status === 'available' ? 'bg-green-500/10' : 'bg-secondary'}`}>
                    <BookOpen className={`h-5 w-5 ${a.status === 'available' ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.book}</p>
                    <p className="text-xs text-muted-foreground">{a.author} · {a.status === 'available' ? 'Available now!' : `Queue position: #${a.position} · Est. ${a.estimatedDate}`}</p>
                  </div>
                </div>
                {a.status === 'available' ? (
                  <LibButton size="sm" onClick={() => toast.success('Borrow request sent!')} className="flex items-center gap-1.5 shadow-sm active:scale-95"><CheckCircle className="h-3 w-3" /> Borrow Now</LibButton>
                ) : (
                  <LibBadge variant="pending" className="text-[10px]">In Queue</LibBadge>
                )}
              </LibCard>
            ))
          ) : (
            <LibCard className="py-8 flex flex-col items-center justify-center text-center space-y-3 bg-secondary/20 border-dashed border-muted">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No active alerts</p>
                <p className="text-xs text-muted-foreground">Search and track books to get notified when they return.</p>
              </div>
            </LibCard>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Notifications</h3>
        <div className="space-y-2">
          {notifications.length > 0 ? (
            notifications.map((n, i) => (
              <LibCard key={i} className={`flex items-center justify-between transition-colors ${!n.read ? 'border-accent/30 bg-accent/5' : ''}`}>
                <div className="flex items-center gap-3">
                  {!n.read ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-muted/30 shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
              </LibCard>
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground italic">Your inbox is empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default AvailabilityAlerts;
