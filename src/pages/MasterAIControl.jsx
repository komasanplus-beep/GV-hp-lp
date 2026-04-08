/**
 * MasterAIControl
 * AI機能のマスター管理画面
 * - AI機能別のON/OFF
 * - ユーザー/サイト単位の個別制御
 * - 月間利用回数の確認
 * - 利用ログ確認
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bot, Shield, AlertTriangle, Plus, Trash2, BarChart2, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// AI機能の定義
const AI_FEATURES = [
  { code: 'ai_lp_generation', name: 'AI LP生成', category: 'lp', description: 'LP（ランディングページ）をAIで自動生成' },
  { code: 'ai_site_generation', name: 'AI サイト生成', category: 'site', description: 'サイト全体をAIで自動生成' },
  { code: 'ai_copywriting', name: 'AI キャッチコピー生成', category: 'copy', description: 'キャッチコピー・文章をAIで生成' },
  { code: 'ai_seo_assist', name: 'AI SEO提案', category: 'seo', description: 'SEOキーワード・メタ情報をAIで提案' },
  { code: 'ai_rewrite', name: 'AI リライト', category: 'copy', description: '既存文章をAIでリライト' },
  { code: 'ai_faq_generation', name: 'AI FAQ生成', category: 'content', description: 'FAQをAIで自動生成' },
  { code: 'ai_image_description', name: 'AI 画像説明生成', category: 'content', description: '画像のalt・説明文をAIで生成' },
  { code: 'ai_crm_follow', name: 'AI CRMフォロー文面', category: 'crm', description: 'フォローメール文面をAIで生成' },
];

const STATUS_COLORS = {
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  blocked: 'bg-slate-100 text-slate-700',
  limit_exceeded: 'bg-amber-100 text-amber-700',
};

export default function MasterAIControl() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('features');
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantForm, setGrantForm] = useState({
    feature_code: AI_FEATURES[0].code,
    grant_type: 'disable',
    target_type: 'user',
    target_id: '',
    reason: '',
  });

  // FeatureMaster からAI機能を取得
  const { data: featureMasters = [], isLoading: loadingFeatures } = useQuery({
    queryKey: ['featureMasters', 'ai'],
    queryFn: () => base44.entities.FeatureMaster.list('sort_order').then(
      list => list.filter(f => f.code?.startsWith('ai_'))
    ),
  });

  // FeatureGrant (AI関連) を取得
  const { data: grants = [], isLoading: loadingGrants } = useQuery({
    queryKey: ['featureGrants', 'ai'],
    queryFn: () => base44.entities.FeatureGrant.list('-created_date').then(
      list => list.filter(g => g.feature_code?.startsWith('ai_'))
    ),
  });

  // AIUsageLog を取得（最新100件）
  const { data: usageLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['aiUsageLogs'],
    queryFn: () => base44.entities.AIUsageLog.list('-created_date', 100),
  });

  // UsageLimitCounter からAI利用回数を取得
  const { data: counters = [] } = useQuery({
    queryKey: ['usageCounters', 'ai'],
    queryFn: () => base44.entities.UsageLimitCounter.list('-created_date', 200).then(
      list => list.filter(c => c.counter_type?.startsWith('ai_'))
    ),
  });

  // FeatureMaster 更新（default_enabled のトグル）
  const toggleFeatureMutation = useMutation({
    mutationFn: ({ id, default_enabled }) =>
      base44.entities.FeatureMaster.update(id, { default_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureMasters'] });
      toast.success('AI機能設定を更新しました');
    },
  });

  // FeatureGrant 追加（個別制御）
  const addGrantMutation = useMutation({
    mutationFn: (data) => base44.entities.FeatureGrant.create({
      ...data,
      status: 'active',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureGrants'] });
      setShowGrantDialog(false);
      toast.success('制御を追加しました');
    },
  });

  // FeatureGrant 削除
  const deleteGrantMutation = useMutation({
    mutationFn: (id) => base44.entities.FeatureGrant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureGrants'] });
      toast.success('削除しました');
    },
  });

  // 機能コード → 表示名
  const getFeatureName = (code) =>
    AI_FEATURES.find(f => f.code === code)?.name || code;

  // 利用回数統計
  const getUsageStats = (featureCode) => {
    const logs = usageLogs.filter(l => l.feature_code === featureCode);
    const successCount = logs.filter(l => l.status === 'success').length;
    const errorCount = logs.filter(l => l.status === 'error' || l.status === 'blocked' || l.status === 'limit_exceeded').length;
    return { total: logs.length, success: successCount, error: errorCount };
  };

  return (
    <MasterLayout title="AI機能制御">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />AI機能管理
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">AI機能のON/OFF・個別制御・利用ログを管理します</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="features">機能制御</TabsTrigger>
            <TabsTrigger value="grants">個別制御</TabsTrigger>
            <TabsTrigger value="logs">利用ログ</TabsTrigger>
          </TabsList>

          {/* ① 機能制御タブ */}
          <TabsContent value="features" className="mt-4">
            <div className="grid gap-3">
              {AI_FEATURES.map(feature => {
                const master = featureMasters.find(m => m.code === feature.code);
                const stats = getUsageStats(feature.code);
                const isEnabled = master?.default_enabled ?? false;

                return (
                  <Card key={feature.code}>
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-800">{feature.name}</h3>
                            <Badge variant="outline" className="text-xs">{feature.code}</Badge>
                            <Badge className={isEnabled ? 'bg-green-100 text-green-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}>
                              {isEnabled ? '有効' : '無効'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
                          <div className="flex gap-4 mt-1.5 text-xs text-slate-400">
                            <span>全利用: {stats.total}回</span>
                            <span className="text-green-600">成功: {stats.success}回</span>
                            {stats.error > 0 && <span className="text-red-500">エラー: {stats.error}回</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {master ? (
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(v) => toggleFeatureMutation.mutate({ id: master.id, default_enabled: v })}
                            />
                          ) : (
                            <span className="text-xs text-slate-400">未登録</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {featureMasters.length === 0 && !loadingFeatures && (
                <Card>
                  <CardContent className="py-12 text-center text-slate-400">
                    <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">AI機能マスターが未登録です</p>
                    <p className="text-sm mt-1">「initializePlanAndFeatures」関数を実行して初期データを投入してください</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ② 個別制御タブ */}
          <TabsContent value="grants" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button
                className="bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={() => setShowGrantDialog(true)}
              >
                <Plus className="w-4 h-4" />個別制御を追加
              </Button>
            </div>

            {loadingGrants ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : grants.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-slate-400">
                  <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>個別制御はありません</p>
                  <p className="text-sm mt-1">ユーザー/サイト単位でAI機能を制御できます</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2">
                {grants.map(grant => (
                  <Card key={grant.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={grant.grant_type === 'enable' ? 'bg-green-100 text-green-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
                              {grant.grant_type === 'enable' ? '強制有効' : '強制無効'}
                            </Badge>
                            <span className="font-medium text-slate-800">{getFeatureName(grant.feature_code)}</span>
                            <span className="text-xs text-slate-500">→</span>
                            <span className="text-xs text-slate-600">
                              {grant.target_type === 'user' ? '👤' : grant.target_type === 'site' ? '🌐' : '🏢'}
                              {grant.target_type}: {grant.target_id}
                            </span>
                          </div>
                          {grant.reason && <p className="text-xs text-slate-400 mt-0.5">{grant.reason}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGrantMutation.mutate(grant.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ③ 利用ログタブ */}
          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loadingLogs ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : usageLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>利用ログがありません</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">日時</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">機能</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ユーザー</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ステータス</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">入力概要</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageLogs.map(log => (
                          <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {log.created_date ? format(new Date(log.created_date), 'MM/dd HH:mm') : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-slate-700">{getFeatureName(log.feature_code)}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">
                              {log.user_id || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${STATUS_COLORS[log.status] || 'bg-slate-100 text-slate-600'} border-0 text-xs`}>
                                {log.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                              {log.input_summary || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 個別制御ダイアログ */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI機能 個別制御を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">AI機能</label>
              <Select
                value={grantForm.feature_code}
                onValueChange={v => setGrantForm(p => ({ ...p, feature_code: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AI_FEATURES.map(f => (
                    <SelectItem key={f.code} value={f.code}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">制御タイプ</label>
              <Select
                value={grantForm.grant_type}
                onValueChange={v => setGrantForm(p => ({ ...p, grant_type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disable">強制無効（ブロック）</SelectItem>
                  <SelectItem value="enable">強制有効（プラン外でも許可）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">対象種別</label>
                <Select
                  value={grantForm.target_type}
                  onValueChange={v => setGrantForm(p => ({ ...p, target_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">ユーザー</SelectItem>
                    <SelectItem value="site">サイト</SelectItem>
                    <SelectItem value="tenant">テナント</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">対象ID</label>
                <Input
                  value={grantForm.target_id}
                  onChange={e => setGrantForm(p => ({ ...p, target_id: e.target.value }))}
                  placeholder="user/site ID"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">理由（任意）</label>
              <Input
                value={grantForm.reason}
                onChange={e => setGrantForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="例: 試用期間中のため一時停止"
              />
            </div>
            {grantForm.grant_type === 'disable' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  強制無効に設定すると、プランの設定に関わらずAI機能がブロックされます。UIとAPIの両方で制限されます。
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowGrantDialog(false)}>
                キャンセル
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => addGrantMutation.mutate(grantForm)}
                disabled={!grantForm.target_id || addGrantMutation.isPending}
              >
                {addGrantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '追加'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MasterLayout>
  );
}