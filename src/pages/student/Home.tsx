import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, BookOpen } from 'lucide-react';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';
import LibButton from '@/components/ui/LibButton';

const activeBorrows = [
  { id: '1', title: 'Clean Code', dueDate: '2025-04-05', status: 'active' as const },
  { id: '2', title: 'Design Patterns', dueDate: '2025-04-03', status: 'overdue' as const },
];

const featuredBooks = [
  { id: '1', title: 'Introduction to Algorithms', author: 'Thomas Cormen', category: 'Computer Science', available: true },
  { id: '2', title: 'Artificial Intelligence', author: 'Stuart Russell', category: 'AI', available: true },
  { id: '3', title: 'Database Systems', author: 'Ramez Elmasri', category: 'Database', available: false },
  { id: '4', title: 'Computer Networks', author: 'Andrew Tanenbaum', category: 'Networking', available: true },
];

const StudentHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasDueSoon = activeBorrows.some((b) => {
    const due = new Date(b.dueDate);
    const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 2 && diff >= 0;
  });

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name || 'Student'}`} description="Your library dashboard" />

      {hasDueSoon && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <span className="text-sm text-foreground">You have books due soon! Please return them to avoid fines.</span>
        </div>
      )}

      {/* Active Borrows */}
      <h3 className="text-base font-semibold text-foreground mb-3">My Active Borrows</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {activeBorrows.map((b) => (
          <LibCard key={b.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-md"><BookOpen className="h-4 w-4 text-accent" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">{b.title}</p>
                <p className="text-xs text-muted-foreground">Due: {formatDate(b.dueDate)}</p>
              </div>
            </div>
            <LibBadge variant={b.status === 'overdue' ? 'overdue' : 'issued'}>{b.status}</LibBadge>
          </LibCard>
        ))}
      </div>

      {/* Featured Books */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">Featured Books</h3>
        <LibButton variant="ghost" size="sm" onClick={() => navigate('/student/books')}>Browse All</LibButton>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuredBooks.map((book) => (
          <LibCard key={book.id} className="space-y-3">
            <div className="h-32 bg-secondary rounded-md flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{book.title}</p>
              <p className="text-xs text-muted-foreground">{book.author}</p>
            </div>
            <div className="flex items-center justify-between">
              <LibBadge>{book.category}</LibBadge>
              <LibBadge variant={book.available ? 'available' : 'issued'}>
                {book.available ? 'Available' : 'Issued'}
              </LibBadge>
            </div>
            {book.available && <LibButton size="sm" className="w-full">Request Borrow</LibButton>}
          </LibCard>
        ))}
      </div>
    </div>
  );
};

export default StudentHome;
