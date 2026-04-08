import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from '@/components/user/UserLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ExternalLink, Sparkles, Eye, LayoutTemplate, Check } from 'lucide-react';
import { usePlan } from '@/components/plan/usePlan';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LPTemplateSelector from '@/components/lp/LPTemplateSelector';

const BUILTIN_TEMPLATES = [
  { value: 'new_service', label: '新規サービス', description: 'Hero → Problem → Solution → Feature → Flow → Future → CTA', blocks: ['Hero','Problem','Solution','Feature','Flow','Future','CTA'] },
  { value: 'proven_service', label: '実績ありサービス', description: 'Hero → Problem → Evidence → Feature → Voice → Flow → FAQ → CTA', blocks: ['Hero','Problem','Evidence','Feature','Voice','Flow','FAQ','CTA'] },
];

export default function AdminLPList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', template_type: 'new_service' });
  const [selectedLPTemplate, setSelectedLPTemplate] = useState(null); // DBテンプレート
  const [templateTab, setTemplateTab] = useState('builtin'); // 'builtin' | 'custom'

  const { plan, usage, isAtLPLimit } = usePlan();

  const { data: pages = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date'),
  });

  const { data: lpTemplates = [] } = useQuery({
    queryKey: ['lpTemplates'],
    queryFn: () => base44.entities.LPTemplate.filter({ is_active: true }, 'sort_order'),
  });

  const atLimit = isAtLPLimit;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const lp = await base44.entities.LandingPage.create({
        title: data.title,
        slug: data.slug,
        template_type: data.template_type,
        status: 'draft',
        user_id: user.id,
      });

      let blockTypes = [];
      let initialDataMap = {};

      if (templateTab === 'custom' && selectedLPTemplate?.template_data?.blocks) {
        const tplBlocks = selectedLPTemplate.template_data.blocks;
        blockTypes = tplBlocks.map(b => b.type || b.block_type);
        tplBlocks.forEach(b => { initialDataMap[b.type || b.block_type] = b.data || {}; });
      } else {
        const builtin = BUILTIN_TEMPLATES.find(t => t.value === data.template_type);
        blockTypes = builtin?.blocks || ['Hero', 'CTA'];
      }

      await Promise.all(blockTypes.map((block_type, i) =>
        base44.entities.LPBlock.create({ lp_id: lp.id, block_type, sort_order: i, data: initialDataMap[block_type] || {} })
      ));

      // PlanUsage の lp_count をインクリメント
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usageList = await base44.entities.PlanUsage.filter({ user_id: user.id }).catch(() => []);
      const monthUsage = usageList.find(u => u.month_year === currentMonth);
      if (monthUsage) {
        await base44.entities.PlanUsage.update(monthUsage.id, { lp_count: (monthUsage.lp_count || 0) + 1 });
      } else {
        await base44.entities.PlanUsage.create({ user_id: user.id, month_year: currentMonth, lp_count: 1, ai_used: 0, storage_used: 0 });
      }

      return lp;
    },
    onSuccess: (lp) => {
      queryClient.invalidateQueries({ queryKey: ['landingPages'] });
      queryClient.invalidateQueries({ queryKey: ['planUsage'] });
      setShowCreate(false);
      setSelectedLPTemplate(null);
      navigate(createPageUrl(`AdminLPEditor?id=${lp.id}`));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LandingPage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landingPages'] }),
  });

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="LP管理">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">ランディングページ一覧</h2>
            <p className="text-xs text-slate-400 mt-1">
              {usage.lp_count} / {plan.max_lp === -1 ? '∞' : plan.max_lp} 件使用中
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl('AdminLPGenerate')}>
                <Sparkles className="w-4 h-4 mr-1" />AI生成
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl('AdminLPCodeCreator')}>
                <Plus className="w-4 h-4 mr-1" />コード貼り付け
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={createPageUrl('Home')} target="_blank" rel="noreferrer">
                <Eye className="w-4 h-4 mr-1" />プレビュー
              </a>
            </Button>
            <Button onClick={() => setShowTemplateSelector(true)} className="bg-amber-600 hover:bg-amber-700" disabled={atLimit}
              title={atLimit ? 'LP作成数の上限に達しています' : ''}>
              <Plus className="w-4 h-4 mr-2" />新規作成
            </Button>
          </div>
        </div>
        {atLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            LP作成数の上限（{plan.max_lp}件）に達しています。プランをアップグレードしてください。
          </div>
        )}
        {pages.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg mb-2">LPがまだありません</p>
            <p className="text-sm">「新規作成」からLPを作成してください</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pages.map((lp) => (
              <div key={lp.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-slate-800">{lp.title}</span>
                    <Badge variant={lp.status === 'published' ? 'default' : 'secondary'}>
                      {lp.status === 'published' ? '公開中' : '下書き'}
                    </Badge>
                    {lp.source_type === 'pasted_code' && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        コード貼り付け
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {BUILTIN_TEMPLATES.find(t => t.value === lp.template_type)?.label || lp.template_type}
                    </Badge>
                  </div>
                  <span className="text-sm text-slate-400">/lp/{lp.slug}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={createPageUrl(`LPView?slug=${lp.slug}`)} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={createPageUrl(`AdminLPEditor?id=${lp.id}`)}>
                      <Pencil className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteMutation.mutate(lp.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* テンプレート選択 */}
        <LPTemplateSelector
          open={showTemplateSelector}
          onOpenChange={setShowTemplateSelector}
          siteId={null}
          onCreated={(lp) => {
            queryClient.invalidateQueries({ queryKey: ['landingPages'] });
            navigate(createPageUrl(`AdminLPEditor?id=${lp.id}`));
          }}
        />

        {/* 既存の新規作成ダイアログ */}
        <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setSelectedLPTemplate(null); setTemplateTab('builtin'); } }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>LP新規作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>タイトル</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例: キャンペーンLP 2026" />
              </div>
              <div>
                <Label>スラッグ（URL）</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">/lp/</span>
                  <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() })} placeholder="campaign-2026" />
                </div>
              </div>

              {/* テンプレート選択タブ */}
              <div>
                <Label>テンプレート</Label>
                <div className="flex gap-1 mt-2 mb-3 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setTemplateTab('builtin')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${templateTab === 'builtin' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                  >
                    基本テンプレート
                  </button>
                  <button
                    onClick={() => setTemplateTab('custom')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${templateTab === 'custom' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                  >
                    カスタムテンプレート {lpTemplates.length > 0 && <span className="ml-1 bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 text-[10px]">{lpTemplates.length}</span>}
                  </button>
                </div>

                {templateTab === 'builtin' && (
                  <div className="grid gap-2">
                    {BUILTIN_TEMPLATES.map(t => (
                      <label key={t.value} className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${form.template_type === t.value ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="template" value={t.value} checked={form.template_type === t.value} onChange={() => setForm({ ...form, template_type: t.value })} className="mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{t.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {templateTab === 'custom' && (
                  <div>
                    {lpTemplates.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                        <LayoutTemplate className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">カスタムテンプレートがありません</p>
                        <p className="text-xs mt-1">マスター管理画面から追加できます</p>
                      </div>
                    ) : (
                      <div className="grid gap-2 max-h-60 overflow-y-auto">
                        {lpTemplates.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedLPTemplate(selectedLPTemplate?.id === t.id ? null : t)}
                            className={`flex items-start gap-3 p-3 border-2 rounded-lg text-left transition-colors ${selectedLPTemplate?.id === t.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            {t.thumbnail_url && (
                              <img src={t.thumbnail_url} alt={t.name} className="w-16 h-12 object-cover rounded flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800 text-sm">{t.name}</span>
                                {selectedLPTemplate?.id === t.id && <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                              </div>
                              {t.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>}
                              {t.template_data?.blocks && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {t.template_data.blocks.map(b => b.type || b.block_type).join(' → ')}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>キャンセル</Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                disabled={
                  !form.title || !form.slug || createMutation.isPending ||
                  (templateTab === 'custom' && !selectedLPTemplate)
                }
                onClick={() => createMutation.mutate(form)}
              >
                {createMutation.isPending ? '作成中...' : '作成してエディタへ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </UserLayout>
    </ProtectedRoute>
  );
}