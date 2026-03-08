import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const FEATURE_LABELS = {
  dashboard: 'ダッシュボード',
  service_manage: 'サービス管理',
  content_manage: 'コンテンツ管理',
  settings: '設定',
  reservation_manage: '予約管理',
  guest_manage: 'ゲスト管理',
  lp_manage: 'LP管理',
  blog_manage: 'ブログ管理',
  ai_generate: 'AI生成',
};

const DEFAULT_FEATURES = {
  dashboard: true, service_manage: true, content_manage: true, settings: true,
  reservation_manage: false, guest_manage: false, lp_manage: false, blog_manage: false, ai_generate: false,
};

const DEFAULT_LIMITS = { lp_create_limit: 1, ai_regenerate_limit: 3, blog_create_limit: 5, ab_test_limit: 1 };

export default function MasterFeatureControl() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['masterUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });
  const selectedUser = users.find(u => u.id === userId);

  const { data: featuresList = [] } = useQuery({
    queryKey: ['userFeatures', userId],
    queryFn: () => base44.entities.UserFeatures.filter({ user_id: userId }),
    enabled: !!userId,
  });
  const { data: limitsList = [] } = useQuery({
    queryKey: ['userLimits', userId],
    queryFn: () => base44.entities.UserLimits.filter({ user_id: userId }),
    enabled: !!userId,
  });

  const features = featuresList[0];
  const limits = limitsList[0];

  const [featForm, setFeatForm] = useState(DEFAULT_FEATURES);
  const [limForm, setLimForm] = useState(DEFAULT_LIMITS);

  useEffect(() => {
    if (features) setFeatForm({ ...DEFAULT_FEATURES, ...features });
  }, [features]);
  useEffect(() => {
    if (limits) setLimForm({ ...DEFAULT_LIMITS, ...limits });
  }, [limits]);

  const saveFeatMutation = useMutation({
    mutationFn: async (data) => {
      if (features) return base44.entities.UserFeatures.update(features.id, data);
      return base44.entities.UserFeatures.create({ user_id: userId, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userFeatures', userId] }),
  });

  const saveLimMutation = useMutation({
    mutationFn: async (data) => {
      if (limits) return base44.entities.UserLimits.update(limits.id, data);
      return base44.entities.UserLimits.create({ user_id: userId, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userLimits', userId] }),
  });

  return (
    <MasterLayout title="UserFeatures / UserLimits">
      <div className="max-w-2xl mx-auto space-y-6">
        {selectedUser && (
          <div className="bg-violet-50 rounded-xl border border-violet-200 p-4">
            <p className="font-medium text-violet-800">{selectedUser.store_name || selectedUser.full_name || selectedUser.email}</p>
            <p className="text-sm text-violet-600">{selectedUser.email}</p>
          </div>
        )}
        {!userId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
            URLパラメータ <code>?userId=xxx</code> でユーザーを指定してください
          </div>
        )}

        {/* 機能 ON/OFF */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">機能制御</h3>
          <div className="space-y-3">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <Label className="text-slate-700">{label}</Label>
                <Switch
                  checked={!!featForm[key]}
                  onCheckedChange={val => setFeatForm(f => ({ ...f, [key]: val }))}
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-4 bg-violet-600 hover:bg-violet-700 w-full"
            disabled={!userId || saveFeatMutation.isPending}
            onClick={() => saveFeatMutation.mutate(featForm)}
          >
            {saveFeatMutation.isPending ? '保存中...' : '機能設定を保存'}
          </Button>
        </div>

        {/* 使用制限 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">使用制限</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'lp_create_limit', label: 'LP作成数上限' },
              { key: 'ai_regenerate_limit', label: 'AI再生成上限' },
              { key: 'blog_create_limit', label: 'ブログ作成数上限' },
              { key: 'ab_test_limit', label: 'ABテスト上限' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs text-slate-500">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={limForm[key]}
                  onChange={e => setLimForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-4 bg-violet-600 hover:bg-violet-700 w-full"
            disabled={!userId || saveLimMutation.isPending}
            onClick={() => saveLimMutation.mutate(limForm)}
          >
            {saveLimMutation.isPending ? '保存中...' : '制限設定を保存'}
          </Button>
        </div>
      </div>
    </MasterLayout>
  );
}