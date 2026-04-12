import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function UserDashboard() {
  const hasRequestedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId') || null;

  // Strict 認証状態の確定
  const { data: authUser, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return user;
    },
    staleTime: 60 * 1000,
    retry: 0,
  });

  // Dashboard bundle
  const prevTargetUserIdRef = useRef(targetUserId);
  if (prevTargetUserIdRef.current !== targetUserId) {
    prevTargetUserIdRef.current = targetUserId;
    hasRequestedRef.current = false;
  }

  const shouldFetchBundle = Boolean(authUser?.id) && !hasRequestedRef.current;

  const { data: bundleData, error: bundleError, isLoading: bundleLoading } = useQuery({
    queryKey: ['userDashboardBundle', targetUserId],
    queryFn: async () => {
      console.log('[UserDashboard] Bundle fetch start');
      const res = await base44.functions.invoke('getUserDashboardBundle', { user_id: targetUserId });
      console.log('[UserDashboard] Bundle fetch complete');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 0,
    enabled: shouldFetchBundle,
  });

  // 初回リクエスト完了フラグ設定
  useEffect(() => {
    if (shouldFetchBundle) {
      console.log('[UserDashboard] Mark bundle as requested');
      hasRequestedRef.current = true;
    }
  }, [authUser?.id]);

  // 準備完了判定
  useEffect(() => {
    if (bundleData && !authLoading && authUser) {
      setIsReady(true);
      console.log('[UserDashboard] Ready');
    }
  }, [bundleData]);

  const user = bundleData?.user;
  const plan = bundleData?.plan;
  const usage = bundleData?.usage;
  const unreadInquiries = bundleData?.dashboard?.unread_inquiries || 0;
  const todayBookings = bundleData?.dashboard?.today_bookings || 0;
  const analytics = bundleData?.analytics || [];
  const guests = bundleData?.guests || [];

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

  // 計算
  const siteTopAccess = analytics.filter(a => a.event_type === 'site_visit').length;
  const servicePageViews = analytics.filter(a => a.page_path?.startsWith('/service') && a.event_type === 'page_view').length;
  const blogPageViews = analytics.filter(a => a.page_path?.startsWith('/blog') && a.event_type === 'page_view').length;
  const guestCount = guests.length;

  // 通常表示
  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title={title}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ① 今日の概要（3列グリッド） */}
          <div className="grid grid-cols-3 gap-4">
            {/* サイトTOPアクセス */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-2">サイトTOPアクセス（今月）</p>
              <p className="text-3xl font-bold text-slate-800">{siteTopAccess}</p>
              <p className="text-xs text-slate-400 mt-1">件</p>
            </div>

            {/* 本日の予約数 */}
            <div className={`rounded-lg border p-4 ${
              todayBookings > 0 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-white border-slate-200'
            }`}>
              <p className="text-xs text-slate-500 mb-2">本日の予約数</p>
              <p className={`text-3xl font-bold ${
                todayBookings > 0 ? 'text-orange-600' : 'text-slate-800'
              }`}>{todayBookings}</p>
              <p className="text-xs text-slate-400 mt-1">件</p>
            </div>

            {/* 未読の問い合わせ */}
            <div className={`rounded-lg border p-4 ${
              unreadInquiries > 0 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-white border-slate-200'
            }`}>
              <p className="text-xs text-slate-500 mb-2">未読の問い合わせ</p>
              <p className={`text-3xl font-bold ${
                unreadInquiries > 0 ? 'text-orange-600' : 'text-slate-800'
              }`}>{unreadInquiries}</p>
              <p className="text-xs text-slate-400 mt-1">件</p>
            </div>
          </div>

          {/* ② クライアント数（2列） */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-2">登録クライアント数</p>
              <p className="text-3xl font-bold text-slate-800">{guestCount}</p>
              <p className="text-xs text-slate-400 mt-1">件</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-2">プラン使用率</p>
              <p className="text-3xl font-bold text-slate-800">{usage?.site_count || 0}/{plan?.site_limit || 1}</p>
              <p className="text-xs text-slate-400 mt-1">サイト</p>
            </div>
          </div>

          {/* ③ ページ別アクセス（今月） */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">ページ別アクセス（今月）</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <p className="text-sm text-slate-600">サービスページ合計</p>
                <p className="text-lg font-bold text-slate-800">{servicePageViews}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">ブログ記事合計</p>
                <p className="text-lg font-bold text-slate-800">{blogPageViews}</p>
              </div>
            </div>
          </div>

          {/* ④ 現在のプラン（一番下） */}
          <div className="bg-slate-100 rounded-lg border border-slate-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">現在のプラン</p>
                <p className="text-2xl font-bold text-slate-800">{plan?.name || 'Free'}</p>
              </div>
              <div className="text-right text-xs text-slate-600 space-y-1">
                <p>サイト: {usage?.site_count || 0}/{plan?.site_limit || 1}</p>
                <p>LP: {usage?.lp_count || 0}/{plan?.lp_limit || 1}</p>
                <p>AI: {usage?.ai_used_count || 0}/{plan?.ai_limit || 10}</p>
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}