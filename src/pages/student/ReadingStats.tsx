import React from 'react';
import { BarChart3, BookOpen, Clock, TrendingUp, Calendar } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';

const monthlyData = [
  { month: 'Oct', books: 3 }, { month: 'Nov', books: 5 }, { month: 'Dec', books: 2 },
  { month: 'Jan', books: 4 }, { month: 'Feb', books: 6 }, { month: 'Mar', books: 4 },
];
const maxBooks = Math.max(...monthlyData.map((m) => m.books));

const categoryBreakdown = [
  { category: 'Programming', count: 12, pct: 40 },
  { category: 'Computer Science', count: 8, pct: 27 },
  { category: 'AI & ML', count: 5, pct: 17 },
  { category: 'Database', count: 3, pct: 10 },
  { category: 'Other', count: 2, pct: 6 },
];

const ReadingStats: React.FC = () => (
  <div className="h-full flex flex-col overflow-hidden">
    <PageHeader title="Reading Statistics" description="Track your reading progress and patterns" />
    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Books Read', value: '28', icon: BookOpen, color: 'text-accent' },
          { label: 'Avg Read Time', value: '9 days', icon: Clock, color: 'text-green-500' },
          { label: 'On-Time Returns', value: '92%', icon: TrendingUp, color: 'text-blue-500' },
          { label: 'Current Streak', value: '12 days', icon: Calendar, color: 'text-orange-500' },
        ].map((s) => (
          <LibCard key={s.label} className="text-center space-y-1">
            <s.icon className={`h-6 w-6 ${s.color} mx-auto`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </LibCard>
        ))}
      </div>

      {/* Monthly Chart */}
      <LibCard>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Monthly Reading</h3>
        <div className="flex items-end gap-3 h-40">
          {monthlyData.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-foreground">{m.books}</span>
              <div className="w-full bg-accent/20 rounded-t-md relative" style={{ height: `${(m.books / maxBooks) * 100}%` }}>
                <div className="absolute inset-0 bg-accent rounded-t-md" />
              </div>
              <span className="text-xs text-muted-foreground">{m.month}</span>
            </div>
          ))}
        </div>
      </LibCard>

      {/* Category Breakdown */}
      <LibCard>
        <h3 className="text-sm font-semibold text-foreground mb-3">Categories Read</h3>
        <div className="space-y-3">
          {categoryBreakdown.map((c) => (
            <div key={c.category} className="space-y-1">
              <div className="flex justify-between text-sm"><span className="text-foreground">{c.category}</span><span className="text-muted-foreground">{c.count} books ({c.pct}%)</span></div>
              <div className="h-2 bg-secondary rounded-full"><div className="h-2 bg-accent rounded-full" style={{ width: `${c.pct}%` }} /></div>
            </div>
          ))}
        </div>
      </LibCard>

      {/* Reading Rank */}
      <LibCard className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Your Reading Rank</p>
        <p className="text-4xl font-bold text-accent">#12</p>
        <p className="text-xs text-muted-foreground">out of 856 active library members</p>
        <p className="text-sm text-foreground">🏆 Top 2% reader in your department!</p>
      </LibCard>
    </div>
  </div>
);

export default ReadingStats;
