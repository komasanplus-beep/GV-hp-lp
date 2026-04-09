import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import KPISection from '@/components/dashboard/KPISection';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function UserDashboard() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [summary, setSummary] = React.useState(null);
  const [summaryError, setSummaryError] = React.useState(null);
  const [unresolvedInquiries, setUnresolvedInquiries] = React.useState([]);

  // 順次実行でレート制限を回避
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 1. ダッシュボードサマリーを取得
        const res = await base44.functions.invoke('getDashboardSummary', {});
        setSummary(res.data);
      } catch (err) {
        console.error('Dashboard summary error:', err);
        setSummaryError(err);
      }
      
      // 2. 少し待ってから問い合わせを取得（レート制限対策）
      await new Promise(r => setTimeout(r, 500));
      
      try {
        const inquiries = await base44.entities.Inquiry.filter(
          { category: 'system_support', status: 'new' }, 
          '-created_date', 
          5
        );
        setUnresolvedInquiries(inquiries || []);
      } catch (err) {
        console.error('Inquiries fetch error:', err);
        setUnresolvedInquiries([]);
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const siteName = summary?.site_name;
  const title = siteName ? `${siteName} のダッシュボード` : 'ダッシュボード';

  // エラー時のフォールバックデータ
  const fallbackSummary = summaryError ? {
    site_summary: { site_count: 0, published_site_count: 0, lp_count: 0, published_lp_count: 0 },
    monthly_access_summary: { access_count: 0, page_view_count: 0 },
    monthly_result_summary: { reservation_count: 0, sales_amount: 0, customer_count: 0 },
    monthly_usage_summary: { ai_used: 0, ai_limit: 50, ai_usage_rate: 0, storage_used: 0, storage_limit: 1000, storage_usage_rate: 0 },
    lp_kpi_summary: { page_view_count: 0, cta_click_count: 0, conversion_count: 0, cv_rate: 0 },
  } : null;

  const displaySummary = summary || fallbackSummary;

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="ダッシュボード">
          <div className="flex justify-center py-12">
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
          {/* データ取得エラーバナー */}
          {summaryError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-800">
                  データの読み込みに問題が発生しました
                </p>
                <p className="text-xs text-amber-700 truncate">
                  ページは表示されますが、一部のデータが更新されない場合があります
                </p>
              </div>
            </div>
          )}

          {/* 未対応Q&Aバナー */}
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

          {/* サイト概要 + アクセス分析 + KPI + LP分析 */}
          <KPISection summary={displaySummary} />

        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}