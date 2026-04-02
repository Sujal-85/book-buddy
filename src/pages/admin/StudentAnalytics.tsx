import React from 'react';
import { Users, TrendingUp, BookOpen, Clock, Award, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';

const topReaders = [
  { name: 'Priya Sharma', dept: 'CSE', booksRead: 42, avgDays: 8, badge: '📚 Bookworm' },
  { name: 'Amit Kumar', dept: 'ECE', booksRead: 38, avgDays: 10, badge: '⭐ Star Reader' },
  { name: 'Sneha Desai', dept: 'IT', booksRead: 35, avgDays: 7, badge: '🏆 Champion' },
  { name: 'Rahul Patil', dept: 'Mech', booksRead: 28, avgDays: 12, badge: '📖 Avid Reader' },
  { name: 'Kavita Joshi', dept: 'Civil', booksRead: 25, avgDays: 9, badge: '🌟 Rising Star' },
];

const departmentStats = [
  { dept: 'Computer Science', activeMembers: 245, booksIssued: 1250, avgPerStudent: 5.1 },
  { dept: 'Electronics', activeMembers: 180, booksIssued: 720, avgPerStudent: 4.0 },
  { dept: 'Information Technology', activeMembers: 160, booksIssued: 640, avgPerStudent: 4.0 },
  { dept: 'Mechanical', activeMembers: 200, booksIssued: 600, avgPerStudent: 3.0 },
  { dept: 'Civil', activeMembers: 120, booksIssued: 360, avgPerStudent: 3.0 },
];

const insights = [
  { text: '2nd year students show 35% higher borrowing than 3rd year', type: 'info' },
  { text: 'Programming books are 3x more popular than other categories', type: 'info' },
  { text: '15% of members haven\'t borrowed in 60+ days — consider engagement campaigns', type: 'warning' },
  { text: 'Weekend returns are 40% lower — consider extending return deadlines', type: 'suggestion' },
];

const StudentAnalytics: React.FC = () => (
  <div className="h-full flex flex-col overflow-hidden">
    <PageHeader title="Student Behavior Analytics" description="Understand reading patterns and library usage trends" />
    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Active Users', value: '856', icon: Users, color: 'text-accent' },
          { label: 'Books Issued This Month', value: '1,247', icon: BookOpen, color: 'text-green-500' },
          { label: 'Avg Return Time', value: '9.3 days', icon: Clock, color: 'text-yellow-500' },
          { label: 'On-Time Returns', value: '87%', icon: TrendingUp, color: 'text-blue-500' },
        ].map((s) => (
          <LibCard key={s.label} className="flex items-center gap-3">
            <s.icon className={`h-8 w-8 ${s.color}`} />
            <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold text-foreground">{s.value}</p></div>
          </LibCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Readers */}
        <LibCard>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-accent" /> Top Readers</h3>
          <div className="space-y-3">
            {topReaders.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{r.name} <span className="text-xs text-muted-foreground">({r.dept})</span></p>
                  <p className="text-xs text-muted-foreground">{r.booksRead} books · Avg {r.avgDays} days</p>
                </div>
                <span className="text-sm">{r.badge}</span>
              </div>
            ))}
          </div>
        </LibCard>

        {/* Dept Stats */}
        <LibCard>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Department-wise Usage</h3>
          <div className="space-y-3">
            {departmentStats.map((d) => (
              <div key={d.dept} className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-foreground">{d.dept}</span><span className="text-muted-foreground">{d.booksIssued} books</span></div>
                <div className="h-2 bg-secondary rounded-full"><div className="h-2 bg-accent rounded-full" style={{ width: `${(d.booksIssued / 1250) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </LibCard>
      </div>

      {/* AI Insights */}
      <LibCard>
        <h3 className="text-sm font-semibold text-foreground mb-3">AI Insights</h3>
        <div className="space-y-2">
          {insights.map((ins) => (
            <div key={ins.text} className="flex items-start gap-2 p-2 rounded-lg bg-secondary">
              <span className="text-sm">{ins.type === 'warning' ? '⚠️' : ins.type === 'suggestion' ? '💡' : 'ℹ️'}</span>
              <p className="text-sm text-foreground">{ins.text}</p>
            </div>
          ))}
        </div>
      </LibCard>
    </div>
  </div>
);

export default StudentAnalytics;
