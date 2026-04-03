import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibTable from '@/components/ui/LibTable';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate, getDaysOverdue, calculateFine } from '@/utils/helpers';
import toast from 'react-hot-toast';
import type { Column } from '@/components/ui/LibTable';
import { borrowApi } from '@/services/api';

interface OverdueRecord {
  id: string;
  studentName: string;
  bookTitle: string;
  dueDate: string;
}

const filters = ['All', '1–7 days', '7–30 days', '30+ days'];

const Overdue: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [overdueList, setOverdueList] = useState<OverdueRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverdue();
  }, []);

  const fetchOverdue = async () => {
    try {
      setLoading(true);
      const { data } = await borrowApi.getOverdue();
      setOverdueList(data as any);
    } catch (error) {
      toast.error('Failed to load overdue records');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = overdueList.filter((r) => {
    const days = getDaysOverdue(r.dueDate);
    if (filter === '1–7 days') return days >= 1 && days <= 7;
    if (filter === '7–30 days') return days > 7 && days <= 30;
    if (filter === '30+ days') return days > 30;
    return true;
  });

  const columns: Column<OverdueRecord>[] = [
    { key: 'studentName', header: 'Student' },
    { key: 'bookTitle', header: 'Book' },
    { key: 'dueDate', header: 'Due Date', render: (r) => formatDate(r.dueDate) },
    { 
      key: 'daysOverdue', 
      header: 'Days Overdue', 
      render: (r) => <span className="text-destructive font-medium">{getDaysOverdue(r.dueDate)}</span> 
    },
    { 
      key: 'fine', 
      header: 'Fine', 
      render: (r) => <span className="text-destructive font-medium">₹{calculateFine(r.dueDate)}</span> 
    },
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
          <LibButton onClick={() => toast.success('Bulk reminders sent!')} disabled={overdueList.length === 0}>
            <Send className="h-4 w-4 mr-2" /> Send All Reminders
          </LibButton>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <LibButton 
            key={f} 
            variant={filter === f ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter(f)}
          >
            {f}
          </LibButton>
        ))}
      </div>

      <LibCard className="p-0 overflow-hidden">
        <LibTable 
          columns={columns} 
          data={filtered} 
          keyExtractor={(r) => r.id} 
          emptyMessage={loading ? "Checking for overdue books..." : "No overdue books found"} 
        />
      </LibCard>
    </div>
  );
};

export default Overdue;
