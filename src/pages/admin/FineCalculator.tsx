import React, { useState } from 'react';
import { Calculator, IndianRupee, Search, Clock } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';

const overdueBooks = [
  { id: '1', student: 'Rahul Patil', studentId: 'FAMT2023045', book: 'Clean Code', issuedOn: '2025-03-01', dueDate: '2025-03-15', daysOverdue: 17, fine: 85 },
  { id: '2', student: 'Priya Sharma', studentId: 'FAMT2023012', book: 'Design Patterns', issuedOn: '2025-02-20', dueDate: '2025-03-06', daysOverdue: 26, fine: 130 },
  { id: '3', student: 'Amit Kumar', studentId: 'FAMT2022089', book: 'Intro to Algorithms', issuedOn: '2025-03-10', dueDate: '2025-03-24', daysOverdue: 8, fine: 40 },
  { id: '4', student: 'Sneha Desai', studentId: 'FAMT2023067', book: 'Database Systems', issuedOn: '2025-02-15', dueDate: '2025-03-01', daysOverdue: 31, fine: 155 },
];

const fineRules = [
  { period: '1-7 days', rate: '₹5/day', description: 'Standard overdue fine' },
  { period: '8-14 days', rate: '₹7/day', description: 'Extended overdue fine' },
  { period: '15-30 days', rate: '₹10/day', description: 'Long overdue fine' },
  { period: '30+ days', rate: 'Book replacement cost', description: 'Lost book charge applies' },
];

const FineCalculator: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = overdueBooks.filter((b) => b.student.toLowerCase().includes(search.toLowerCase()) || b.studentId.toLowerCase().includes(search.toLowerCase()));
  const totalFines = filtered.reduce((sum, b) => sum + b.fine, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Automated Fine Calculator" description="AI-powered fine calculation with configurable rules" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LibCard className="flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-accent" />
            <div><p className="text-xs text-muted-foreground">Total Fines Pending</p><p className="text-xl font-bold text-foreground">₹{totalFines}</p></div>
          </LibCard>
          <LibCard className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-red-500" />
            <div><p className="text-xs text-muted-foreground">Overdue Books</p><p className="text-xl font-bold text-foreground">{overdueBooks.length}</p></div>
          </LibCard>
          <LibCard className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-green-500" />
            <div><p className="text-xs text-muted-foreground">Avg Fine Amount</p><p className="text-xl font-bold text-foreground">₹{Math.round(totalFines / overdueBooks.length)}</p></div>
          </LibCard>
        </div>

        {/* Fine Rules */}
        <LibCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">Fine Structure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fineRules.map((r) => (
              <div key={r.period} className="p-3 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground">{r.period}</p>
                <p className="text-sm font-bold text-foreground">{r.rate}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
              </div>
            ))}
          </div>
        </LibCard>

        {/* Search & List */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name or ID..." className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-3">
          {filtered.map((b) => (
            <LibCard key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{b.student} <span className="text-xs text-muted-foreground">({b.studentId})</span></p>
                <p className="text-xs text-muted-foreground">"{b.book}" — Due: {b.dueDate}</p>
              </div>
              <div className="flex items-center gap-3">
                <LibBadge variant="issued">{b.daysOverdue} days overdue</LibBadge>
                <p className="text-lg font-bold text-red-500">₹{b.fine}</p>
                <LibButton size="sm" variant="outline">Collect</LibButton>
              </div>
            </LibCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FineCalculator;
