import React, { useState } from 'react';
import MasterSidebar from './MasterSidebar';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Menu } from 'lucide-react';

export default function MasterLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute requiredRole="master">
    <div className="min-h-screen bg-slate-50">
      <MasterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-slate-800">{title}</h1>
          {window.__masterSelectedUser && (
            <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              編集中: {window.__masterSelectedUser.full_name || window.__masterSelectedUser.email}
            </span>
          )}
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
    </ProtectedRoute>
  );
}