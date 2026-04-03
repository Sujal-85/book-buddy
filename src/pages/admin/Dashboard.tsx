import React, { useState, useEffect } from 'react';
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
import { dashboardApi } from '@/services/api';
import toast from 'react-hot-toast';

interface RecentIssue {
  id: string;
  bookName: string;
  student: string;
  issuedAt: any;
  dueDate: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    booksIssued: 0,
    totalMembers: 0,
    overdueBooks: 0
  });
  const [recentIssues, setRecentIssues] = useState<RecentIssue[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, activityRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentIssues()
        ]);
        
        setStats(statsRes.data as any);
        setRecentIssues(activityRes.data as any);
      } catch (error: any) {
        toast.error('Failed to load dashboard data');
        console.error('[Dashboard Error]:', error);
        
        // Log more details if it's a Firestore error
        if (error.code) {
          console.error(`Error Code: ${error.code}`);
          console.error(`Error Message: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Books', value: stats.totalBooks, icon: BookOpen, color: 'text-accent' },
    { label: 'Books Issued', value: stats.booksIssued, icon: Library, color: 'text-blue-600' },
    { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'text-success' },
    { label: 'Overdue Books', value: stats.overdueBooks, icon: AlertTriangle, color: 'text-destructive' },
  ];

  const columns: Column<RecentIssue>[] = [
    { key: 'bookName', header: 'Book Name' },
    { key: 'student', header: 'Student' },
    { 
      key: 'issuedAt', 
      header: 'Issue Date', 
      render: (item) => formatDate(item.issuedAt?.toDate ? item.issuedAt.toDate() : item.issuedAt) 
    },
    { key: 'dueDate', header: 'Due Date', render: (item) => formatDate(item.dueDate) },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const isOverdue = new Date(item.dueDate) < new Date();
        return (
          <LibBadge variant={isOverdue ? 'overdue' : 'issued'}>
            {isOverdue ? 'Overdue' : 'Active'}
          </LibBadge>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of library activity" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          statCards.map((stat) => (
            <LibCard key={stat.label} className="flex items-start gap-4">
              <div className={`p-2 rounded-md bg-secondary ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </LibCard>
          ))
        )}
      </div>

      {/* Overdue alert */}
      {!loading && stats.overdueBooks > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-foreground">{stats.overdueBooks} books are currently overdue</span>
          </div>
          <LibButton variant="ghost" size="sm" onClick={() => navigate('/admin/overdue')}>
            View All <ArrowUpRight className="h-3 w-3 ml-1" />
          </LibButton>
        </div>
      )}

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
        <h3 className="text-base font-semibold text-foreground mb-4">Recent Library Activity</h3>
        <LibTable 
          columns={columns} 
          data={recentIssues} 
          keyExtractor={(item) => item.id} 
          emptyMessage={loading ? "Fetching activity..." : "No recent issues found"}
        />
      </LibCard>
    </div>
  );
};

export default AdminDashboard;
