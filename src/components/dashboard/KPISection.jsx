import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import KPICard from './KPICard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Calendar, TrendingUp, Users, Sparkles, HardDrive,
  Loader2, BarChart3, ArrowRight, Globe, Layout,
} from 'lucide-react';

const ICON_MAP = {
  access: BarChart3,
  page_view: TrendingUp,
  reservation: Calendar,
  sales: TrendingUp,
  customers: Users,
  ai_usage: Sparkles,
  storage: HardDrive,
};

const COLOR_MAP = {
  access: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  page_view: 'bg-cyan-50 border-cyan-200 text-cyan-700',
  reservation: 'bg-blue-50 border-blue-200 text-blue-700',
  sales: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  customers: 'bg-purple-50 border-purple-200 text-purple-700',
  ai_usage: 'bg-amber-50 border-amber-200 text-amber-700',
  storage: 'bg-cyan-50 border-cyan-200 text-cyan-700',
};

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

  const ws = summary.welcome_summary || {};
  const aq = summary.analytics_quick_link || {};
  const kpis = summary.kpis || [];

  return (
    <div className="space-y-3">
      {/* ① ようこそバー — 横長1行 */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg px-4 py-2.5 text-white flex flex-wrap items-center gap-x-5 gap-y-1">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
          <span className="text-xs text-amber-100">サイト</span>
          <span className="text-sm font-bold">{ws.site_count ?? 0}</span>
          <span className="text-xs text-amber-200 ml-1">公開中 {ws.published_site_count ?? 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
          <span className="text-xs text-amber-100">LP</span>
          <span className="text-sm font-bold">{ws.lp_count ?? 0}</span>
          <span className="text-xs text-amber-200 ml-1">公開中 {ws.published_lp_count ?? 0}</span>
        </div>
        {ws.site_limit != null && (
          <span className="text-xs text-amber-200 hidden sm:inline">上限: サイト {ws.site_limit} / LP {ws.lp_limit}</span>
        )}
      </div>

      {/* ② アクセス分析 — 小型横長リンクカード */}
      <Link
        to={createPageUrl('AdminSiteAnalytics')}
        className="flex items-center justify-between bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg px-4 py-2.5 text-white group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <BarChart3 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">アクセス分析</span>
          {(aq.today_access != null) && (
            <span className="text-xs text-indigo-200 hidden sm:inline truncate">
              今日: {aq.today_access} アクセス / PV {aq.today_page_view}
            </span>
          )}
        </div>
        <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* ③ KPIグリッド — コンパクト */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.key}
            icon={ICON_MAP[kpi.key]}
            color={COLOR_MAP[kpi.key]}
            label={kpi.label}
            primaryValue={kpi.primary_value ?? 0}
            primaryUnit={kpi.primary_unit}
            secondaryLabel={kpi.secondary_label}
            secondaryValue={kpi.secondary_value}
            limitValue={kpi.limit_value}
            limitUnit={kpi.limit_unit}
            usageRate={kpi.usage_rate}
          />
        ))}
      </div>
    </div>
  );
}