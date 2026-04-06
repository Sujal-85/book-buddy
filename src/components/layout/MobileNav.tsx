import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Library, User, Brain, Camera, Calculator, Wand2, LayoutDashboard, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const studentLinks = [
  { to: '/student', label: 'Home', icon: Home },
  { to: '/student/books', label: 'Books', icon: BookOpen },
  { to: '/student/recommendations', label: 'AI Match', icon: Brain },
  { to: '/student/mybooks', label: 'My Books', icon: Library },
  { to: '/student/profile', label: 'Profile', icon: User },
];

const adminLinks = [
  { to: '/admin', label: 'Home', icon: LayoutDashboard },
  { to: '/admin/books', label: 'Books', icon: BookOpen },
  { to: '/admin/analytics', label: 'AI Analytics', icon: Brain },
  { to: '/admin/predictive-availability', label: 'Forecasting', icon: TrendingUp },
  { to: '/admin/cataloging', label: 'AI Catalog', icon: Wand2 },
];

import { Menu } from 'lucide-react';
import { useUI } from '@/context/UIContext';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const { setMobileMenuOpen } = useUI();
  const isAdmin = location.pathname.startsWith('/admin');
  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-lg border-t border-border lg:hidden pb-safe mb-1">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex flex-col items-center gap-1 text-[10px] font-bold transition-all duration-300 min-w-[60px]',
                isActive ? 'text-accent scale-110' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive ? "bg-accent/10" : "bg-transparent"
              )}>
                <link.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className="uppercase tracking-tighter truncate w-full text-center">{link.label}</span>
            </Link>
          );
        })}
        
        {/* Menu/More Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground min-w-[60px]"
        >
          <div className="p-1.5 rounded-lg bg-transparent">
            <Menu className="h-5 w-5 stroke-[2px]" />
          </div>
          <span className="uppercase tracking-tighter truncate w-full text-center">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
