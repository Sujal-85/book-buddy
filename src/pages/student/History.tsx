import React from 'react';
import LibCard from '@/components/ui/LibCard';
import LibTable from '@/components/ui/LibTable';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate } from '@/utils/helpers';
import type { Column } from '@/components/ui/LibTable';
import { useAuth } from '@/context/AuthContext';
import { useStudentBorrows } from '@/hooks/useBorrow';
import { Loader2 } from 'lucide-react';

interface HistoryRecord {
  id: string;
  title: string;
  issueDate: string;
  returnDate: string;
  finePaid: number;
}

const columns: Column<HistoryRecord>[] = [
  { key: 'title', header: 'Book' },
  { key: 'issueDate', header: 'Issue Date', render: (r) => formatDate(r.issueDate) },
  { key: 'returnDate', header: 'Return Date', render: (r) => r.returnDate ? formatDate(r.returnDate) : '—' },
  {
    key: 'finePaid',
    header: 'Fine Paid',
    render: (r) => r.finePaid > 0 ? `₹${r.finePaid}` : '—',
  },
];

const BorrowHistory: React.FC = () => {
  const { user } = useAuth();
  const { data: borrows = [], isLoading } = useStudentBorrows(user?.uid || '');

  // Map Firestore data to table format
  const history: HistoryRecord[] = borrows.map((b: any) => ({
    id: b.id,
    title: b.book?.title || 'Unknown Book',
    issueDate: b.issuedAt?.toDate?.() ? b.issuedAt.toDate().toISOString() : b.issuedAt,
    returnDate: b.returnedAt?.toDate?.() ? b.returnedAt.toDate().toISOString() : b.returnedAt,
    finePaid: b.finePaid || 0,
  })).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Borrowing History" description="View your complete borrowing history" />
      <LibCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <LibTable 
              columns={columns} 
              data={history} 
              keyExtractor={(r) => r.id} 
              emptyMessage="No borrowing history yet" 
            />
          </div>
        )}
      </LibCard>
    </div>
  );
};

export default BorrowHistory;
