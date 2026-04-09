import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import KPICard from './KPICard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Calendar, TrendingUp, Users, Sparkles, HardDrive,
  Loader2, BarChart3, ArrowRight, Globe, Layout, MousePointerClick, Target, Percent,
} from 'lucide-react';

function SectionHeader({ title, linkLabel, linkTo }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</h3>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {linkLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default function KPISection() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getDashboardSummary', {});
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!summary) return null;

  const ss = summary.site_summary || {};
  const mas = summary.monthly_access_summary || {};
  const mrs = summary.monthly_result_summary || {};
  const mus = summary.monthly_usage_summary || {};
  const lp = summary.lp_kpi_summary || {};

  const lpCVRatePercent = lp.cv_rate != null
    ? `${(lp.cv_rate * 100).toFixed(1)}%`
    : '0%';

  return (
    <div className="space-y-5">

      {/* 現在の利用状況 — 上位見出し */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4">
          現在の利用状況
        </h2>

        {/* サイト概要バー（オレンジ） */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg px-4 py-3 text-white flex flex-wrap items-center gap-x-6 gap-y-1 mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
            <span className="text-xs text-amber-100">サイト</span>
            <span className="text-base font-bold">{ss.site_count ?? 0}</span>
            <span className="text-xs text-amber-200">公開中 {ss.published_site_count ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Layout className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
            <span className="text-xs text-amber-100">LP</span>
            <span className="text-base font-bold">{ss.lp_count ?? 0}</span>
            <span className="text-xs text-amber-200">公開中 {ss.published_lp_count ?? 0}</span>
          </div>
        </div>

        <div className="space-y-4">

          {/* 今月のアクセス分析 */}
          <div>
            <SectionHeader
              title="今月のアクセス分析"
              linkLabel="アクセス分析"
              linkTo={createPageUrl('AdminSiteAnalytics')}
            />
            <div className="grid grid-cols-2 gap-2 max-w-sm">
              <KPICard
                icon={BarChart3}
                color="bg-indigo-50 border-indigo-200 text-indigo-700"
                label="アクセス"
                primaryValue={mas.access_count ?? 0}
              />
              <KPICard
                icon={TrendingUp}
                color="bg-cyan-50 border-cyan-200 text-cyan-700"
                label="ページビュー"
                primaryValue={mas.page_view_count ?? 0}
              />
            </div>
          </div>

          {/* 今月の実績 */}
          <div>
            <SectionHeader title="今月の実績" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg">
              <KPICard
                icon={Calendar}
                color="bg-blue-50 border-blue-200 text-blue-700"
                label="予約送信"
                primaryValue={mrs.reservation_count ?? 0}
              />
              <KPICard
                icon={TrendingUp}
                color="bg-emerald-50 border-emerald-200 text-emerald-700"
                label="売上"
                primaryValue={mrs.sales_amount ?? 0}
                primaryUnit="円"
              />
              <KPICard
                icon={Users}
                color="bg-purple-50 border-purple-200 text-purple-700"
                label="顧客"
                primaryValue={mrs.customer_count ?? 0}
              />
            </div>
          </div>

          {/* 今月の利用状況 */}
          <div>
            <SectionHeader title="今月の利用状況" />
            <div className="grid grid-cols-2 gap-2 max-w-sm">
              <KPICard
                icon={Sparkles}
                color="bg-amber-50 border-amber-200 text-amber-700"
                label="AI生成"
                primaryValue={mus.ai_used ?? 0}
                limitValue={mus.ai_limit ?? 50}
                usageRate={mus.ai_usage_rate ?? 0}
              />
              <KPICard
                icon={HardDrive}
                color="bg-slate-50 border-slate-200 text-slate-700"
                label="ストレージ"
                primaryValue={mus.storage_used ?? 0}
                primaryUnit="MB"
                limitValue={mus.storage_limit ?? 1000}
                limitUnit="MB"
                usageRate={mus.storage_usage_rate ?? 0}
              />
            </div>
          </div>

        </div>
      </div>

      {/* LP分析サマリー */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <SectionHeader
          title="LP分析サマリー"
          linkLabel="詳細を見る"
          linkTo={createPageUrl('AdminLPAnalytics')}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <KPICard
            icon={TrendingUp}
            color="bg-indigo-50 border-indigo-200 text-indigo-700"
            label="ページビュー"
            primaryValue={lp.page_view_count ?? 0}
          />
          <KPICard
            icon={MousePointerClick}
            color="bg-cyan-50 border-cyan-200 text-cyan-700"
            label="CTAクリック"
            primaryValue={lp.cta_click_count ?? 0}
          />
          <KPICard
            icon={Target}
            color="bg-green-50 border-green-200 text-green-700"
            label="コンバージョン"
            primaryValue={lp.conversion_count ?? 0}
          />
          <KPICard
            icon={Percent}
            color="bg-purple-50 border-purple-200 text-purple-700"
            label="CV率"
            primaryValue={lpCVRatePercent}
          />
        </div>
      </div>

    </div>
  );
}