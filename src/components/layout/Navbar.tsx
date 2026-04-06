import React, { useState } from 'react';
import { Bell, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import { Link, useLocation } from 'react-router-dom';
import { adminLinks, studentLinks } from '@/constants/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import famtLogo from '@/assets/famt-logo.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useUI } from '@/context/UIContext';

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { mobileMenuOpen, setMobileMenuOpen } = useUI();
  const [showNotifications, setShowNotifications] = useState(false);
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
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center p-0.5">
                  <img
                    src={famtLogo}
                    alt="FAMT Logo"
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div>
                  <span className="text-base font-black text-foreground tracking-tight">FAMT Library</span>
                  <p className="text-[10px] text-muted-foreground font-medium -mt-0.5 capitalize">{user?.role} Portal</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User badge */}
            <div className="px-4 py-3 border-b border-border/50 bg-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-sm font-black text-accent">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-accent text-accent-foreground shadow-sm shadow-accent/20'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <link.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-accent-foreground' : '')} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 py-3 border-t border-border">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors font-medium">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to log out? You will need to sign in again to access the portal.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => { logout(); setMobileMenuOpen(false); }} 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Log out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
