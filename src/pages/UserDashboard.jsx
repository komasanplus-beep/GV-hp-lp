import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import KPISection from '@/components/dashboard/KPISection';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, Layout, Sparkles, Link2, Search, Settings, ArrowRight, FileText, Eye, MessageSquare, AlertTriangle } from 'lucide-react';

const cards = [
  { name: 'サイト管理', desc: 'ホームページの作成・編集', icon: Globe, page: 'AdminSiteList', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { name: 'ページ管理', desc: 'ページとブロックの編集', icon: FileText, page: 'SitePageManager', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'LP管理', desc: 'ランディングページの作成・編集', icon: Layout, page: 'AdminLPList', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'AI生成', desc: 'AIでコンテンツを自動生成', icon: Sparkles, page: 'AdminAIGenerate', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { name: 'ドメイン設定', desc: '独自ドメイン・サブドメイン管理', icon: Link2, page: 'AdminDomainSettings', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { name: 'SEO設定', desc: '検索エンジン最適化の設定', icon: Search, page: 'SeoSettings', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
];

export default function UserDashboard() {
  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-created_date', 5),
  });
  const { data: lps = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date', 5),
  });

  const { data: unresolvedInquiries = [] } = useQuery({
    queryKey: ['unresolvedQA'],
    queryFn: () => base44.entities.Inquiry.filter({ category: 'system_support', status: 'new' }, '-created_date', 5),
  });

  const publishedSites = sites.filter(s => s.status === 'published').length;
  const publishedLPs = lps.filter(lp => lp.status === 'published').length;

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="ダッシュボード">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* KPI セクション */}
          <KPISection />

          {/* ようこそ エリア - コンパクト版 */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4">ようこそ</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-2">サイト</p>
                <p className="text-2xl font-bold">{sites.length}</p>
                <p className="text-sm text-amber-200 mt-1">上限: ∞</p>
              </div>
              <div>
                <p className="text-amber-100 text-sm font-medium mb-2">公開中サイト</p>
                <p className="text-2xl font-bold">{publishedSites}</p>
              </div>
              <div>
                <p className="text-amber-100 text-sm font-medium mb-2">LP</p>
                <p className="text-2xl font-bold">{lps.length}</p>
                <p className="text-sm text-amber-200 mt-1">上限: ∞</p>
              </div>
              <div>
                <p className="text-amber-100 text-sm font-medium mb-2">公開中LP</p>
                <p className="text-2xl font-bold">{publishedLPs}</p>
              </div>
            </div>
          </div>

          {/* 未対応Q&Aバナー（管理者のみ） */}
          {unresolvedInquiries.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-800">
                  未対応Q&A: {unresolvedInquiries.length}件
                </p>
                <div className="mt-1 space-y-0.5">
                  {unresolvedInquiries.slice(0, 3).map(inq => (
                    <p key={inq.id} className="text-xs text-orange-700">• {inq.subject}</p>
                  ))}
                </div>
              </div>
              <Link to="/AdminInquiryManager" className="text-orange-600 hover:text-orange-800">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}

          {/* 機能カード */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">機能一覧</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {cards.map((card) => (
                <Link
                  key={card.name}
                  to={createPageUrl(card.page)}
                  className={`border rounded-lg p-3 hover:shadow-md transition-all group ${card.color} text-center`}
                >
                  <card.icon className="w-5 h-5 mb-1.5 mx-auto" />
                  <p className="font-semibold text-xs">{card.name}</p>
                  <div className="flex justify-center mt-1">
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 最近のサイト */}
          {sites.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">最近のサイト</h3>
                <Link to={createPageUrl('AdminSiteList')} className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
                  すべて見る <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                {sites.slice(0, 3).map(site => (
                  <div key={site.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{site.site_name}</p>
                      <p className="text-xs text-slate-400">{site.business_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${site.status === 'published' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        {site.status === 'published' ? '公開中' : '下書き'}
                      </span>
                      <a href={`${createPageUrl('SiteView')}?site_id=${site.id}&preview=true`} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-emerald-600" title="プレビュー">
                        <Eye className="w-4 h-4" />
                      </a>
                      <Link to={`${createPageUrl('SitePageManager')}?site_id=${site.id}`} className="text-xs text-slate-400 hover:text-amber-600">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}