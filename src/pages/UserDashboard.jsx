import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function UserDashboard() {
  const hasRequestedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Strict 認証状態の確定
  const { data: authUser, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return user;
    },
    staleTime: 60 * 1000, // 1分
    retry: 0, // 失敗時は再試行しない
  });

  // Dashboard bundle: 認証確定後かつ初回のみ取得
  const shouldFetchBundle = authUser?.id && !hasRequestedRef.current;

  const { data: bundleData, error: bundleError, isLoading: bundleLoading } = useQuery({
    queryKey: ['userDashboardBundle', authUser?.id],
    queryFn: async () => {
      console.log('[UserDashboard] Bundle fetch start');
      const res = await base44.functions.invoke('getUserDashboardBundle', {});
      console.log('[UserDashboard] Bundle fetch complete');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5分キャッシュ
    retry: 0, // 失敗時は再試行しない
    enabled: shouldFetchBundle,
  });

  // 未対応Q&A
  const { data: unresolvedInquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ['unresolvedQA'],
    queryFn: () => base44.entities.Inquiry.filter(
      { category: 'system_support', status: 'new' },
      '-created_date',
      5
    ),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  // 初回リクエスト完了フラグ設定（重複防止）
  useEffect(() => {
    if (shouldFetchBundle) {
      hasRequestedRef.current = true;
    }
  }, [shouldFetchBundle]);

  // 準備完了判定（ロード完了したら ready にする）
  useEffect(() => {
    if (!authLoading && authUser && bundleData && !hasRequestedRef.current === false) {
      setIsReady(true);
      // 非ブロッキング: ログ送信は後で（UI表示を阻害しない）
      sendDashboardViewLog().catch(e => console.warn('[UserDashboard] Log send error (ignored):', e.message));
    }
  }, [authUser, bundleData, authLoading]);

  // ログ送信は非ブロッキング（失敗してもUIに影響なし）
  const sendDashboardViewLog = async () => {
    try {
      if (!authUser?.id) return;
      const now = new Date();
      const minuteBucket = Math.floor(now.getTime() / 60000) * 60000;
      const requestKey = `${authUser.id}:dashboard_view:UserDashboard:${new Date(minuteBucket).toISOString()}`;
      
      await base44.functions.invoke('logUserEvent', {
        event_name: 'dashboard_view',
        page_name: 'UserDashboard',
        request_key: requestKey,
      }).catch(() => {}); // ログ失敗は完全に無視
    } catch {
      // 完全に無視
    }
  };

  const user = bundleData?.user;
  const plan = bundleData?.plan;
  const usage = bundleData?.usage;
  const permissions = bundleData?.permissions;

  const siteName = user?.full_name || null;
  const title = siteName ? `${siteName} のダッシュボード` : 'ダッシュボード';

  // 認証チェック
  if (!authLoading && authError) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="ダッシュボード">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">認証エラー</p>
              <p className="text-xs text-red-700 mt-1">{authError?.message || '認証に失敗しました'}</p>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  // 認証中
  if (authLoading) {
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

  // Bundle取得中
  if (shouldFetchBundle && bundleLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title={title}>
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  // Bundle取得失敗
  if (bundleError && !bundleData) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title={title}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">ダッシュボード読み込みエラー</p>
              <p className="text-xs text-red-700 mt-1">{bundleError?.message || '不明なエラーが発生しました'}</p>
            </div>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  // 通常表示
  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title={title}>
        <div className="max-w-6xl mx-auto space-y-3">
          {/* 未対応Q&A Banner */}
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