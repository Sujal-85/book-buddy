import React, { useState, useEffect } from 'react';
import { Search, DollarSign, RotateCcw } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibTable from '@/components/ui/LibTable';
import { ConfirmDialog } from '@/components/ui/Modal';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate, calculateFine } from '@/utils/helpers';
import toast from 'react-hot-toast';
import type { Column } from '@/components/ui/LibTable';
import { borrowApi } from '@/services/api';

interface BorrowRecord {
  id: string;
  studentId: string;
  bookId: string;
  studentName: string;
  bookTitle: string;
  issuedAt: any;
  dueDate: string;
}

const ReturnBook: React.FC = () => {
  const [search, setSearch] = useState('');
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmReturn, setConfirmReturn] = useState<BorrowRecord | null>(null);

  useEffect(() => {
    fetchBorrows();
  }, []);

  const fetchBorrows = async () => {
    try {
      setLoading(true);
      const { data } = await borrowApi.getActive();
      setBorrows(data as any);
    } catch (error) {
      toast.error('Failed to fetch records');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (borrow: BorrowRecord) => {
    try {
      await borrowApi.returnBook(borrow.id, borrow.bookId);
      toast.success(`"${borrow.bookTitle}" returned successfully`);
      setBorrows(prev => prev.filter(b => b.id !== borrow.id));
      setConfirmReturn(null);
    } catch (error) {
      toast.error('Failed to process return');
      console.error(error);
    }
  };

  const filtered = borrows.filter((r) =>
    r.studentName.toLowerCase().includes(search.toLowerCase()) || 
    r.bookTitle.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<BorrowRecord>[] = [
    { key: 'studentName', header: 'Student' },
    { key: 'bookTitle', header: 'Book' },
    { 
      key: 'issuedAt', 
      header: 'Issue Date', 
      render: (r) => {
        // Handle Firestore Timestamp or String
        const date = r.issuedAt?.toDate ? r.issuedAt.toDate() : r.issuedAt;
        return formatDate(date);
      }
    },
    { key: 'dueDate', header: 'Due Date', render: (r) => formatDate(r.dueDate) },
    {
      key: 'fine',
      header: 'Fine',
      render: (r) => {
        const fine = calculateFine(r.dueDate);
        return fine > 0 ? (
          <span className="text-destructive font-medium">₹{fine}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => {
        const fine = calculateFine(r.dueDate);
        return (
          <div className="flex gap-2">
            {fine > 0 && (
              <LibButton size="sm" variant="success" onClick={() => toast.success('Fine marked as paid')}>
                <DollarSign className="h-3 w-3 mr-1" /> Paid
              </LibButton>
            )}
            <LibButton size="sm" onClick={() => setConfirmReturn(r)}>
              <RotateCcw className="h-3 w-3 mr-1" /> Return
            </LibButton>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Return Book" description="Process book returns" />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search by student or book..." 
          className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
        />
      </div>

      <LibCard className="p-0 overflow-hidden">
        <LibTable 
          columns={columns} 
          data={filtered} 
          keyExtractor={(r) => r.id} 
          emptyMessage={loading ? "Fetching records..." : "No active borrows found"} 
        />
      </LibCard>

      <ConfirmDialog
        open={!!confirmReturn}
        onClose={() => setConfirmReturn(null)}
        onConfirm={() => confirmReturn && handleReturn(confirmReturn)}
        title="Confirm Return"
        message={`Return "${confirmReturn?.bookTitle}" from ${confirmReturn?.studentName}?${
          calculateFine(confirmReturn?.dueDate || '') > 0 
            ? ` Outstanding fine: ₹${calculateFine(confirmReturn?.dueDate || '')}` 
            : ''
        }`}
        confirmLabel="Mark as Returned"
      />
    </div>
  );
};

export default ReturnBook;
