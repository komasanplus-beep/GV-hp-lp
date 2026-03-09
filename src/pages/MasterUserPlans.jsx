import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Pencil, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const PLAN_COLORS = {
  free: 'bg-slate-100 text-slate-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-violet-100 text-violet-700',
  agency: 'bg-amber-100 text-amber-700',
};

export default function MasterUserPlans() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['masterUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.Plan.list(),
  });

  const { data: userPlans = [] } = useQuery({
    queryKey: ['allUserPlans'],
    queryFn: () => base44.entities.UserPlan.list('-created_date', 200),
  });

  const { data: usages = [] } = useQuery({
    queryKey: ['allUsages'],
    queryFn: () => base44.entities.PlanUsage.list('-created_date', 200),
  });

  const { data: lps = [] } = useQuery({
    queryKey: ['allLPs'],
    queryFn: () => base44.entities.LandingPage.list('-created_date', 500),
  });

  const savePlanMutation = useMutation({
    mutationFn: async ({ userId, planId }) => {
      const plan = plans.find(p => p.id === planId);
      const existing = userPlans.find(up => up.user_id === userId);
      if (existing) {
        return base44.entities.UserPlan.update(existing.id, { plan_id: planId, plan_code: plan?.plan_code });
      } else {
        return base44.entities.UserPlan.create({
          user_id: userId,
          plan_id: planId,
          plan_code: plan?.plan_code,
          status: 'active',
          start_date: new Date().toISOString().slice(0, 10),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserPlans'] });
      setEditUser(null);
      toast.success('プランを更新しました');
    },
  });

  const getUserPlan = (userId) => {
    const up = userPlans.find(up => up.user_id === userId);
    if (!up) return null;
    return plans.find(p => p.id === up.plan_id);
  };

  const getUserUsage = (userId) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return usages.find(u => u.user_id === userId && u.month_year === currentMonth)
      || usages.find(u => u.user_id === userId)
      || { ai_used: 0, lp_count: 0, storage_used: 0 };
  };

  const getUserLPCount = (userId) => lps.filter(lp => lp.user_id === userId).length;

  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user) => {
    setEditUser(user);
    const up = userPlans.find(up => up.user_id === user.id);
    setSelectedPlanId(up?.plan_id || '');
  };

  return (
    <MasterLayout title="ユーザープラン管理">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">ユーザープラン管理</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="メール・名前で検索" className="pl-9" />
        </div>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {plans.map(plan => {
          const count = userPlans.filter(up => up.plan_id === plan.id).length;
          return (
            <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan.plan_code] || 'bg-slate-100 text-slate-700'}`}>
                {plan.name}
              </span>
              <p className="text-2xl font-bold text-slate-800 mt-2">{count}</p>
              <p className="text-xs text-slate-400">ユーザー</p>
            </div>
          );
        })}
      </div>

      {loadingUsers ? (
        <div className="text-center py-20 text-slate-400">読み込み中...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">ユーザー</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">プラン</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden md:table-cell">
                  <div className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />AI使用 (今月)</div>
                </th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden md:table-cell">
                  <div className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />LP数</div>
                </th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => {
                const plan = getUserPlan(user.id);
                const usage = getUserUsage(user.id);
                const lpCount = getUserLPCount(user.id);
                const planLimit = plan ? plan.ai_limit : 10;
                const lpLimit = plan ? (plan.max_lp === -1 ? '∞' : plan.max_lp) : 1;
                const aiPct = Math.min(100, (usage.ai_used / planLimit) * 100);

                return (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{user.email}</p>
                      <p className="text-xs text-slate-400">{user.full_name || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {plan ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan.plan_code] || 'bg-slate-100 text-slate-700'}`}>
                          {plan.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">未設定</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${aiPct >= 90 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${aiPct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{usage.ai_used}/{planLimit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-700">{lpCount} / {lpLimit}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">ユーザーが見つかりません</div>
          )}
        </div>
      )}

      {/* プラン変更ダイアログ */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>プランを変更</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-sm font-medium text-slate-700">{editUser.email}</p>
                <p className="text-xs text-slate-400">{editUser.full_name}</p>
              </div>
              <div>
                <Label>プランを選択</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="プランを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}（LP {p.max_lp === -1 ? '無制限' : p.max_lp}件 / AI {p.ai_limit}回/月）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>キャンセル</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              disabled={!selectedPlanId || savePlanMutation.isPending}
              onClick={() => savePlanMutation.mutate({ userId: editUser.id, planId: selectedPlanId })}
            >
              {savePlanMutation.isPending ? '保存中...' : 'プランを更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MasterLayout>
  );
}