import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import KPISection from '@/components/dashboard/KPISection';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function UserDashboard() {
  const { data: summary } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getDashboardSummary', {});
      return res.data;
    },
  });

  const { data: unresolvedInquiries = [] } = useQuery({
    queryKey: ['unresolvedQA'],
    queryFn: () => base44.entities.Inquiry.filter({ category: 'system_support', status: 'new' }, '-created_date', 5),
  });

  const siteName = summary?.site_name;
  const title = siteName ? `${siteName} のダッシュボード` : 'ダッシュボード';

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title={title}>
        <div className="max-w-6xl mx-auto space-y-3">

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
          <KPISection />

        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}