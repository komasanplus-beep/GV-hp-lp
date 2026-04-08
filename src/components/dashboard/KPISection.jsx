import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import KPICard from './KPICard';
import { Calendar, TrendingUp, Users, Sparkles, HardDrive, Loader2 } from 'lucide-react';

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
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!summary) return null;

  const kpis = [
    {
      label: '予約',
      value: summary.booking?.today || 0,
      subLabel: '今月',
      subValue: summary.booking?.monthly || 0,
      icon: Calendar,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      label: '売上',
      value: (summary.sales?.today || 0).toLocaleString(),
      unit: '円',
      subLabel: '今月',
      subValue: (summary.sales?.monthly || 0).toLocaleString() + '円',
      icon: TrendingUp,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    {
      label: '顧客',
      value: summary.guests?.total || 0,
      subLabel: '今月新規',
      subValue: summary.guests?.monthly_new || 0,
      icon: Users,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
    },
    {
      label: 'AI生成',
      value: summary.ai_usage?.used || 0,
      unit: `/ ${summary.ai_usage?.limit || 0}`,
      subLabel: '使用済み',
      subValue: `${Math.round(((summary.ai_usage?.used || 0) / (summary.ai_usage?.limit || 1)) * 100)}%`,
      icon: Sparkles,
      color: 'bg-amber-50 border-amber-200 text-amber-700',
    },
    {
      label: 'ストレージ',
      value: (summary.storage?.used || 0),
      unit: `MB / ${summary.storage?.limit || 0}MB`,
      subLabel: '使用済み',
      subValue: `${Math.round(((summary.storage?.used || 0) / (summary.storage?.limit || 1)) * 100)}%`,
      icon: HardDrive,
      color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, idx) => (
        <KPICard key={idx} {...kpi} />
      ))}
    </div>
  );
}