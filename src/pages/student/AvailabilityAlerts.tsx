import React from 'react';
import { Bell, BookOpen, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const alerts = [
  { id: '1', book: 'System Design Interview', author: 'Alex Xu', status: 'waiting', position: 3, estimatedDate: '2025-04-05' },
  { id: '2', book: 'Deep Learning', author: 'Ian Goodfellow', status: 'waiting', position: 7, estimatedDate: '2025-04-15' },
  { id: '3', book: 'Computer Networks', author: 'James Kurose', status: 'available', position: 0, estimatedDate: 'Now' },
];

const notifications = [
  { message: '"Clean Architecture" is now available — you reserved it!', time: '2 hours ago', read: false },
  { message: '"Intro to Algorithms" will be returned by Apr 3', time: '1 day ago', read: true },
  { message: 'New arrival: "AI Superpowers" added to library', time: '2 days ago', read: true },
  { message: '"Design Patterns" due date reminder — 2 days left', time: '3 days ago', read: true },
];

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
        <h3 className="text-sm font-semibold text-foreground mb-3">Active Alerts ({alerts.length})</h3>
        <div className="space-y-3">
          {alerts.map((a) => (
            <LibCard key={a.id} className={`flex items-center justify-between ${a.status === 'available' ? 'border-green-500/50' : ''}`}>
              <div className="flex items-center gap-3">
                <BookOpen className={`h-5 w-5 ${a.status === 'available' ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{a.book}</p>
                  <p className="text-xs text-muted-foreground">{a.author} · {a.status === 'available' ? 'Available now!' : `Queue position: #${a.position} · Est. ${a.estimatedDate}`}</p>
                </div>
              </div>
              {a.status === 'available' ? (
                <LibButton size="sm" onClick={() => toast.success('Borrow request sent!')} className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Borrow Now</LibButton>
              ) : (
                <LibBadge>In Queue</LibBadge>
              )}
            </LibCard>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Notifications</h3>
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <LibCard key={i} className={`flex items-center justify-between ${!n.read ? 'border-accent/50' : ''}`}>
              <div className="flex items-center gap-3">
                {!n.read && <div className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                <div><p className="text-sm text-foreground">{n.message}</p><p className="text-xs text-muted-foreground">{n.time}</p></div>
              </div>
            </LibCard>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AvailabilityAlerts;
