import React, { useEffect, useState } from 'react';
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
  Layout,
  BookOpen,
  Sparkles,
  FlaskConical,
  BarChart3,
  X,
  Store,
  ToggleLeft,
  Shield,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const userMenuItems = [
  { name: 'ダッシュボード', icon: LayoutDashboard, page: 'UserDashboard' },
  { name: 'LP管理', icon: Layout, page: 'AdminLPList' },
  { name: 'LP分析', icon: BarChart3, page: 'AdminLPAnalytics' },
  { name: 'LP AI生成', icon: Sparkles, page: 'AdminLPGenerate' },
  { name: 'ABテスト', icon: FlaskConical, page: 'AdminABTest' },
  { name: 'ブログ管理', icon: BookOpen, page: 'AdminBlog' },
  { name: 'サービス管理', icon: Briefcase, page: 'AdminRooms' },
  { name: '予約管理', icon: CalendarCheck, page: 'AdminBookings' },
  { name: 'ゲスト管理', icon: Users, page: 'AdminGuests' },
  { name: 'コンテンツ', icon: FileText, page: 'AdminContent' },
  { name: '設定', icon: Settings, page: 'AdminSettings' },
];

const masterMenuItems = [
  { name: 'ダッシュボード', icon: LayoutDashboard, page: 'MasterDashboard' },
  { name: 'Users', icon: Users, page: 'MasterUsers' },
  { name: 'UserFeatures', icon: ToggleLeft, page: 'MasterFeatureControl' },
  { name: 'UserLimits', icon: BarChart3, page: 'MasterFeatureControl' },
  { name: 'AISettings', icon: Settings, page: 'MasterAISettings' },
  { name: 'AIKnowledge', icon: BookOpen, page: 'MasterAIKnowledge' },
  { name: 'SystemLogs', icon: FileText, page: 'MasterSystemLogs' },
];

export default function UserSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [role, setRole] = useState(null);

  useEffect(() => {
    base44.auth.me().then(user => setRole(user?.role || 'user')).catch(() => setRole('user'));
  }, []);

  const isMaster = role === 'master';
  const menuItems = isMaster ? masterMenuItems : userMenuItems;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-64 z-50 transition-transform duration-300",
        isMaster ? "bg-violet-950" : "bg-slate-900",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn("p-5 border-b", isMaster ? "border-violet-800" : "border-slate-800")}>
            <div className="flex items-center justify-between">
              <Link to={createPageUrl(isMaster ? 'MasterDashboard' : 'UserDashboard')} className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", isMaster ? "bg-violet-600" : "bg-amber-600")}>
                  {isMaster ? <Shield className="w-5 h-5 text-white" /> : <Store className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h1 className="text-base font-semibold text-white">
                    {isMaster ? 'システム管理' : 'LP管理パネル'}
                  </h1>
                  <p className={cn("text-xs", isMaster ? "text-violet-400" : "text-slate-400")}>
                    {isMaster ? 'Master管理' : 'Userダッシュボード'}
                  </p>
                </div>
              </Link>
              <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
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
                          ? isMaster ? "bg-violet-600 text-white" : "bg-amber-600 text-white"
                          : isMaster ? "text-violet-300 hover:bg-violet-800 hover:text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
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

          {/* Footer */}
          <div className={cn("p-3 border-t", isMaster ? "border-violet-800" : "border-slate-800")}>
            <button
              onClick={() => base44.auth.logout()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-all text-sm",
                isMaster ? "text-violet-400 hover:bg-violet-800 hover:text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
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