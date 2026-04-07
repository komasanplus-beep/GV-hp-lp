import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

const defaultForm = {
  name: '', plan_code: '',
  max_lp: 1, ai_limit: 10, domain_limit: 0,
  ab_test_enabled: false, member_limit: 1, storage_limit: 500,
  price_monthly: 0, is_active: true,
};

export default function MasterPlans() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['masterPlans'],
    queryFn: () => base44.entities.Plan.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editId
      ? base44.entities.Plan.update(editId, data)
      : base44.entities.Plan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterPlans'] });
      setDialogOpen(false);
      setEditId(null);
      setForm(defaultForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Plan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterPlans'] }),
  });

  const openEdit = (plan) => {
    setForm({ ...plan });
    setEditId(plan.id);
    setDialogOpen(true);
  };

  const openNew = () => {
    setForm(defaultForm);
    setEditId(null);
    setDialogOpen(true);
  };

  return (
    <MasterLayout title="プラン管理">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">サブスクリプションプラン</h2>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" />新規プラン
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{plan.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{plan.plan_code}</span>
                </div>
                <Badge className={plan.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                  {plan.is_active ? '有効' : '無効'}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-slate-600 mb-4">
                <div className="flex justify-between"><span>月額</span><span className="font-medium">¥{(plan.price_monthly || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>LP数上限</span><span>{plan.max_lp === -1 ? '無制限' : plan.max_lp}</span></div>
                <div className="flex justify-between"><span>AI生成回数/月</span><span>{plan.ai_limit}</span></div>
                <div className="flex justify-between"><span>ドメイン数</span><span>{plan.domain_limit === -1 ? '無制限' : plan.domain_limit === 0 ? 'サブのみ' : plan.domain_limit}</span></div>
                <div className="flex justify-between"><span>メンバー数</span><span>{plan.member_limit}</span></div>
                <div className="flex justify-between"><span>ストレージ</span><span>{plan.storage_limit}MB</span></div>
                <div className="flex justify-between"><span>ABテスト</span><span>{plan.ab_test_enabled ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-slate-400" />}</span></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(plan)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" />編集
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => deleteMutation.mutate(plan.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-400">プランがありません</div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) { setDialogOpen(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'プランを編集' : '新規プランを作成'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">プラン名</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="STARTERプラン" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">プランコード</Label>
                <Input value={form.plan_code} onChange={e => setForm(f => ({ ...f, plan_code: e.target.value }))} placeholder="starter" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">月額（円）</Label>
                <Input type="number" value={form.price_monthly} onChange={e => setForm(f => ({ ...f, price_monthly: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">LP数上限（-1=無制限）</Label>
                <Input type="number" value={form.max_lp} onChange={e => setForm(f => ({ ...f, max_lp: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">AI生成回数/月</Label>
                <Input type="number" value={form.ai_limit} onChange={e => setForm(f => ({ ...f, ai_limit: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">ドメイン数（-1=無制限, 0=サブのみ）</Label>
                <Input type="number" value={form.domain_limit} onChange={e => setForm(f => ({ ...f, domain_limit: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">メンバー数上限</Label>
                <Input type="number" value={form.member_limit} onChange={e => setForm(f => ({ ...f, member_limit: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">ストレージ（MB）</Label>
                <Input type="number" value={form.storage_limit} onChange={e => setForm(f => ({ ...f, storage_limit: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.ab_test_enabled} onChange={e => setForm(f => ({ ...f, ab_test_enabled: e.target.checked }))} />
                ABテスト利用可
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                有効
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button className="bg-violet-600 hover:bg-violet-700"
              onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.plan_code}>
              {saveMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MasterLayout>
  );
}