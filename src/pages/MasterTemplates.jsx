import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Plus, LayoutDashboard, Pencil, Trash2, Loader2, Eye } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'salon', label: 'サロン系' },
  { value: 'beauty', label: '美容・エステ' },
  { value: 'clinic', label: 'クリニック・医療' },
  { value: 'fitness', label: 'フィットネス・ジム' },
  { value: 'general', label: '汎用' },
];

const DEFAULT_STRUCTURE = {
  blocks: [
    { type: 'Hero', label: 'ヒーロー' },
    { type: 'About', label: '店舗紹介' },
    { type: 'Menu', label: 'メニュー' },
    { type: 'Staff', label: 'スタッフ' },
    { type: 'Gallery', label: 'ギャラリー' },
    { type: 'Voice', label: 'お客様の声' },
    { type: 'CTA', label: '予約CTA' },
    { type: 'Contact', label: '連絡先・地図' },
  ]
};

const defaultForm = {
  name: '',
  category: 'salon',
  description: '',
  preview_image: '',
  structure: JSON.stringify(DEFAULT_STRUCTURE, null, 2),
  is_active: true,
};

export default function MasterTemplates() {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['siteTemplates'],
    queryFn: () => base44.entities.SiteTemplate.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      let structure;
      try { structure = JSON.parse(data.structure); } catch { structure = {}; }
      const payload = { ...data, structure };
      return editing?.id
        ? base44.entities.SiteTemplate.update(editing.id, payload)
        : base44.entities.SiteTemplate.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteTemplates'] });
      setShowDialog(false);
      setEditing(null);
      toast.success(editing ? 'テンプレートを更新しました' : 'テンプレートを追加しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SiteTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteTemplates'] });
      toast.success('削除しました');
    },
  });

  const toggleActive = (template) => {
    base44.entities.SiteTemplate.update(template.id, { is_active: !template.is_active })
      .then(() => queryClient.invalidateQueries({ queryKey: ['siteTemplates'] }));
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, category: t.category || 'salon', description: t.description || '', preview_image: t.preview_image || '', structure: JSON.stringify(t.structure || DEFAULT_STRUCTURE, null, 2), is_active: t.is_active !== false });
    setShowDialog(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowDialog(true);
  };

  const catLabel = (v) => CATEGORIES.find(c => c.value === v)?.label || v;

  return (
    <MasterLayout title="テンプレート管理">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">サイトテンプレート</h2>
            <p className="text-sm text-slate-500 mt-0.5">ユーザーが選択できるホームページテンプレートを管理します</p>
          </div>
          <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="w-4 h-4" />テンプレートを追加
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-slate-400">
              <LayoutDashboard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">テンプレートがありません</p>
              <p className="text-sm mt-1">「テンプレートを追加」から作成してください</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <Card key={t.id} className={`transition-shadow hover:shadow-md ${!t.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  {t.preview_image && (
                    <img src={t.preview_image} alt={t.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{t.name}</h3>
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">{catLabel(t.category)}</span>
                      {t.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{t.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Switch checked={t.is_active !== false} onCheckedChange={() => toggleActive(t)} />
                      <span className="text-xs text-slate-500">{t.is_active !== false ? '有効' : '無効'}</span>
                    </div>
                    <div className="flex gap-1">
                      {t.preview_image && (
                        <Button variant="ghost" size="icon" asChild title="プレビュー">
                          <a href={t.preview_image} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(t.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'テンプレートを編集' : '新規テンプレート追加'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">テンプレート名 *</label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="美容室テンプレート" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">カテゴリ</label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">説明</label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="このテンプレートの説明..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">プレビュー画像URL</label>
              <Input value={form.preview_image} onChange={e => setForm(p => ({ ...p, preview_image: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">ブロック構造（JSON）</label>
              <Textarea
                value={form.structure}
                onChange={e => setForm(p => ({ ...p, structure: e.target.value }))}
                rows={10}
                className="font-mono text-xs"
                placeholder='{"blocks": [...]}'
              />
              <p className="text-xs text-slate-400 mt-1">SiteBlockのblock_typeを配列で定義してください</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <label className="text-sm text-slate-700">有効にする</label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>キャンセル</Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => saveMutation.mutate(form)}
                disabled={!form.name || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? '更新' : '追加')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MasterLayout>
  );
}