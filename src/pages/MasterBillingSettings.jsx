/**
 * MasterBillingSettings
 * 課金グローバル設定管理画面
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterBillingSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(null);

  // ===== 設定取得 =====
  const { data: settings, isLoading } = useQuery({
    queryKey: ['billing_global_settings'],
    queryFn: async () => {
      const result = await base44.entities.BillingGlobalSetting.list();
      return result.length > 0 ? result[0] : null;
    },
  });

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // ===== 更新 =====
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.asServiceRole.entities.BillingGlobalSetting.update(settings.id, data);
      } else {
        return base44.asServiceRole.entities.BillingGlobalSetting.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing_global_settings'] });
      toast.success('設定を保存しました');
    },
    onError: (err) => {
      toast.error('保存に失敗しました: ' + err.message);
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData) return;
    updateMutation.mutate(formData);
  };

  return (
    <MasterLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">課金グローバル設定</h1>
          <p className="text-sm text-slate-500 mt-1">全プランに適用されるデフォルト値を設定します</p>
        </div>

        {formData && (
          <Card>
            <CardHeader>
              <CardTitle>日数設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5">月額利用日数</Label>
                <Input
                  type="number"
                  value={formData.default_monthly_cycle_days || 30}
                  onChange={(e) => handleChange('default_monthly_cycle_days', parseInt(e.target.value))}
                  min="1"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5">無料体験日数</Label>
                <Input
                  type="number"
                  value={formData.default_trial_days || 14}
                  onChange={(e) => handleChange('default_trial_days', parseInt(e.target.value))}
                  min="0"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5">年額利用日数</Label>
                <Input
                  type="number"
                  value={formData.default_yearly_access_days || 365}
                  onChange={(e) => handleChange('default_yearly_access_days', parseInt(e.target.value))}
                  min="1"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5">支払い失敗時の猶予期間日数</Label>
                <Input
                  type="number"
                  value={formData.default_grace_days || 3}
                  onChange={(e) => handleChange('default_grace_days', parseInt(e.target.value))}
                  min="0"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {formData && (
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5">無料体験終了の何日前に通知するか</Label>
                <Input
                  type="number"
                  value={formData.notify_before_trial_end_days || 3}
                  onChange={(e) => handleChange('notify_before_trial_end_days', parseInt(e.target.value))}
                  min="0"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5">契約終了の何日前に通知するか</Label>
                <Input
                  type="number"
                  value={formData.notify_before_paid_end_days || 7}
                  onChange={(e) => handleChange('notify_before_paid_end_days', parseInt(e.target.value))}
                  min="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">決済失敗時に通知</Label>
                <Switch
                  checked={formData.notify_on_payment_failed ?? true}
                  onCheckedChange={(v) => handleChange('notify_on_payment_failed', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">利用停止時に通知</Label>
                <Switch
                  checked={formData.notify_on_suspend ?? true}
                  onCheckedChange={(v) => handleChange('notify_on_suspend', v)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {formData && (
          <Card>
            <CardHeader>
              <CardTitle>機能制御</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">未払い時に公開サイトを停止</Label>
                <Switch
                  checked={formData.suspend_public_site_on_unpaid ?? true}
                  onCheckedChange={(v) => handleChange('suspend_public_site_on_unpaid', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">管理者による手動上書きを許可</Label>
                <Switch
                  checked={formData.allow_manual_override_by_admin ?? true}
                  onCheckedChange={(v) => handleChange('allow_manual_override_by_admin', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">設定を有効化</Label>
                <Switch
                  checked={formData.is_active ?? true}
                  onCheckedChange={(v) => handleChange('is_active', v)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              設定を保存
            </>
          )}
        </Button>
      </div>
    </MasterLayout>
  );
}