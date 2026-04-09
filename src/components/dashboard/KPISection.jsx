import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import KPICard from './KPICard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Calendar, TrendingUp, Users, Sparkles, HardDrive,
  Loader2, BarChart3, ArrowRight, Globe, Layout, MousePointerClick,
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
  storage: 'bg-slate-50 border-slate-200 text-slate-700',
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

  const ss = summary.site_summary || {};
  const an = summary.analytics || {};
  const kpis = summary.kpis || [];
  const lpa = summary.lp_analytics || {};

  return (
    <div className="space-y-3">

      {/* ① 上段: サイト概要(2/3) + アクセス分析(1/3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* サイト概要カード（オレンジ, 2/3幅） */}
        <div className="sm:col-span-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg px-4 py-3 text-white flex flex-wrap items-center gap-x-6 gap-y-1">
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

        {/* アクセス分析カード（紫, 1/3幅） */}
        <Link
          to={createPageUrl('AdminSiteAnalytics')}
          className="sm:col-span-1 flex items-center justify-between bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg px-4 py-3 text-white group"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-sm font-semibold">アクセス分析</span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5 truncate">
              今日: {an.today_access ?? 0} / PV {an.today_pv ?? 0}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform ml-2" />
        </Link>
      </div>

      {/* ② KPIグリッド — コンパクト */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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

      {/* ③ LP分析サマリー */}
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <span className="text-xs text-slate-500">CV数</span>
            <span className="text-base font-bold text-slate-800">{lpa.cv_count ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">CV率</span>
            <span className="text-base font-bold text-slate-800">
              {lpa.cv_rate != null ? `${(lpa.cv_rate * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">アクセス</span>
            <span className="text-base font-bold text-slate-800">{lpa.access ?? 0}</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">LP分析</span>
        </div>
        <Link
          to={createPageUrl('AdminLPAnalytics')}
          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium flex-shrink-0 ml-4"
        >
          詳細を見る <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

    </div>
  );
}