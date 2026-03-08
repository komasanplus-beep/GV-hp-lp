import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Layout, BookOpen, Sparkles, Briefcase, FileText, Settings, FlaskConical, BarChart3, ArrowRight } from 'lucide-react';

const cards = [
  { name: 'LP管理', desc: 'ランディングページの作成・編集', icon: Layout, page: 'AdminLPList', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'LP分析', desc: 'PV・CV・AIスコア分析', icon: BarChart3, page: 'AdminLPAnalytics', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { name: 'LP AI生成', desc: 'AIでLPを自動生成', icon: Sparkles, page: 'AdminLPGenerate', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { name: 'ABテスト', desc: 'LPのABテストを管理', icon: FlaskConical, page: 'AdminABTest', color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { name: 'ブログ管理', desc: '記事の作成・カテゴリ管理', icon: BookOpen, page: 'AdminBlog', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'サービス管理', desc: 'サービス・客室の管理', icon: Briefcase, page: 'AdminRooms', color: 'bg-green-50 border-green-200 text-green-700' },
  { name: 'コンテンツ', desc: '画像・テキストコンテンツ', icon: FileText, page: 'AdminContent', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { name: '設定', desc: 'アカウント・サイト設定', icon: Settings, page: 'AdminSettings', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
];

export default function UserDashboard() {
  const { data: lps = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date', 5),
  });
  const { data: blogs = [] } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 5),
  });

  const publishedLPs = lps.filter(lp => lp.status === 'published').length;
  const publishedBlogs = blogs.filter(b => b.status === 'published').length;

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="ダッシュボード">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* ようこそ */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-1">ようこそ</h2>
            <p className="text-amber-100 text-sm">管理パネルからサービスを管理できます</p>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-2xl font-bold">{lps.length}</p>
                <p className="text-xs text-amber-200">LP総数</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedLPs}</p>
                <p className="text-xs text-amber-200">公開中LP</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{blogs.length}</p>
                <p className="text-xs text-amber-200">記事総数</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedBlogs}</p>
                <p className="text-xs text-amber-200">公開中記事</p>
              </div>
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

          {/* 最近のLP */}
          {lps.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">最近のLP</h3>
                <Link to={createPageUrl('AdminLPList')} className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
                  すべて見る <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {lps.slice(0, 3).map(lp => (
                  <div key={lp.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{lp.title}</p>
                      <p className="text-xs text-slate-400">/lp/{lp.slug}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${lp.status === 'published' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      {lp.status === 'published' ? '公開中' : '下書き'}
                    </span>
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