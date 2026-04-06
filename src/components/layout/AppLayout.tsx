import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import { useAuth } from '@/context/AuthContext';

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
};

export default AppLayout;
