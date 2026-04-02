import React, { useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibTable from '@/components/ui/LibTable';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate, getDaysOverdue, calculateFine } from '@/utils/helpers';
import toast from 'react-hot-toast';
import type { Column } from '@/components/ui/LibTable';

interface OverdueRecord {
  id: string;
  studentName: string;
  bookTitle: string;
  dueDate: string;
  daysOverdue: number;
  fine: number;
}

const demoOverdue: OverdueRecord[] = [
  { id: '1', studentName: 'Carol White', bookTitle: 'The Pragmatic Programmer', dueDate: '2025-03-15', daysOverdue: getDaysOverdue('2025-03-15'), fine: calculateFine('2025-03-15') },
  { id: '2', studentName: 'Eve Davis', bookTitle: 'Domain-Driven Design', dueDate: '2025-03-10', daysOverdue: getDaysOverdue('2025-03-10'), fine: calculateFine('2025-03-10') },
  { id: '3', studentName: 'Frank Miller', bookTitle: 'Refactoring', dueDate: '2025-03-20', daysOverdue: getDaysOverdue('2025-03-20'), fine: calculateFine('2025-03-20') },
];

const filters = ['All', '1–7 days', '7–30 days', '30+ days'];

const Overdue: React.FC = () => {
  const [filter, setFilter] = useState('All');

  const filtered = demoOverdue.filter((r) => {
    if (filter === '1–7 days') return r.daysOverdue >= 1 && r.daysOverdue <= 7;
    if (filter === '7–30 days') return r.daysOverdue > 7 && r.daysOverdue <= 30;
    if (filter === '30+ days') return r.daysOverdue > 30;
    return true;
  });

  const columns: Column<OverdueRecord>[] = [
    { key: 'studentName', header: 'Student' },
    { key: 'bookTitle', header: 'Book' },
    { key: 'dueDate', header: 'Due Date', render: (r) => formatDate(r.dueDate) },
    { key: 'daysOverdue', header: 'Days Overdue', render: (r) => <span className="text-destructive font-medium">{r.daysOverdue}</span> },
    { key: 'fine', header: 'Fine', render: (r) => <span className="text-destructive font-medium">₹{r.fine}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <LibButton size="sm" variant="secondary" onClick={() => toast.success(`Reminder sent to ${r.studentName}`)}>
          <Send className="h-3 w-3 mr-1" /> Remind
        </LibButton>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Overdue Books"
        description="Track and manage overdue books"
        action={
          <LibButton onClick={() => toast.success('Bulk reminders sent!')}>
            <Send className="h-4 w-4 mr-2" /> Send All Reminders
          </LibButton>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <LibButton key={f} variant={filter === f ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(f)}>
            {f}
          </LibButton>
        ))}
      </div>

      <LibCard className="p-0">
        <LibTable columns={columns} data={filtered} keyExtractor={(r) => r.id} emptyMessage="No overdue books" />
      </LibCard>
    </div>
  );
};

export default Overdue;
