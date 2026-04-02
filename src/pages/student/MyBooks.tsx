import React from 'react';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import LibTable from '@/components/ui/LibTable';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate } from '@/utils/helpers';
import type { Column } from '@/components/ui/LibTable';

interface MyBook {
  id: string;
  title: string;
  issueDate: string;
  dueDate: string;
  status: 'active' | 'overdue' | 'returned';
  fine: number;
}

const myBooks: MyBook[] = [
  { id: '1', title: 'Clean Code', issueDate: '2025-03-28', dueDate: '2025-04-11', status: 'active', fine: 0 },
  { id: '2', title: 'Design Patterns', issueDate: '2025-03-10', dueDate: '2025-03-24', status: 'overdue', fine: 45 },
  { id: '3', title: 'The Pragmatic Programmer', issueDate: '2025-02-15', dueDate: '2025-03-01', status: 'returned', fine: 0 },
];

const pendingRequests = [
  { id: '4', title: 'Artificial Intelligence', requestedDate: '2025-04-01' },
];

const columns: Column<MyBook>[] = [
  { key: 'title', header: 'Book Title' },
  { key: 'issueDate', header: 'Issue Date', render: (b) => formatDate(b.issueDate) },
  { key: 'dueDate', header: 'Due Date', render: (b) => formatDate(b.dueDate) },
  {
    key: 'status',
    header: 'Status',
    render: (b) => (
      <LibBadge variant={b.status === 'active' ? 'issued' : b.status === 'overdue' ? 'overdue' : 'returned'}>
        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
      </LibBadge>
    ),
  },
  {
    key: 'fine',
    header: 'Fine',
    render: (b) => b.fine > 0 ? <span className="text-destructive font-medium">₹{b.fine}</span> : <span className="text-muted-foreground">—</span>,
  },
];

const MyBooks: React.FC = () => {
  return (
    <div>
      <PageHeader title="My Books" description="Track your borrowed books" />

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Pending Requests</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRequests.map((r) => (
              <LibCard key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">Requested: {formatDate(r.requestedDate)}</p>
                </div>
                <LibBadge variant="pending">Pending</LibBadge>
              </LibCard>
            ))}
          </div>
        </div>
      )}

      <LibCard className="p-0">
        <LibTable columns={columns} data={myBooks} keyExtractor={(b) => b.id} emptyMessage="You haven't borrowed any books yet" />
      </LibCard>
    </div>
  );
};

export default MyBooks;
