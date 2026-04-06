import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { adminLinks, studentLinks } from '@/constants/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import famtLogo from '@/assets/famt-logo.png';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen fixed left-0 top-0">
      <div className="px-6 py-5 flex-shrink-0 border-b border-border">
        <Link to={user?.role === 'admin' ? '/admin' : '/student'} className="flex items-center gap-3">
          <img 
            src={famtLogo} 
            alt="FAMT Logo" 
            className="h-10 w-auto object-contain"
          />
          <span className="text-lg font-bold text-foreground tracking-tight">FAMT Library</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="px-3 py-4 space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
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
      </ScrollArea>

      <div className="flex-shrink-0 px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground w-full mt-1 transition-colors">
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
              <AlertDialogAction onClick={logout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Log out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
};

export default Sidebar;
