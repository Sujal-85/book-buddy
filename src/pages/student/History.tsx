import React from 'react';
import LibCard from '@/components/ui/LibCard';
import LibTable from '@/components/ui/LibTable';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate } from '@/utils/helpers';
import type { Column } from '@/components/ui/LibTable';

interface HistoryRecord {
  id: string;
  title: string;
  issueDate: string;
  returnDate: string;
  finePaid: number;
}

const history: HistoryRecord[] = [
  { id: '1', title: 'The Pragmatic Programmer', issueDate: '2025-02-15', returnDate: '2025-03-01', finePaid: 0 },
  { id: '2', title: 'Refactoring', issueDate: '2025-01-10', returnDate: '2025-01-28', finePaid: 20 },
  { id: '3', title: 'Clean Architecture', issueDate: '2024-12-01', returnDate: '2024-12-14', finePaid: 0 },
  { id: '4', title: 'Head First Design Patterns', issueDate: '2024-11-05', returnDate: '2024-11-25', finePaid: 15 },
];

const columns: Column<HistoryRecord>[] = [
  { key: 'title', header: 'Book' },
  { key: 'issueDate', header: 'Issue Date', render: (r) => formatDate(r.issueDate) },
  { key: 'returnDate', header: 'Return Date', render: (r) => formatDate(r.returnDate) },
  {
    key: 'finePaid',
    header: 'Fine Paid',
    render: (r) => r.finePaid > 0 ? `₹${r.finePaid}` : '—',
  },
];

const BorrowHistory: React.FC = () => {
  return (
    <div>
      <PageHeader title="Borrowing History" description="View your complete borrowing history" />
      <LibCard className="p-0">
        <LibTable columns={columns} data={history} keyExtractor={(r) => r.id} emptyMessage="No borrowing history yet" />
      </LibCard>
    </div>
  );
};

export default BorrowHistory;
