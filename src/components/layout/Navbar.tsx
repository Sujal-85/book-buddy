import React, { useState } from 'react';
import { Bell, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import { Link, useLocation } from 'react-router-dom';
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

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <>
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
        <button className="lg:hidden text-foreground" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
          </button>
        </div>
      </header>

      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-foreground/20" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="text-lg font-semibold text-foreground">LibraryOS</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-accent/10 dark:text-accent'
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
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-secondary w-full"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
