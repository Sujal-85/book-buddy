import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, BookOpen, Users, BookPlus, RotateCcw, AlertTriangle,
  Settings, Home, Library, History, User, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/books', label: 'Books', icon: BookOpen },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/issue', label: 'Issue Book', icon: BookPlus },
  { to: '/admin/return', label: 'Return Book', icon: RotateCcw },
  { to: '/admin/overdue', label: 'Overdue', icon: AlertTriangle },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const studentLinks = [
  { to: '/student', label: 'Home', icon: Home },
  { to: '/student/books', label: 'Browse Books', icon: BookOpen },
  { to: '/student/mybooks', label: 'My Books', icon: Library },
  { to: '/student/history', label: 'History', icon: History },
  { to: '/student/profile', label: 'Profile', icon: User },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border min-h-screen fixed left-0 top-0">
      <div className="px-6 py-5 border-b border-border">
        <Link to={user?.role === 'admin' ? '/admin' : '/student'} className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-accent" />
          <span className="text-lg font-semibold text-foreground">LibraryOS</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-accent dark:bg-accent/10 dark:text-accent'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground w-full mt-1 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
