import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibTable from '@/components/ui/LibTable';
import PageHeader from '@/components/layout/PageHeader';
import aiBackend from '@/services/aiBackend';
import { formatDate, getDaysOverdue, calculateFine } from '@/utils/helpers';
import toast from 'react-hot-toast';
import type { Column } from '@/components/ui/LibTable';
import { borrowApi, settingsApi, notificationsApi } from '@/services/api';

interface OverdueRecord {
  id: string;
  studentId: string;
  studentName: string;
  bookTitle: string;
  dueDate: string;
}

const filters = ['All', '1–7 days', '7–30 days', '30+ days'];

const Overdue: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [overdueList, setOverdueList] = useState<OverdueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [finePerDay, setFinePerDay] = useState(5);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [{ data: overdueData }, { data: settings }] = await Promise.all([
        borrowApi.getOverdue(),
        settingsApi.get()
      ]);
      setOverdueList(overdueData as any);
      if (settings?.finePerDay) {
        setFinePerDay(Number(settings.finePerDay));
      }
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

  const handleRemind = async (record: OverdueRecord) => {
    setRemindingId(record.id);
    try {
      await notificationsApi.sendSingleReminder({
        studentId: record.studentId,
        bookTitle: record.bookTitle,
        dueDate: record.dueDate
      });
      
      toast.success(`Reminder & Email sent to ${record.studentName}`);
    } catch (err) {
      console.error('Remind error:', err);
      toast.error('Failed to send reminder');
    } finally {
      setRemindingId(null);
    }
  };

  const handleRemindAll = async () => {
    if (filtered.length === 0) return;
    
    setLoading(true);
    try {
      await Promise.all(filtered.slice(0, 5).map(r => handleRemind(r)));
      toast.success(`Bulk AI reminders dispatched to ${Math.min(filtered.length, 5)} students!`);
    } catch (err) {
      console.error('Bulk remind error:', err);
      toast.error('Failed to dispatch bulk reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleAISweep = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.scanOverdue();
      toast.success('AI Alert Sweep completed: System-wide alerts synced and emails sent');
      console.log('Sweep results:', response);
      await fetchInitialData(); // Refresh UI
    } catch (err) {
      console.error('AI Sweep error:', err);
      toast.error('AI Alert Sweep failed to complete');
    } finally {
      setLoading(false);
    }
  };

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
      render: (r) => <span className="text-destructive font-medium">₹{calculateFine(r.dueDate, finePerDay)}</span> 
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <LibButton 
          size="sm" 
          variant="secondary" 
          onClick={() => handleRemind(r)}
          loading={remindingId === r.id}
          disabled={!!remindingId}
        >
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
          <div className="flex gap-2">
            <LibButton 
              onClick={handleAISweep} 
              variant="ghost" 
              className="border border-accent text-accent hover:bg-accent/10"
              loading={loading && !overdueList.length}
              disabled={loading}
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> AI Alert Sweep
            </LibButton>
            <LibButton 
              onClick={handleRemindAll} 
              disabled={overdueList.length === 0 || loading}
              loading={loading && overdueList.length > 0}
            >
              <Send className="h-4 w-4 mr-2" /> Send All Reminders
            </LibButton>
          </div>
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
