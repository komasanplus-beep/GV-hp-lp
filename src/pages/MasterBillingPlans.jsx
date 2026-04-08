/**
 * MasterBillingPlans
 * プラン管理画面
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterBillingPlans() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState(null);

  // ===== プラン一覧取得 =====
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['billing_plans'],
    queryFn: () => base44.asServiceRole.entities.BillingPlan.list(),
  });

  // ===== 作成・更新 =====
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingPlan?.id) {
        return base44.asServiceRole.entities.BillingPlan.update(editingPlan.id, data);
      } else {
        return base44.asServiceRole.entities.BillingPlan.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing_plans'] });
      toast.success(editingPlan ? 'プランを更新しました' : 'プランを作成しました');
      setOpenDialog(false);
      setEditingPlan(null);
      setFormData(null);
    },
    onError: (err) => {
      toast.error('操作に失敗しました: ' + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (planId) => base44.asServiceRole.entities.BillingPlan.delete(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing_plans'] });
      toast.success('プランを削除しました');
    },
  });

  const handleNewPlan = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      code: '',
      billing_type: 'monthly',
      price: 0,
      currency: 'JPY',
      is_active: true,
      lp_limit: 5,
      site_limit: 1,
      ai_article_included_count: 0,
    });
    setOpenDialog(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setFormData(plan);
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData?.name || !formData?.code) {
      toast.error('プラン名とコードは必須です');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <MasterLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">プラン管理</h1>
            <p className="text-sm text-slate-500 mt-1">課金プランを管理します</p>
          </div>
          <Button onClick={handleNewPlan} className="bg-violet-600">
            <Plus className="w-4 h-4 mr-2" />
            プランを追加
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <Badge variant={plan.is_active ? 'default' : 'outline'}>
                          {plan.is_active ? '有効' : '無効'}
                        </Badge>
                        <Badge variant="outline">{plan.billing_type}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{plan.code}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>価格: ¥{plan.price?.toLocaleString('ja-JP') || 0}</div>
                        <div>LP上限: {plan.lp_limit || 0}個</div>
                        <div>サイト上限: {plan.site_limit || 0}個</div>
                        <div>AI記事: {plan.ai_article_included_count || 0}回</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('このプランを削除しますか？')) {
                            deleteMutation.mutate(plan.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== 編集ダイアログ ===== */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'プランを編集' : '新規プランを作成'}
              </DialogTitle>
            </DialogHeader>

            {formData && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs mb-1.5">プラン名</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5">プランコード</Label>
                  <Input
                    value={formData.code || ''}
                    onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))}
                    disabled={!!editingPlan}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5">課金タイプ</Label>
                  <select
                    value={formData.billing_type || 'monthly'}
                    onChange={(e) => setFormData(p => ({ ...p, billing_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="monthly">月額</option>
                    <option value="yearly">年額</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs mb-1.5">価格（円）</Label>
                  <Input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData(p => ({ ...p, price: parseInt(e.target.value) }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5">LP上限</Label>
                  <Input
                    type="number"
                    value={formData.lp_limit || 0}
                    onChange={(e) => setFormData(p => ({ ...p, lp_limit: parseInt(e.target.value) }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5">サイト上限</Label>
                  <Input
                    type="number"
                    value={formData.site_limit || 0}
                    onChange={(e) => setFormData(p => ({ ...p, site_limit: parseInt(e.target.value) }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5">AI記事数</Label>
                  <Input
                    type="number"
                    value={formData.ai_article_included_count || 0}
                    onChange={(e) => setFormData(p => ({ ...p, ai_article_included_count: parseInt(e.target.value) }))}
                    min="0"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">有効</Label>
                  <Switch
                    checked={formData.is_active ?? true}
                    onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="w-full bg-violet-600"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingPlan ? '更新' : '作成'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MasterLayout>
  );
}