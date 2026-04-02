import React from 'react';
import { Brain, TrendingUp, Users, BookOpen, AlertTriangle, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';

const predictions = [
  { title: 'Peak Borrowing Expected', description: 'Mid-semester exam prep will increase borrowing by ~40% next week', confidence: 92, icon: TrendingUp },
  { title: 'Low Stock Alert', description: 'Programming books will run out in 3 days at current rate', confidence: 87, icon: AlertTriangle },
  { title: 'Popular Category Shift', description: 'AI/ML books trending upward — consider acquiring 15 more titles', confidence: 78, icon: Brain },
  { title: 'Student Engagement Drop', description: '2nd year students borrowing 20% less than last month', confidence: 85, icon: Users },
];

const stats = [
  { label: 'Books Circulated This Month', value: '1,247', change: '+12%', icon: BookOpen },
  { label: 'Active Members', value: '856', change: '+5%', icon: Users },
  { label: 'Avg. Borrow Duration', value: '9.3 days', change: '-2%', icon: BarChart3 },
  { label: 'AI Accuracy Score', value: '94.2%', change: '+1.5%', icon: Brain },
];

const inventoryAlerts = [
  { category: 'Programming', current: 45, needed: 80, urgency: 'high' },
  { category: 'AI & Machine Learning', current: 12, needed: 30, urgency: 'high' },
  { category: 'Database Systems', current: 28, needed: 35, urgency: 'medium' },
  { category: 'Networking', current: 22, needed: 25, urgency: 'low' },
];

const AIAnalytics: React.FC = () => (
  <div className="h-full flex flex-col overflow-hidden">
    <PageHeader title="AI Analytics & Predictions" description="Smart insights powered by AI to optimize library operations" />
    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <LibCard key={s.label} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <s.icon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className={`text-xs ${s.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{s.change} vs last month</p>
            </div>
          </LibCard>
        ))}
      </div>

      {/* Predictions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">AI Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.map((p) => (
            <LibCard key={p.title} className="space-y-2">
              <div className="flex items-center gap-2">
                <p.icon className="h-4 w-4 text-accent" />
                <h4 className="text-sm font-medium text-foreground">{p.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full">
                  <div className="h-2 bg-accent rounded-full" style={{ width: `${p.confidence}%` }} />
                </div>
                <span className="text-xs font-medium text-foreground">{p.confidence}%</span>
              </div>
            </LibCard>
          ))}
        </div>
      </div>

      {/* Inventory */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Smart Inventory Alerts</h3>
        <LibCard>
          <div className="space-y-3">
            {inventoryAlerts.map((a) => (
              <div key={a.category} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.category}</p>
                  <p className="text-xs text-muted-foreground">{a.current} available / {a.needed} recommended</p>
                </div>
                <LibBadge variant={a.urgency === 'high' ? 'issued' : a.urgency === 'medium' ? 'default' : 'available'}>
                  {a.urgency} priority
                </LibBadge>
              </div>
            ))}
          </div>
        </LibCard>
      </div>
    </div>
  </div>
);

export default AIAnalytics;
