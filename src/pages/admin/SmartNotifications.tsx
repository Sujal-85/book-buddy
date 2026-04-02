import React, { useState } from 'react';
import { Bell, Send, Mail, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const templates = [
  { id: '1', name: 'Overdue Reminder', channel: 'Email + SMS', trigger: '1 day after due date', active: true },
  { id: '2', name: 'Due Date Warning', channel: 'Push + Email', trigger: '2 days before due date', active: true },
  { id: '3', name: 'New Arrival Alert', channel: 'Push', trigger: 'When new book in preferred category', active: true },
  { id: '4', name: 'Fine Escalation', channel: 'Email + SMS', trigger: '7 days overdue', active: false },
  { id: '5', name: 'Reservation Ready', channel: 'Push + Email', trigger: 'Reserved book returned', active: true },
  { id: '6', name: 'Account Suspension Warning', channel: 'Email', trigger: '30 days overdue', active: true },
];

const recentNotifications = [
  { to: 'Rahul Patil', subject: 'Overdue: Clean Code', channel: 'Email', sent: '5 mins ago', status: 'delivered' },
  { to: 'Priya Sharma', subject: 'Due tomorrow: Design Patterns', channel: 'Push', sent: '15 mins ago', status: 'delivered' },
  { to: 'All CSE Students', subject: 'New arrivals in Programming section', channel: 'Push', sent: '1 hour ago', status: 'delivered' },
  { to: 'Amit Kumar', subject: 'Fine reminder: ₹85 pending', channel: 'SMS', sent: '2 hours ago', status: 'failed' },
];

const SmartNotifications: React.FC = () => {
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Smart Notification System" description="Automated multi-channel notifications for library events" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Sent Today', value: '156', icon: Send },
            { label: 'Delivery Rate', value: '97.3%', icon: CheckCircle },
            { label: 'Email Queue', value: '12', icon: Mail },
            { label: 'Scheduled', value: '45', icon: Clock },
          ].map((s) => (
            <LibCard key={s.label} className="flex items-center gap-3">
              <s.icon className="h-6 w-6 text-accent" />
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold text-foreground">{s.value}</p></div>
            </LibCard>
          ))}
        </div>

        {/* Broadcast */}
        <LibCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Broadcast</h3>
          <div className="space-y-3">
            <input placeholder="Message title..." className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <textarea placeholder="Message body..." rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <div className="flex gap-3">
              <LibButton onClick={() => { setSendingBroadcast(true); setTimeout(() => { setSendingBroadcast(false); toast.success('Broadcast sent!'); }, 1500); }} disabled={sendingBroadcast}>
                {sendingBroadcast ? 'Sending...' : 'Send to All Students'}
              </LibButton>
              <LibButton variant="outline">Schedule</LibButton>
            </div>
          </div>
        </LibCard>

        {/* Templates */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Notification Templates</h3>
          <div className="space-y-2">
            {templates.map((t) => (
              <LibCard key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className={`h-4 w-4 ${t.active ? 'text-accent' : 'text-muted-foreground'}`} />
                  <div><p className="text-sm font-medium text-foreground">{t.name}</p><p className="text-xs text-muted-foreground">{t.trigger} · {t.channel}</p></div>
                </div>
                <LibBadge variant={t.active ? 'available' : 'default'}>{t.active ? 'Active' : 'Disabled'}</LibBadge>
              </LibCard>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Notifications</h3>
          <div className="space-y-2">
            {recentNotifications.map((n, i) => (
              <LibCard key={i} className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">{n.subject}</p><p className="text-xs text-muted-foreground">To: {n.to} · {n.sent}</p></div>
                <div className="flex items-center gap-2">
                  <LibBadge>{n.channel}</LibBadge>
                  <LibBadge variant={n.status === 'delivered' ? 'available' : 'issued'}>{n.status}</LibBadge>
                </div>
              </LibCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartNotifications;
