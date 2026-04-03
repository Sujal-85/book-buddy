import React, { useState } from 'react';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import LibTable from '@/components/ui/LibTable';
import LibButton from '@/components/ui/LibButton';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate } from '@/utils/helpers';
import type { Column } from '@/components/ui/LibTable';
import { useAuth } from '@/context/AuthContext';
import { useStudentBorrows, useRequestRenewal } from '@/hooks/useBorrow';
import { Loader2, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

interface MyBook {
  id: string;
  title: string;
  bookId: string;
  issueDate: string;
  dueDate: string;
  status: 'active' | 'overdue' | 'returned';
  renewalStatus?: 'pending' | 'approved' | 'rejected';
  fine: number;
}

const MyBooks: React.FC = () => {
  const { user } = useAuth();
  const { data: borrows = [], isLoading } = useStudentBorrows(user?.uid || '');
  const { mutate: requestRenewal, isPending: isRenewing } = useRequestRenewal();
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleRenew = (borrowId: string) => {
    setRequestingId(borrowId);
    requestRenewal(
      { borrowId, reason: 'Manual renewal request from user dashboard' },
      {
        onSettled: () => setRequestingId(null),
      }
    );
  };

  const columns: Column<MyBook>[] = [
    { key: 'title', header: 'Book Title' },
    { key: 'issueDate', header: 'Issue Date', render: (b) => formatDate(b.issueDate) },
    { key: 'dueDate', header: 'Due Date', render: (b) => formatDate(b.dueDate) },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <div className="flex flex-col gap-1">
          <LibBadge variant={b.status === 'active' ? 'issued' : b.status === 'overdue' ? 'overdue' : 'returned'}>
            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
          </LibBadge>
          {b.renewalStatus === 'pending' && (
            <span className="text-[10px] text-accent font-medium animate-pulse">Renewing...</span>
          )}
        </div>
      ),
    },
    {
      key: 'fine',
      header: 'Fine',
      render: (b) => b.fine > 0 ? <span className="text-destructive font-medium">₹{b.fine}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'id',
      header: 'Actions',
      render: (b) => (
        b.status === 'active' && b.renewalStatus !== 'pending' ? (
          <LibButton 
            variant="secondary" 
            size="sm" 
            onClick={() => handleRenew(b.id)}
            disabled={requestingId === b.id}
          >
            {requestingId === b.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CalendarClock className="h-3 w-3 mr-1" />}
            Renew
          </LibButton>
        ) : null
      ),
    },
  ];

  // Transform borrow data
  const myBooks: MyBook[] = borrows.map((b: any) => ({
    id: b.id,
    bookId: b.bookId,
    title: b.book?.title || 'Unknown Book',
    issueDate: b.issuedAt?.toDate?.() ? b.issuedAt.toDate().toISOString() : b.issuedAt,
    dueDate: b.dueDate,
    status: b.status,
    renewalStatus: b.renewalStatus,
    fine: b.fine || 0,
  }));

  const pendingRenewals = myBooks.filter(b => b.renewalStatus === 'pending');

  return (
    <div className="space-y-6">
      <PageHeader title="My Books" description="Track your borrowed books and manage renewals" />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LibCard className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Borrows</p>
            <p className="text-2xl font-bold text-foreground">{myBooks.filter(b => b.status === 'active').length}</p>
          </div>
        </LibCard>
        <LibCard className="p-4 flex items-center gap-4 border-destructive/20">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <Loader2 className="h-5 w-5 rotate-45" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{myBooks.filter(b => b.status === 'overdue').length}</p>
          </div>
        </LibCard>
        <LibCard className="p-4 flex items-center gap-4 border-accent/20">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pending Renewals</p>
            <p className="text-2xl font-bold text-accent">{pendingRenewals.length}</p>
          </div>
        </LibCard>
      </div>

      {/* Main Table */}
      <LibCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Current & Past Borrows</h2>
          <LibBadge variant="default">{myBooks.length} Total</LibBadge>
        </div>
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : (
          <LibTable 
            columns={columns} 
            data={myBooks} 
            keyExtractor={(b) => b.id} 
            emptyMessage="You haven't borrowed any books yet" 
          />
        )}
      </LibCard>
    </div>
  );
};

export default MyBooks;
