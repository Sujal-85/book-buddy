import React, { useState } from 'react';
import { Search, DollarSign, RotateCcw } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import LibTable from '@/components/ui/LibTable';
import { ConfirmDialog } from '@/components/ui/Modal';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate, calculateFine, getDaysOverdue } from '@/utils/helpers';
import toast from 'react-hot-toast';
import type { Column } from '@/components/ui/LibTable';

interface BorrowRecord {
  id: string;
  studentName: string;
  bookTitle: string;
  issueDate: string;
  dueDate: string;
  fine: number;
  daysOverdue: number;
}

const demoRecords: BorrowRecord[] = [
  { id: '1', studentName: 'Alice Johnson', bookTitle: 'Clean Code', issueDate: '2025-03-01', dueDate: '2025-03-15', fine: calculateFine('2025-03-15'), daysOverdue: getDaysOverdue('2025-03-15') },
  { id: '2', studentName: 'Bob Smith', bookTitle: 'Design Patterns', issueDate: '2025-03-10', dueDate: '2025-03-24', fine: calculateFine('2025-03-24'), daysOverdue: getDaysOverdue('2025-03-24') },
  { id: '3', studentName: 'Carol White', bookTitle: 'Refactoring', issueDate: '2025-03-20', dueDate: '2025-04-05', fine: calculateFine('2025-04-05'), daysOverdue: getDaysOverdue('2025-04-05') },
];

const ReturnBook: React.FC = () => {
  const [search, setSearch] = useState('');
  const [confirmReturn, setConfirmReturn] = useState<BorrowRecord | null>(null);

  const filtered = demoRecords.filter((r) =>
    r.studentName.toLowerCase().includes(search.toLowerCase()) || r.bookTitle.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<BorrowRecord>[] = [
    { key: 'studentName', header: 'Student' },
    { key: 'bookTitle', header: 'Book' },
    { key: 'issueDate', header: 'Issue Date', render: (r) => formatDate(r.issueDate) },
    { key: 'dueDate', header: 'Due Date', render: (r) => formatDate(r.dueDate) },
    {
      key: 'fine',
      header: 'Fine',
      render: (r) => r.fine > 0 ? (
        <span className="text-destructive font-medium">₹{r.fine}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          {r.fine > 0 && (
            <LibButton size="sm" variant="success" onClick={() => toast.success('Fine marked as paid')}>
              <DollarSign className="h-3 w-3 mr-1" /> Paid
            </LibButton>
          )}
          <LibButton size="sm" onClick={() => setConfirmReturn(r)}>
            <RotateCcw className="h-3 w-3 mr-1" /> Return
          </LibButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Return Book" description="Process book returns" />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student or book..." className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <LibCard className="p-0">
        <LibTable columns={columns} data={filtered} keyExtractor={(r) => r.id} emptyMessage="No active borrows found" />
      </LibCard>

      <ConfirmDialog
        open={!!confirmReturn}
        onClose={() => setConfirmReturn(null)}
        onConfirm={() => {
          toast.success(`"${confirmReturn?.bookTitle}" returned successfully`);
          setConfirmReturn(null);
        }}
        title="Confirm Return"
        message={`Return "${confirmReturn?.bookTitle}" from ${confirmReturn?.studentName}?${confirmReturn?.fine ? ` Outstanding fine: ₹${confirmReturn.fine}` : ''}`}
        confirmLabel="Mark as Returned"
      />
    </div>
  );
};

export default ReturnBook;
