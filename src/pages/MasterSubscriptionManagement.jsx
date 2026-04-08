/**
 * MasterSubscriptionManagement
 * ユーザー契約管理画面
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Edit2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = {
  trialing: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  grace: 'bg-orange-100 text-orange-800',
  suspended: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-800',
  expired: 'bg-slate-100 text-slate-800',
};

export default function MasterSubscriptionManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [editData, setEditData] = useState(null);

  // ===== 契約一覧取得 =====
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['user_subscriptions'],
    queryFn: () => base44.asServiceRole.entities.UserSubscription.list(),
  });

  // ===== フィルタリング =====
  const filteredSubs = subscriptions.filter(sub => {
    const matchStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchSearch = !searchTerm || sub.user_id.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  // ===== 手動復旧 =====
  const resumeMutation = useMutation({
    mutationFn: (subscriptionId) =>
      base44.functions.invoke('resumeSubscriptionByAdmin', {
        user_subscription_id: subscriptionId,
        reason: 'Manual admin resume',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_subscriptions'] });
      toast.success('契約を復旧しました');
    },
  });

  // ===== 手動更新 =====
  const updateMutation = useMutation({
    mutationFn: (data) =>
      base44.functions.invoke('manualUpdateSubscription', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_subscriptions'] });
      toast.success('契約を更新しました');
      setEditingSubscription(null);
    },
  });

  if (isLoading) {
    return (
      <MasterLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ユーザー契約管理</h1>
          <p className="text-sm text-slate-500 mt-1">全ユーザーの契約情報を管理</p>
        </div>

        {/* ===== フィルター ===== */}
        <div className="flex gap-2">
          <Input
            placeholder="ユーザーID検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">すべてのステータス</option>
            <option value="trialing">無料体験中</option>
            <option value="active">契約中</option>
            <option value="grace">猶予期間</option>
            <option value="suspended">停止中</option>
            <option value="canceled">解約済み</option>
            <option value="expired">期限切れ</option>
          </select>
        </div>

        {/* ===== 一覧 ===== */}
        <div className="grid gap-4">
          {filteredSubs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                契約データがありません
              </CardContent>
            </Card>
          ) : (
            filteredSubs.map((sub) => (
              <Card key={sub.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{sub.user_id}</span>
                        <Badge className={STATUS_COLORS[sub.status]}>
                          {sub.status}
                        </Badge>
                        <Badge variant="outline">{sub.current_plan_code}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">開始日:</span>
                          <div>{sub.start_date || sub.trial_start_date || '-'}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">終了日:</span>
                          <div>{sub.end_date || sub.trial_end_date || '-'}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">次回課金日:</span>
                          <div>{sub.next_billing_date || '-'}</div>
                        </div>
                      </div>
                      {sub.status === 'grace' && (
                        <div className="bg-orange-50 p-2 rounded text-sm text-orange-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          猶予期限: {sub.grace_end_date}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {['grace', 'suspended'].includes(sub.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resumeMutation.mutate(sub.id)}
                          disabled={resumeMutation.isPending}
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          復旧
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSubscription(sub);
                          setEditData(sub);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* ===== 編集ダイアログ ===== */}
        {editingSubscription && (
          <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
            <DialogContent className="max-w-lg max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>契約を編集 - {editingSubscription.user_id}</DialogTitle>
              </DialogHeader>

              {editData && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold">ステータス</label>
                    <select
                      value={editData.status || ''}
                      onChange={(e) => setEditData(p => ({ ...p, status: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="trialing">無料体験</option>
                      <option value="active">契約中</option>
                      <option value="grace">猶予期間</option>
                      <option value="suspended">停止</option>
                      <option value="canceled">解約</option>
                      <option value="expired">期限切れ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold">プランコード</label>
                    <Input
                      value={editData.current_plan_code || ''}
                      onChange={(e) => setEditData(p => ({ ...p, current_plan_code: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">開始日</label>
                    <Input
                      type="date"
                      value={editData.start_date || ''}
                      onChange={(e) => setEditData(p => ({ ...p, start_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">終了日</label>
                    <Input
                      type="date"
                      value={editData.end_date || ''}
                      onChange={(e) => setEditData(p => ({ ...p, end_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">メモ</label>
                    <Input
                      value={editData.admin_memo || ''}
                      onChange={(e) => setEditData(p => ({ ...p, admin_memo: e.target.value }))}
                      className="mt-1"
                      placeholder="管理メモ"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      updateMutation.mutate({
                        user_subscription_id: editingSubscription.id,
                        ...editData,
                        reason: 'Manual admin update',
                      });
                    }}
                    disabled={updateMutation.isPending}
                    className="w-full bg-violet-600"
                  >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    更新
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MasterLayout>
  );
}