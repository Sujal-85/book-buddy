import React, { useMemo } from 'react';
import { BarChart3, BookOpen, Clock, TrendingUp, Calendar, PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { goalsApi, borrowApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import LibBadge from '@/components/ui/LibBadge';

const ReadingStats: React.FC = () => {
  const { user } = useAuth();

  const { data: goalsData, isLoading: isGoalsLoading } = useQuery({
    queryKey: ['reading-goals', user?.uid],
    queryFn: () => goalsApi.getGoals(user?.uid || ''),
    enabled: !!user?.uid,
  });

  const { data: borrowData } = useQuery({
    queryKey: ['borrow-history', user?.uid],
    queryFn: () => borrowApi.getStudentBorrows(user?.uid || ''),
    enabled: !!user?.uid,
  });

  const history = borrowData?.data || [];
  const completedBooks = history.filter((b: any) => b.status === 'returned').length;

  // Dynamic monthly velocity based on history
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIdx = (currentMonth - i + 12) % 12;
      const monthName = months[monthIdx];
      const count = history.filter((b: any) => {
        const date = b.issuedAt?.toDate ? b.issuedAt.toDate() : new Date(b.issuedAt);
        return date.getMonth() === monthIdx;
      }).length;
      last6Months.push({ name: monthName, books: count });
    }
    return last6Months;
  }, [history]);

  // Dynamic category split
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((b: any) => {
      const cat = b.book?.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value: Math.round((value / history.length) * 100),
      color: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value).slice(0, 4);
  }, [history]);

  const stemFocus = useMemo(() => {
    const stemCats = ['Science', 'Technology', 'Engineering', 'Mathematics', 'Computer Science'];
    const stemCount = history.filter((b: any) => stemCats.includes(b.book?.category)).length;
    return history.length ? Math.round((stemCount / history.length) * 100) : 0;
  }, [history]);

  if (isGoalsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Reading Intelligence" description="Deep dive into your library usage and learning patterns" />
      
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-10">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard 
            label="Books Read" 
            value={completedBooks.toString()} 
            icon={BookOpen} 
            trend={history.length > 0 ? `+${Math.round((completedBooks / Math.max(history.length, 1)) * 100)}%` : '0%'} 
            color="text-accent" 
          />
          <MetricCard 
            label="Daily Avg" 
            value="45m" 
            icon={Clock} 
            trend="+5m" 
            color="text-emerald-500" 
          />
          <MetricCard 
            label="Completion" 
            value={`${history.length > 0 ? Math.round((completedBooks / history.length) * 100) : 0}%`} 
            icon={TrendingUp} 
            trend="+2%" 
            color="text-blue-500" 
          />
          <MetricCard 
            label="Genre Diversity" 
            value={new Set(history.map((b: any) => b.book?.category)).size.toString()} 
            icon={Calendar} 
            trend="Steady" 
            color="text-orange-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Activity Chart */}
          <LibCard className="lg:col-span-2 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                Monthly Velocity
              </h3>
              <select className="bg-background border border-border rounded-md text-[10px] font-bold px-2 py-1 outline-none">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorBooks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))'}} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderRadius: '12px', 
                      border: '1px solid hsl(var(--border))',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="books" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorBooks)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </LibCard>

          {/* Genre Pie Chart */}
          <LibCard className="p-6">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-8">
              <PieChartIcon className="h-4 w-4 text-accent" />
              Genre Split
            </h3>
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-foreground">{stemFocus}%</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase">STEM Focus</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{cat.name}</span>
                  </div>
                  <span className="text-xs font-black text-foreground">{cat.value}%</span>
                </div>
              ))}
            </div>
          </LibCard>
        </div>

        {/* Learning Journey Card */}
        <LibCard className="p-8 bg-gradient-to-br from-accent/5 to-transparent border-accent/10 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-4">You're a "Strategic Learner"</h3>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed mb-6">
              Based on your borrowing history, you tend to focus on deep technical knowledge with occasional breaks for literature. Your reading speed is 15% faster than last month.
            </p>
            <div className="flex flex-wrap gap-3">
              <LibBadge variant="issued">Tech Enthusiast</LibBadge>
              <LibBadge variant="default">Analytical Mind</LibBadge>
              <LibBadge variant="default">Consistency King</LibBadge>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-5">
            <TrendingUp className="h-64 w-64" />
          </div>
        </LibCard>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, trend, color }: any) => (
  <LibCard className="p-4 flex flex-col justify-between hover:border-accent/30 transition-all group">
    <div className="flex items-start justify-between">
      <div className={`p-2 rounded-xl ${color.replace('text', 'bg')}/10 group-hover:scale-110 transition-transform duration-500`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <span className={`text-[10px] font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-muted-foreground'}`}>{trend}</span>
    </div>
    <div className="mt-4">
      <div className="text-2xl font-black text-foreground tracking-tighter">{value}</div>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  </LibCard>
);

export default ReadingStats;
