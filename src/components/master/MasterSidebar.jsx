import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users, ToggleLeft, Settings, BookOpen, FileText,
  Shield, X, LogOut, Store, ChevronDown, LayoutTemplate,
  CreditCard, Globe, Layout, Layers
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
      { name: 'サブスクリプション', icon: CreditCard, page: 'MasterPlans' },
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
    label: 'プラン・課金',
    items: [
      { name: 'プラン管理', icon: CreditCard, page: 'MasterPlans' },
      { name: 'ユーザープラン', icon: Users, page: 'MasterUserPlans' },
    ],
  },
  {
    label: 'コンテンツ管理',
    items: [
      { name: 'サイト一覧', icon: Layout, page: 'MasterSiteList' },
      { name: 'LP一覧', icon: Layers, page: 'MasterLPList' },
      { name: 'ドメイン一覧', icon: Globe, page: 'MasterDomainList' },
      { name: 'テンプレート管理', icon: LayoutTemplate, page: 'MasterTemplates' },
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

// ユーザー切り替えコンテキスト
export const MasterUserContext = React.createContext({ selectedUserId: null, selectedUser: null });

export default function MasterSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    base44.entities.User.list().then(setUsers).catch(() => {});
  }, []);

  const selectedUser = users.find(u => u.id === selectedUserId) || null;

  // グローバルに選択ユーザーを保存
  useEffect(() => {
    if (selectedUserId) {
      window.__masterSelectedUserId = selectedUserId;
      window.__masterSelectedUser = selectedUser;
    } else {
      window.__masterSelectedUserId = null;
      window.__masterSelectedUser = null;
    }
  }, [selectedUserId, selectedUser]);

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

          {/* ユーザー切り替え */}
          <div className="px-3 py-2 border-b border-violet-800">
            <p className="text-xs text-violet-500 mb-1 font-semibold">編集対象ユーザー</p>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(v => !v)}
                className="w-full flex items-center justify-between bg-violet-900 hover:bg-violet-800 text-violet-100 text-xs rounded-lg px-3 py-2 transition-all"
              >
                <span className="truncate">
                  {selectedUser ? selectedUser.full_name || selectedUser.email : '— 全体表示 —'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-1" />
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-violet-900 border border-violet-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedUserId(''); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-violet-300 hover:bg-violet-800"
                  >
                    — 全体表示 —
                  </button>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUserId(u.id); setShowDropdown(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs hover:bg-violet-800",
                        selectedUserId === u.id ? "text-white bg-violet-700" : "text-violet-300"
                      )}
                    >
                      <div className="font-medium">{u.full_name || u.email}</div>
                      <div className="text-violet-500 text-[10px]">{u.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-4">
              {menuGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider px-3 mb-1">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
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
                </div>
              ))}
            </div>
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