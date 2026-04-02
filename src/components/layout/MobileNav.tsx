import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Library, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/student', label: 'Home', icon: Home },
  { to: '/student/books', label: 'Books', icon: BookOpen },
  { to: '/student/mybooks', label: 'My Books', icon: Library },
  { to: '/student/profile', label: 'Profile', icon: User },
];

const MobileNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex flex-col items-center gap-1 text-xs font-medium transition-colors',
                isActive ? 'text-accent' : 'text-muted-foreground'
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
