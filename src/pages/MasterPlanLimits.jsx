/**
 * MasterPlanLimits
 * AI上限設定を含むPlanMaster一元管理画面
 * 
 * PlanMaster.limits を正本として、すべてのAI制御を統一
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const defaultLimits = {
  ai_generation_count: 0,
  ai_post_generation: 0,
  lp_count: -1,
  site_count: -1,
};

export default function MasterPlanLimits() {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    included_features: [],
    limits: { ...defaultLimits },
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['masterPlanLimits'],
    queryFn: () => base44.asServiceRole.entities.PlanMaster.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editId
      ? base44.asServiceRole.entities.PlanMaster.update(editId, data)
      : base44.asServiceRole.entities.PlanMaster.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterPlanLimits'] });
      setDialogOpen(false);
      setEditId(null);
      setForm({
        code: '', name: '', description: '', monthly_price: 0, yearly_price: 0,
        included_features: [], limits: { ...defaultLimits },
      });
      toast.success(editId ? 'プラン更新完了' : 'プラン作成完了');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.PlanMaster.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterPlanLimits'] });
      toast.success('プラン削除完了');
    },
  });

  const openEdit = (plan) => {
    setForm({
      code: plan.code || '',
      name: plan.name || '',
      description: plan.description || '',
      monthly_price: plan.monthly_price || 0,
      yearly_price: plan.yearly_price || 0,
      included_features: plan.included_features || [],
      limits: plan.limits || { ...defaultLimits },
    });
    setEditId(plan.id);
    setDialogOpen(true);
  };

  const openNew = () => {
    setForm({
      code: '', name: '', description: '', monthly_price: 0, yearly_price: 0,
      included_features: [], limits: { ...defaultLimits },
    });
    setEditId(null);
    setDialogOpen(true);
  };

  const updateLimit = (key, value) => {
    setForm(f => ({
      ...f,
      limits: { ...f.limits, [key]: value === '' ? 0 : Number(value) },
    }));
  };

  return (
    <MasterLayout title="プラン管理（AI上限設定）">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">プラン＆AI上限設定</h2>
            <p className="text-sm text-slate-500 mt-1">各プランのAI利用回数上限を管理します</p>
          </div>
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />新規プラン
          </Button>
        </div>

        {/* 説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">ℹ️ PlanMaster.limits が正本です</p>
            <p>ここで設定した値がすべてのAI制御の上限になります。管理画面で変更するだけで即座に全AI機能に反映されます。</p>
          </div>
        </div>

        {/* プランリスト */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-400">読み込み中...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{plan.name}</h3>
                    <span className="text-xs text-slate-500 font-mono">{plan.code}</span>
                  </div>
                  <Badge variant="outline">{plan.status === 'active' ? '有効' : '非表示'}</Badge>
                </div>

                {/* プラン情報 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500">月額</p>
                    <p className="font-semibold text-slate-800">¥{(plan.monthly_price || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">年額</p>
                    <p className="font-semibold text-slate-800">¥{(plan.yearly_price || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">AI記事生成</p>
                    <p className="font-semibold text-violet-600">{plan.limits?.ai_generation_count ?? '未設定'} 回/月</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">LP生成</p>
                    <p className="font-semibold text-violet-600">{plan.limits?.ai_lp_generation ?? '未設定'} 回/月</p>
                  </div>
                </div>

                {/* 機能 */}
                {plan.included_features?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">含まれる機能</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.included_features.map(f => (
                        <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作 */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(plan)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" />編集
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(`${plan.name}を削除しますか?`)) {
                        deleteMutation.mutate(plan.id);
                      }
                    }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {plans.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                プランがありません。「新規プラン」から作成してください。
              </div>
            )}
          </div>
        )}
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'プランを編集' : '新規プラン作成'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基本情報 */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">基本情報</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">プラン名</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例: Starterプラン" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">プランコード</Label>
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="例: starter" disabled={!!editId} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-500 mb-1 block">説明</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="プランの説明" />
                </div>
              </div>
            </div>

            {/* 価格 */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">価格設定</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">月額（円）</Label>
                  <Input type="number" value={form.monthly_price} onChange={e => setForm(f => ({ ...f, monthly_price: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">年額（円）</Label>
                  <Input type="number" value={form.yearly_price} onChange={e => setForm(f => ({ ...f, yearly_price: Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            {/* AI上限 （重要） */}
            <div className="border-2 border-violet-200 bg-violet-50 rounded-lg p-4">
              <h4 className="font-semibold text-violet-900 mb-3">✨ AI利用上限（正本）</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600 mb-1 block">AI記事生成 (ai_generation_count)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={form.limits.ai_generation_count}
                      onChange={e => updateLimit('ai_generation_count', e.target.value)}
                      placeholder="月間上限回数（0=利用不可）"
                      className="flex-1"
                    />
                    <span className="text-xs text-slate-500 w-12">回/月</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1 block">LP生成 (ai_lp_generation)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={form.limits.ai_lp_generation || 0}
                      onChange={e => updateLimit('ai_lp_generation', e.target.value)}
                      placeholder="月間上限回数（0=利用不可）"
                      className="flex-1"
                    />
                    <span className="text-xs text-slate-500 w-12">回/月</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1 block">その他のAI機能</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={form.limits.ai_post_generation || 0}
                      onChange={e => updateLimit('ai_post_generation', e.target.value)}
                      placeholder="月間上限回数"
                      className="flex-1"
                    />
                    <span className="text-xs text-slate-500 w-12">回/月</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-violet-700 mt-3 leading-relaxed">
                📌 ここで設定した値が全AI制御の上限になります。管理画面で値を変更するだけで、すべてのAPI＆UIに即座に反映されます。
              </p>
            </div>

            {/* 含まれる機能 */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">含まれる機能コード</h4>
              <Input
                value={form.included_features.join(',')}
                onChange={e => setForm(f => ({ ...f, included_features: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                placeholder="site_core, lp_builder, ai_generation など（カンマ区切り）"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.name || !form.code || saveMutation.isPending}
            >
              {saveMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MasterLayout>
  );
}