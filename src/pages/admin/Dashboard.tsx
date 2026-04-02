import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, AlertTriangle, BookPlus, ArrowUpRight, Library, UserPlus } from 'lucide-react';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import LibTable from '@/components/ui/LibTable';
import PageHeader from '@/components/layout/PageHeader';
import { StatSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/helpers';
import type { Column } from '@/components/ui/LibTable';

// Demo data
const stats = [
  { label: 'Total Books', value: '2,847', trend: '+12 this month', icon: BookOpen, color: 'text-accent' },
  { label: 'Books Issued', value: '384', trend: '+28 this week', icon: Library, color: 'text-blue-600' },
  { label: 'Total Members', value: '1,293', trend: '+45 this month', icon: Users, color: 'text-success' },
  { label: 'Overdue Books', value: '23', trend: '5 critical', icon: AlertTriangle, color: 'text-destructive' },
];

interface RecentIssue {
  id: string;
  bookName: string;
  student: string;
  issueDate: string;
  dueDate: string;
  status: string;
}

const recentIssues: RecentIssue[] = [
  { id: '1', bookName: 'Clean Code', student: 'Alice Johnson', issueDate: '2025-03-28', dueDate: '2025-04-11', status: 'active' },
  { id: '2', bookName: 'Design Patterns', student: 'Bob Smith', issueDate: '2025-03-25', dueDate: '2025-04-08', status: 'active' },
  { id: '3', bookName: 'The Pragmatic Programmer', student: 'Carol White', issueDate: '2025-03-15', dueDate: '2025-03-29', status: 'overdue' },
  { id: '4', bookName: 'Refactoring', student: 'Dan Brown', issueDate: '2025-03-20', dueDate: '2025-04-03', status: 'active' },
  { id: '5', bookName: 'Domain-Driven Design', student: 'Eve Davis', issueDate: '2025-03-10', dueDate: '2025-03-24', status: 'overdue' },
];

const columns: Column<RecentIssue>[] = [
  { key: 'bookName', header: 'Book Name' },
  { key: 'student', header: 'Student' },
  { key: 'issueDate', header: 'Issue Date', render: (item) => formatDate(item.issueDate) },
  { key: 'dueDate', header: 'Due Date', render: (item) => formatDate(item.dueDate) },
  {
    key: 'status',
    header: 'Status',
    render: (item) => (
      <LibBadge variant={item.status === 'overdue' ? 'overdue' : 'issued'}>
        {item.status === 'overdue' ? 'Overdue' : 'Active'}
      </LibBadge>
    ),
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of library activity" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <LibCard key={stat.label} className="flex items-start gap-4">
            <div className={`p-2 rounded-md bg-secondary ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </div>
          </LibCard>
        ))}
      </div>

      {/* Overdue alert */}
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-sm font-medium text-foreground">23 books are overdue</span>
        </div>
        <LibButton variant="ghost" size="sm" onClick={() => navigate('/admin/overdue')}>
          View All <ArrowUpRight className="h-3 w-3 ml-1" />
        </LibButton>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <LibButton onClick={() => navigate('/admin/books')}>
          <BookPlus className="h-4 w-4 mr-2" /> Add Book
        </LibButton>
        <LibButton variant="secondary" onClick={() => navigate('/admin/members')}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Member
        </LibButton>
        <LibButton variant="secondary" onClick={() => navigate('/admin/issue')}>
          <BookOpen className="h-4 w-4 mr-2" /> Issue Book
        </LibButton>
      </div>

      {/* Recent Issues */}
      <LibCard>
        <h3 className="text-base font-semibold text-foreground mb-4">Recent Issues</h3>
        <LibTable columns={columns} data={recentIssues} keyExtractor={(item) => item.id} />
      </LibCard>
    </div>
  );
};

export default AdminDashboard;
