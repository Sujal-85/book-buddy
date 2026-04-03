import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, BookOpen } from 'lucide-react';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import PageHeader from '@/components/layout/PageHeader';
import { formatDate } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';
import LibButton from '@/components/ui/LibButton';
import { useBooks } from '@/hooks/useBooks';
import { useStudentBorrows } from '@/hooks/useBorrow';

const StudentHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: activeBorrows = [], isLoading: borrowsLoading } = useStudentBorrows(user?.uid || '');
  const { data: featuredBooks = [], isLoading: booksLoading } = useBooks({ limit: '4' });

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
      <div className="mb-10">
        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          My Active Borrows
        </h3>
        {borrowsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-secondary/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : activeBorrows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeBorrows.map((b: any) => (
              <LibCard key={b.id} className="flex items-center justify-between group hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center group-hover:bg-accent/10 transition-colors text-muted-foreground group-hover:text-accent">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{b.book?.title || 'Unknown Book'}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Due: {formatDate(b.dueDate)}</p>
                  </div>
                </div>
                <LibBadge variant={b.status === 'overdue' ? 'overdue' : 'issued'}>{b.status}</LibBadge>
              </LibCard>
            ))}
          </div>
        ) : (
          <LibCard className="py-8 text-center bg-secondary/5 border-2 border-dashed border-muted/20">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No active borrows</p>
            <p className="text-[10px] text-muted-foreground mt-1">Visit the library to issue your first book!</p>
          </LibCard>
        )}
      </div>

      {/* Featured Books */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Recommended for You</h3>
        <LibButton variant="ghost" size="sm" className="h-8 text-[10px]" onClick={() => navigate('/student/books')}>Browse All</LibButton>
      </div>

      {booksLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {[1, 2, 3, 4].map((i) => (
             <LibCard key={i} className="space-y-4 opacity-50 border-dashed">
                <div className="h-40 bg-secondary/50 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-secondary/50 rounded animate-pulse" />
                  <div className="h-2 w-1/2 bg-secondary/50 rounded animate-pulse" />
                </div>
             </LibCard>
           ))}
        </div>
      ) : featuredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredBooks.map((book: any) => (
            <LibCard key={book.id} className="space-y-4 group hover:border-accent/30 transition-all">
              <div className="h-40 bg-secondary rounded-lg flex items-center justify-center group-hover:bg-accent/5 transition-colors overflow-hidden">
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                  <BookOpen className="h-10 w-10 text-muted-foreground group-hover:text-accent group-hover:scale-110 transition-all" />
                )}
              </div>
              <div className="space-y-1 min-h-[3rem]">
                <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">{book.title}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{book.author}</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <LibBadge variant="default" className="text-[9px]">{book.category}</LibBadge>
                <LibBadge variant={book.available ? 'available' : 'issued'} className="text-[9px]">
                  {book.available ? 'Available' : 'Issued'}
                </LibBadge>
              </div>
              {book.available && (
                <LibButton 
                  size="sm" 
                  className="w-full h-8 text-[10px] uppercase font-bold"
                  onClick={() => navigate('/student/books')}
                >
                  View Details
                </LibButton>
              )}
            </LibCard>
          ))}
        </div>
      ) : (
        <LibCard className="py-12 text-center bg-secondary/5 border-2 border-dashed border-muted/20">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No books available yet</p>
          <p className="text-[10px] text-muted-foreground mt-1">Check back later for new arrivals.</p>
        </LibCard>
      )}
    </div>
  );
};

export default StudentHome;
