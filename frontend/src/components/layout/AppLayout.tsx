import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-3.5 py-4 pb-28 sm:px-6 sm:py-6 md:p-8 md:pb-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
