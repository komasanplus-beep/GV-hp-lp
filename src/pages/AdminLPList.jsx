import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TEMPLATES = [
  { value: 'new_service', label: '新規サービス', description: 'Hero → Problem → Solution → Feature → Flow → Future → CTA' },
  { value: 'proven_service', label: '実績ありサービス', description: 'Hero → Problem → Evidence → Feature → Voice → Flow → FAQ → CTA' },
];

export default function AdminLPList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', template_type: 'new_service' });

  const { data: pages = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date'),
  });

  const { data: limitsList = [] } = useQuery({
    queryKey: ['myLimits'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.UserLimits.filter({ user_id: user.id });
    },
  });
  const limits = limitsList[0];
  const atLimit = limits && limits.lp_create_limit !== undefined && pages.length >= limits.lp_create_limit;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const lp = await base44.entities.LandingPage.create(data);
      // テンプレートに応じてデフォルトブロックを生成
      const blockTypes = data.template_type === 'new_service'
        ? ['Hero', 'Problem', 'Solution', 'Feature', 'Flow', 'Future', 'CTA']
        : ['Hero', 'Problem', 'Evidence', 'Feature', 'Voice', 'Flow', 'FAQ', 'CTA'];
      await Promise.all(blockTypes.map((block_type, i) =>
        base44.entities.LPBlock.create({ lp_id: lp.id, block_type, sort_order: i, data: {} })
      ));
      return lp;
    },
    onSuccess: (lp) => {
      queryClient.invalidateQueries({ queryKey: ['landingPages'] });
      setShowCreate(false);
      navigate(createPageUrl(`AdminLPEditor?id=${lp.id}`));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LandingPage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landingPages'] }),
  });

  return (
    <ProtectedRoute>
      <AdminLayout title="LP管理">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">ランディングページ一覧</h2>
            {limits && (
              <p className="text-xs text-slate-400 mt-1">{pages.length} / {limits.lp_create_limit} 件使用中</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl('AdminLPGenerate')}>
                <Sparkles className="w-4 h-4 mr-1" />AI生成
              </Link>
            </Button>
            <Button onClick={() => setShowCreate(true)} className="bg-amber-600 hover:bg-amber-700" disabled={atLimit}
              title={atLimit ? 'LP作成数の上限に達しています' : ''}>
              <Plus className="w-4 h-4 mr-2" />新規作成
            </Button>
          </div>
        </div>
        {atLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            LP作成数の上限（{limits.lp_create_limit}件）に達しています。管理者に上限引き上げを依頼してください。
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
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-slate-800">{lp.title}</span>
                    <Badge variant={lp.status === 'published' ? 'default' : 'secondary'}>
                      {lp.status === 'published' ? '公開中' : '下書き'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {TEMPLATES.find(t => t.value === lp.template_type)?.label}
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

        {/* 新規作成ダイアログ */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
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
              <div>
                <Label>テンプレート</Label>
                <div className="grid gap-3 mt-2">
                  {TEMPLATES.map(t => (
                    <label key={t.value} className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${form.template_type === t.value ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="template" value={t.value} checked={form.template_type === t.value} onChange={() => setForm({ ...form, template_type: t.value })} className="mt-1" />
                      <div>
                        <div className="font-medium text-slate-800">{t.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{t.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>キャンセル</Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                disabled={!form.title || !form.slug || createMutation.isPending}
                onClick={() => createMutation.mutate(form)}
              >
                {createMutation.isPending ? '作成中...' : '作成してエディタへ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}