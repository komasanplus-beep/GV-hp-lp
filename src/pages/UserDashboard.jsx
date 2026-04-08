import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import PlanBanner from '@/components/plan/PlanBanner';
import UsagePanel from '@/components/plan/UsagePanel';
import { usePlan } from '@/components/plan/usePlan';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, Layout, Sparkles, Link2, Search, Settings, ArrowRight, FileText, Eye } from 'lucide-react';

const cards = [
  { name: 'サイト管理', desc: 'ホームページの作成・編集', icon: Globe, page: 'AdminSiteList', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { name: 'ページ管理', desc: 'ページとブロックの編集', icon: FileText, page: 'SitePageManager', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'LP管理', desc: 'ランディングページの作成・編集', icon: Layout, page: 'AdminLPList', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'AI生成', desc: 'AIでコンテンツを自動生成', icon: Sparkles, page: 'AdminAIGenerate', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { name: 'ドメイン設定', desc: '独自ドメイン・サブドメイン管理', icon: Link2, page: 'AdminDomainSettings', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { name: 'SEO設定', desc: '検索エンジン最適化の設定', icon: Search, page: 'SeoSettings', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { name: 'アカウント設定', desc: 'サイト・店舗情報の設定', icon: Settings, page: 'AdminSettings', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
];

export default function UserDashboard() {
  const { plan, usage, userPlanCode } = usePlan();

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-created_date', 5),
  });
  const { data: lps = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date', 5),
  });

  const publishedSites = sites.filter(s => s.status === 'published').length;
  const publishedLPs = lps.filter(lp => lp.status === 'published').length;

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="ダッシュボード">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Plan Banner */}
          <PlanBanner />

          {/* Usage Panel */}
          <UsagePanel plan={plan} usage={usage} userPlanCode={userPlanCode} />

          {/* Stats Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-1">ようこそ</h2>
            <p className="text-amber-100 text-sm mb-4">管理パネルからサービスを管理できます</p>
            <div className="flex flex-wrap gap-6">
              <div><p className="text-2xl font-bold">{sites.length}</p><p className="text-xs text-amber-200">サイト総数</p></div>
              <div><p className="text-2xl font-bold">{publishedSites}</p><p className="text-xs text-amber-200">公開中サイト</p></div>
              <div><p className="text-2xl font-bold">{lps.length}</p><p className="text-xs text-amber-200">LP総数</p></div>
              <div><p className="text-2xl font-bold">{publishedLPs}</p><p className="text-xs text-amber-200">公開中LP</p></div>
            </div>
          </div>

          {/* 機能カード */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">機能一覧</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cards.map((card) => (
                <Link
                  key={card.name}
                  to={createPageUrl(card.page)}
                  className={`border rounded-xl p-4 hover:shadow-md transition-all group ${card.color}`}
                >
                  <card.icon className="w-6 h-6 mb-2" />
                  <p className="font-semibold text-sm">{card.name}</p>
                  <p className="text-xs opacity-70 mt-0.5 leading-tight">{card.desc}</p>
                  <div className="flex justify-end mt-2">
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
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