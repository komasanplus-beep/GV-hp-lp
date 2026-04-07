import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';

// UserFeatures エンティティのフィールドと完全に一致させる
const FEATURE_LABELS = {
  dashboard: 'ダッシュボード',
  site_manage: 'ホームページ管理',
  lp_manage: 'LP管理',
  blog_manage: 'ブログ管理',
  ai_generate: 'AI生成',
  seo_manage: 'SEO管理',
  domain_manage: 'ドメイン設定',
  reservation_manage: '予約管理（将来）',
  ec_manage: 'EC管理（将来）',
  member_manage: '会員管理（将来）',
  analytics: 'アクセス解析（将来）',
  settings: '設定',
};

const DEFAULT_FEATURES = {
  dashboard: true, site_manage: false, lp_manage: false, blog_manage: false,
  ai_generate: false, seo_manage: false, domain_manage: false,
  reservation_manage: false, ec_manage: false, member_manage: false,
  analytics: false, settings: true,
};

const DEFAULT_LIMITS = { lp_create_limit: 1, ai_regenerate_limit: 3, blog_create_limit: 5, ab_test_limit: 1 };

export default function MasterFeatureControl() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlUserId = urlParams.get('userId');
  const queryClient = useQueryClient();

  const [selectedUserId, setSelectedUserId] = useState(urlUserId || '');

  const { data: users = [] } = useQuery({
    queryKey: ['masterUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const { data: featuresList = [] } = useQuery({
    queryKey: ['userFeatures', selectedUserId],
    queryFn: () => base44.entities.UserFeatures.filter({ user_id: selectedUserId }),
    enabled: !!selectedUserId,
  });
  const { data: limitsList = [] } = useQuery({
    queryKey: ['userLimits', selectedUserId],
    queryFn: () => base44.entities.UserLimits.filter({ user_id: selectedUserId }),
    enabled: !!selectedUserId,
  });

  const features = featuresList[0];
  const limits = limitsList[0];
  const selectedUser = users.find(u => u.id === selectedUserId);

  const [featForm, setFeatForm] = useState(DEFAULT_FEATURES);
  const [limForm, setLimForm] = useState(DEFAULT_LIMITS);

  useEffect(() => {
    if (features) setFeatForm({ ...DEFAULT_FEATURES, ...features });
    else setFeatForm(DEFAULT_FEATURES);
  }, [features]);
  useEffect(() => {
    if (limits) setLimForm({ ...DEFAULT_LIMITS, ...limits });
    else setLimForm(DEFAULT_LIMITS);
  }, [limits]);

  const saveFeatMutation = useMutation({
    mutationFn: async (data) => {
      if (features) return base44.entities.UserFeatures.update(features.id, data);
      return base44.entities.UserFeatures.create({ user_id: selectedUserId, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userFeatures', selectedUserId] }),
  });

  const saveLimMutation = useMutation({
    mutationFn: async (data) => {
      if (limits) return base44.entities.UserLimits.update(limits.id, data);
      return base44.entities.UserLimits.create({ user_id: selectedUserId, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userLimits', selectedUserId] }),
  });

  return (
    <MasterLayout title="機能制御">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ユーザー選択 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ChevronDown className="w-4 h-4" />ユーザー選択
          </h3>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— ユーザーを選択してください —" />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{u.full_name || u.email}</span>
                    <span className="text-xs text-slate-500">{u.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedUser && (
            <div className="mt-3 bg-violet-50 rounded-lg border border-violet-200 px-4 py-2">
              <p className="font-medium text-violet-800 text-sm">{selectedUser.full_name || selectedUser.email}</p>
              <p className="text-xs text-violet-500">{selectedUser.email}</p>
            </div>
          )}
        </div>

        {!selectedUserId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
            上のドロップダウンからユーザーを選択してください
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
                  disabled={!selectedUserId}
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-4 bg-violet-600 hover:bg-violet-700 w-full"
            disabled={!selectedUserId || saveFeatMutation.isPending}
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
                  disabled={!selectedUserId}
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-4 bg-violet-600 hover:bg-violet-700 w-full"
            disabled={!selectedUserId || saveLimMutation.isPending}
            onClick={() => saveLimMutation.mutate(limForm)}
          >
            {saveLimMutation.isPending ? '保存中...' : '制限設定を保存'}
          </Button>
        </div>
      </div>
    </MasterLayout>
  );
}