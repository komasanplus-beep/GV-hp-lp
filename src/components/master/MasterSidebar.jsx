import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users, ToggleLeft, BarChart2, Settings, BookOpen, FileText,
  Shield, X, LogOut, Store
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const menuGroups = [
  {
    label: 'マスターダッシュボード',
    items: [
      { name: 'ダッシュボード', icon: Shield, page: 'MasterDashboard' },
    ],
  },
  {
    label: 'ユーザー管理',
    items: [
      { name: 'ユーザー一覧', icon: Users, page: 'MasterUsers' },
      { name: '機能制御', icon: ToggleLeft, page: 'MasterFeatureControl' },
    ],
  },
  {
    label: 'AI設定',
    items: [
      { name: 'AI設定', icon: Settings, page: 'MasterAISettings' },
      { name: 'AIナレッジ', icon: BookOpen, page: 'MasterAIKnowledge' },
    ],
  },
  {
    label: 'システム',
    items: [
      { name: 'システムログ', icon: FileText, page: 'MasterSystemLogs' },
    ],
  },
];

export default function MasterSidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-64 bg-violet-950 z-50 transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-violet-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-white">システム管理</h1>
                  <p className="text-xs text-violet-400">Master管理</p>
                </div>
              </div>
              <button onClick={onClose} className="lg:hidden text-violet-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            <ul className="space-y-0.5">
              {menuItems.map((item) => {
                const isActive = location.pathname.includes(item.page);
                return (
                  <li key={item.name}>
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                        isActive
                          ? "bg-violet-600 text-white"
                          : "text-violet-300 hover:bg-violet-800 hover:text-white"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-3 border-t border-violet-800 space-y-0.5">
            <Link
              to={createPageUrl('UserDashboard')}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 text-violet-400 hover:bg-violet-800 hover:text-white rounded-lg transition-all text-sm"
            >
              <Store className="w-4 h-4" />
              <span className="font-medium">Userダッシュボードへ</span>
            </Link>
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-violet-400 hover:bg-violet-800 hover:text-white rounded-lg transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">ログアウト</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}