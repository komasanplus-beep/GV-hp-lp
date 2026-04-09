import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function UserDashboard() {
  const hasLoadedRef = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { data: bundleData, error: bundleError, isLoading: bundleLoading } = useQuery({
    queryKey: ['userDashboardBundle'],
    queryFn: async () => {
      console.log('[UserDashboard] Fetching bundle...');
      const res = await base44.functions.invoke('getUserDashboardBundle', {});
      console.log('[UserDashboard] Bundle loaded');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5分キャッシュ
    retry: 1,
    retryDelay: 1000,
    enabled: !hasLoadedRef.current,
  });

  const { data: unresolvedInquiries = [] } = useQuery({
    queryKey: ['unresolvedQA'],
    queryFn: () => base44.entities.Inquiry.filter({ category: 'system_support', status: 'new' }, '-created_date', 5),
    staleTime: 5 * 60 * 1000,
  });

  // 初回ロード完了を記録
  useEffect(() => {
    if (bundleData && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setIsInitialLoad(false);
      console.log('[UserDashboard] Initial load completed');
    }
  }, [bundleData]);

  const user = bundleData?.user;
  const subscription = bundleData?.subscription;
  const plan = bundleData?.plan;
  const usage = bundleData?.usage;
  const permissions = bundleData?.permissions;

  const siteName = user?.full_name || null;
  const title = siteName ? `${siteName} のダッシュボード` : 'ダッシュボード';

  // white screen prevent
  if (bundleLoading && isInitialLoad) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="ダッシュボード">
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title={title}>
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Error Banner */}
          {bundleError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-800">
                  ダッシュボード読み込みエラー
                </p>
                <p className="text-xs text-red-700 truncate">
                  {bundleError?.message || '不明なエラーが発生しました'}
                </p>
              </div>
            </div>
          )}

          {/* Unresolved Q&A Banner */}
          {unresolvedInquiries.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-orange-800">
                  未対応Q&A: {unresolvedInquiries.length}件
                </p>
                <p className="text-xs text-orange-700 truncate">
                  {unresolvedInquiries.slice(0, 2).map(i => i.subject).join('、')}
                </p>
              </div>
              <Link to="/AdminInquiryManager" className="text-orange-600 hover:text-orange-800 flex-shrink-0">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Dashboard KPI */}
          {bundleData && (
            <div className="space-y-5">
              {/* Plan Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-semibold">現在のプラン</p>
                    <p className="text-lg font-bold text-blue-900">{plan?.name || 'Free'}</p>
                  </div>
                  <div className="text-right text-xs text-blue-700 space-y-1">
                    <p>サイト: {usage?.site_count || 0} / {plan?.site_limit || 1}</p>
                    <p>LP: {usage?.lp_count || 0} / {plan?.lp_limit || 1}</p>
                    <p>AI: {usage?.ai_used_count || 0} / {plan?.ai_limit || 10}</p>
                  </div>
                </div>
              </div>

              {/* Create Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/AdminSiteList"
                  className={`p-4 rounded-lg border text-center transition-all ${
                    permissions?.can_create_site
                      ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <p className="text-sm font-semibold">サイト管理</p>
                  <p className="text-xs text-slate-500 mt-1">作成可能: {permissions?.can_create_site ? '○' : '✕'}</p>
                </Link>
                <Link
                  to="/AdminLPList"
                  className={`p-4 rounded-lg border text-center transition-all ${
                    permissions?.can_create_lp
                      ? 'bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <p className="text-sm font-semibold">LP管理</p>
                  <p className="text-xs text-slate-500 mt-1">作成可能: {permissions?.can_create_lp ? '○' : '✕'}</p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}