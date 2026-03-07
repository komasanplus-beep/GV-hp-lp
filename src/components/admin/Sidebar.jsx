import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  Briefcase,
  CalendarCheck, 
  Users, 
  FileText, 
  Settings,
  LogOut,
  Hotel,
  X,
  Layout,
  BookOpen,
  Sparkles,
  FlaskConical,
  Shield
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'ダッシュボード', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'サービス管理', icon: Briefcase, page: 'AdminRooms' },
  { name: '予約管理', icon: CalendarCheck, page: 'AdminBookings' },
  { name: 'ゲスト管理', icon: Users, page: 'AdminGuests' },
  { name: 'コンテンツ', icon: FileText, page: 'AdminContent' },
  { name: 'LP管理', icon: Layout, page: 'AdminLPList' },
  { name: 'LP AI生成', icon: Sparkles, page: 'AdminLPGenerate' },
  { name: 'ABテスト', icon: FlaskConical, page: 'AdminABTest' },
  { name: 'ブログ管理', icon: BookOpen, page: 'AdminBlog' },
  { name: '設定', icon: Settings, page: 'AdminSettings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-72 bg-slate-900 z-50 transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <Link to={createPageUrl('Home')} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-medium text-white">店舗管理</h1>
                  <p className="text-xs text-slate-400">管理パネル</p>
                </div>
              </Link>
              <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
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
                          ? "bg-amber-600 text-white" 
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 space-y-1">
            <Link
              to={createPageUrl('MasterUsers')}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Master Panel</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">ログアウト</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}