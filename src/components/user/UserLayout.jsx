import React, { useState } from 'react';
import UserSidebar from './UserSidebar';
import { Menu } from 'lucide-react';
import OwnerAnnouncementBell from '@/components/announcements/OwnerAnnouncementBell';

export default function UserLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-slate-800 flex-1">{title}</h1>
          <OwnerAnnouncementBell />
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}