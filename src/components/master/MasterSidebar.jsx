import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, ToggleLeft, BarChart2, Settings, BookOpen, FileText, Shield, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Users', icon: Users, page: 'MasterUsers' },
  { name: 'Feature Control', icon: ToggleLeft, page: 'MasterFeatureControl' },
  { name: 'Usage Limits', icon: BarChart2, page: 'MasterFeatureControl' },
  { name: 'AI Settings', icon: Settings, page: 'MasterAISettings' },
  { name: 'AI Knowledge', icon: BookOpen, page: 'MasterAIKnowledge' },
  { name: 'System Logs', icon: FileText, page: 'MasterSystemLogs' },
];

export default function MasterSidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-72 bg-violet-950 z-50 transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-violet-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-medium text-white">Master Panel</h1>
                  <p className="text-xs text-violet-400">SaaS管理者</p>
                </div>
              </div>
              <button onClick={onClose} className="lg:hidden text-violet-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname.includes(item.page);
                return (
                  <li key={item.name}>
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                        isActive
                          ? "bg-violet-600 text-white"
                          : "text-violet-300 hover:bg-violet-800 hover:text-white"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 pt-4 border-t border-violet-800">
              <Link
                to={createPageUrl('Dashboard')}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-violet-400 hover:bg-violet-800 hover:text-white transition-all"
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">管理パネルへ</span>
              </Link>
            </div>
          </nav>

          <div className="p-4 border-t border-violet-800">
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-4 py-3 w-full text-violet-400 hover:bg-violet-800 hover:text-white rounded-lg transition-all"
            >
              <span className="font-medium">ログアウト</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}