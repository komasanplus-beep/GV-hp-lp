import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard, Settings, LogOut, Layout, Sparkles, X, Store,
  Link2, Globe, Shield, FileText, Search, ChevronDown,
  Calendar, Users, Rss, Image, TrendingUp, BookOpen,
  Layers, Building2, GitBranch, Eye
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const menuGroups = [
  {
    label: 'ダッシュボード',
    icon: LayoutDashboard,
    page: 'UserDashboard',
    single: true,
  },
  {
    label: 'サイト運用',
    icon: Store,
    children: [
      { name: '予約管理', icon: Calendar, page: 'AdminBookings' },
      { name: 'ゲスト管理', icon: Users, page: 'AdminGuests' },
      { name: 'コンテンツ管理', icon: FileText, page: 'AdminContent' },
      { name: 'ブログ管理', icon: BookOpen, page: 'AdminBlog' },
      { name: 'AIコンテンツ生成', icon: Sparkles, page: 'AdminAIGenerate' },
    ],
  },
  {
    label: 'サイト構築',
    icon: Globe,
    children: [
      { name: 'ページ管理', icon: Layout, page: 'SitePageManager' },
      { name: 'サービス管理', icon: Building2, page: 'AdminRooms' },
    ],
  },
  {
    label: 'LP構築',
    icon: Layers,
    children: [
      { name: 'LP管理', icon: FileText, page: 'AdminLPList' },
      { name: 'LP AI生成', icon: Sparkles, page: 'AdminLPGenerate' },
    ],
  },
  {
    label: 'LP改善',
    icon: TrendingUp,
    children: [
      { name: 'ABテスト', icon: GitBranch, page: 'AdminABTest' },
      { name: 'CV分析', icon: TrendingUp, page: 'AdminLPAnalytics' },
    ],
  },
  {
    label: '基本設定',
    icon: Settings,
    children: [
      { name: 'サイト設定', icon: Globe, page: 'AdminSiteList' },
      { name: 'ドメイン設定', icon: Link2, page: 'AdminDomainSettings' },
      { name: 'SEO設定', icon: Search, page: 'SeoSettings' },
      { name: 'アカウント設定', icon: Settings, page: 'AdminSettings' },
    ],
  },
];

function getInitialOpenGroups(pathname) {
  const open = new Set();
  menuGroups.forEach((group, idx) => {
    if (!group.single && group.children) {
      const hasActive = group.children.some(item => pathname.includes(item.page));
      if (hasActive) open.add(idx);
    }
  });
  return open;
}

// ページ名 → UserFeatures フィールド名（完全一致）
// null = 常時表示, undefined = マッピングなし（表示）
const PAGE_FEATURE_MAP = {
  UserDashboard: null,       // ダッシュボードは常時
  AdminContent: null,        // コンテンツ管理は常時
  AdminSettings: null,       // アカウント設定は常時
  AdminBlog: 'blog_manage',
  AdminAIGenerate: 'ai_generate',
  SitePageManager: 'site_manage',
  AdminRooms: 'site_manage',
  AdminSiteList: 'site_manage',
  AdminLPList: 'lp_manage',
  AdminLPGenerate: 'lp_manage',
  AdminABTest: 'lp_manage',
  AdminLPAnalytics: 'lp_manage',
  AdminDomainSettings: 'domain_manage',
  SeoSettings: 'seo_manage',
  AdminBookings: 'reservation_manage',
  AdminGuests: 'reservation_manage',
};

export default function UserSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [features, setFeatures] = useState({});
  const [openGroups, setOpenGroups] = useState(() => getInitialOpenGroups(location.pathname));

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      if (!user) return;
      setIsAdmin(user.role === 'admin' || user.role === 'master');
      // adminは全機能表示
      if (user.role === 'admin' || user.role === 'master') {
        setFeatures({ __all: true });
        return;
      }
      const featuresList = await base44.entities.UserFeatures.filter({ user_id: user.id }).catch(() => []);
      setFeatures(featuresList[0] || {});
    }).catch(() => {});
  }, []);

  const isFeatureEnabled = (pageName) => {
    if (features.__all) return true;
    const key = PAGE_FEATURE_MAP[pageName];
    if (key === null) return true; // 常時表示
    if (!key) return true; // マッピングなし=表示
    return !!features[key];
  };

  const toggleGroup = (idx) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-64 bg-slate-900 z-50 transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <Link to={createPageUrl('UserDashboard')} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-white">店舗管理</h1>
                  <p className="text-xs text-slate-400">管理パネル</p>
                </div>
              </Link>
              <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <ul className="space-y-1">
              {menuGroups.map((group, idx) => {
                // グループ内が全て非表示なら グループごと隠す
                if (!group.single) {
                  const visibleChildren = group.children.filter(item => isFeatureEnabled(item.page));
                  if (visibleChildren.length === 0) return null;
                }

                if (group.single) {
                  if (!isFeatureEnabled(group.page)) return null;
                  const isActive = location.pathname.includes(group.page);
                  return (
                    <li key={group.label}>
                      <Link
                        to={createPageUrl(group.page)}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                          isActive
                            ? "bg-amber-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <group.icon className="w-4 h-4 shrink-0" />
                        <span>{group.label}</span>
                      </Link>
                    </li>
                  );
                }

                const isOpen = openGroups.has(idx);
                const hasActive = group.children?.some(item => location.pathname.includes(item.page));

                return (
                  <li key={group.label}>
                    <button
                      onClick={() => toggleGroup(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                        hasActive
                          ? "text-amber-400"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <group.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isOpen ? "rotate-180" : ""
                      )} />
                    </button>

                    {isOpen && (
                      <ul className="mt-1 ml-3 pl-3 border-l border-slate-700 space-y-0.5">
                        {group.children.filter(item => isFeatureEnabled(item.page)).map(item => {
                          const isActive = location.pathname.includes(item.page);
                          return (
                            <li key={item.name}>
                              <Link
                                to={createPageUrl(item.page)}
                                onClick={onClose}
                                className={cn(
                                  "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm",
                                  isActive
                                    ? "bg-amber-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                              >
                                <item.icon className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 space-y-0.5">
            <Link
              to={createPageUrl('AdminSiteList')}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all text-sm"
            >
              <Eye className="w-4 h-4" />
              <span className="font-medium">サイト一覧・プレビュー</span>
            </Link>
            {isAdmin && (
              <Link
                to={createPageUrl('MasterDashboard')}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-violet-400 hover:bg-slate-800 hover:text-violet-300 rounded-lg transition-all text-sm"
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">管理者パネルへ</span>
              </Link>
            )}
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all text-sm"
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