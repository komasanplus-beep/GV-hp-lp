import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import {
  Eye, MousePointerClick, Target, BarChart3, Loader2,
  ChevronDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import KPICard from '@/components/analytics/KPICard';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PERIODS = [
  { value: '1d', label: '今日' },
  { value: '7d', label: '直近7日' },
  { value: '30d', label: '直近30日' },
  { value: 'month', label: '月間' },
  { value: 'custom', label: '期間指定' },
];

export default function AdminSiteAnalytics() {
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const queryClient = useQueryClient();

  // Get all sites
  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-created_date'),
  });

  const selectedSite = selectedSiteId ? sites.find(s => s.id === selectedSiteId) : sites[0];

  // Get pages for selected site
  const { data: pages = [] } = useQuery({
    queryKey: ['sitePages', selectedSite?.id],
    queryFn: () => selectedSite?.id
      ? base44.entities.SitePage.filter({ site_id: selectedSite.id }, 'sort_order')
      : Promise.resolve([]),
    enabled: !!selectedSite?.id,
  });

  // Get analytics data via backend function
  const { data: analytics = {}, isLoading } = useQuery({
    queryKey: ['siteAnalytics', selectedSite?.id, period, fromDate, toDate],
    queryFn: async () => {
      if (!selectedSite?.id) return {};
      const params = new URLSearchParams({
        site_id: selectedSite.id,
        period,
      });
      if (period === 'custom' && fromDate && toDate) {
        params.set('from', fromDate);
        params.set('to', toDate);
      }
      const res = await base44.functions.invoke('getSiteAnalytics', { site_id: selectedSite.id, period, from: fromDate, to: toDate });
      return res.data || {};
    },
    enabled: !!selectedSite?.id,
  });

  const summary = analytics.summary || {};
  const pagesList = analytics.pages || [];
  const dailyData = analytics.daily || [];

  // Previous period comparison
  const getPreviousPeriodLabel = () => {
    switch (period) {
      case '1d': return '昨日';
      case '7d': return '前週';
      case '30d': return '前月';
      default: return '前期間';
    }
  };

  const getChangePercent = (current, previous) => {
    if (!previous) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="サイト・アクセス分析">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">アクセス分析</h2>
              <p className="text-sm text-slate-500 mt-1">ホームページのアクセス、訪問、予約アクションを追跡します</p>
            </div>
          </div>

          {/* Site & Period Selector */}
          <div className="flex flex-wrap gap-4 items-end bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">対象サイト</label>
              <Select value={selectedSite?.id || ''} onValueChange={setSelectedSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="サイトを選択" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">期間</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {period === 'custom' && (
              <>
                <div className="w-[180px]">
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">開始日</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div className="w-[180px]">
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">終了日</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {!selectedSite && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-8 text-center text-amber-800">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">サイトを選択してください</p>
              </CardContent>
            </Card>
          )}

          {selectedSite && (
            <>
              {/* KPI Cards */}
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">サマリー</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <KPICard
                    title="アクセス数"
                    value={(summary.access_count || 0).toLocaleString()}
                    icon={Eye}
                    color="blue"
                    comparison={summary.previous_access_count ? getChangePercent(summary.access_count, summary.previous_access_count) : null}
                    comparisonLabel={getPreviousPeriodLabel()}
                  />
                  <KPICard
                    title="PageView数"
                    value={(summary.page_view_count || 0).toLocaleString()}
                    icon={MousePointerClick}
                    color="amber"
                    comparison={summary.previous_page_view_count ? getChangePercent(summary.page_view_count, summary.previous_page_view_count) : null}
                    comparisonLabel={getPreviousPeriodLabel()}
                  />
                  <KPICard
                    title="予約送信アクション数"
                    value={(summary.booking_submit_count || 0).toLocaleString()}
                    icon={Target}
                    color="green"
                    comparison={summary.previous_booking_submit_count ? getChangePercent(summary.booking_submit_count, summary.previous_booking_submit_count) : null}
                    comparisonLabel={getPreviousPeriodLabel()}
                    description="フォーム送信・ボタンクリック・外部リンククリック"
                  />
                </div>
              </section>

              {/* Daily Trend */}
              {dailyData.length > 0 && (
                <section className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">日別推移</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="access_count"
                        stroke="#3b82f6"
                        name="アクセス数"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="page_view_count"
                        stroke="#f59e0b"
                        name="PV数"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="booking_submit_count"
                        stroke="#10b981"
                        name="予約送信"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </section>
              )}

              {/* Pages List */}
              {pagesList.length > 0 && (
                <section className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">ページ別アクセス</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">ページ</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">アクセス数</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">PV数</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">予約アクション</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagesList.map(page => (
                          <tr key={page.page_id} className="hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-slate-700">{page.page_title || page.page_path}</p>
                                <p className="text-xs text-slate-500">{page.page_path}</p>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 text-slate-600">{(page.access_count || 0).toLocaleString()}</td>
                            <td className="text-right py-3 px-4 text-slate-600">{(page.page_view_count || 0).toLocaleString()}</td>
                            <td className="text-right py-3 px-4 text-slate-600">{(page.booking_submit_count || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {isLoading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              )}
            </>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}