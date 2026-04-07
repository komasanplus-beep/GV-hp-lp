import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Plus, Pencil, Trash2, Loader2, Image, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  { value: 'school', label: 'スクール・教室' },
  { value: 'general', label: '汎用' },
];

const DEFAULT_TEMPLATE_DATA = {
  blocks: [
    { type: 'Hero', data: { headline: '', subheadline: '', cta_text: '今すぐ予約する', image_url: '' } },
    { type: 'Problem', data: { title: 'こんなお悩みありませんか？', items: '' } },
    { type: 'Solution', data: { title: '解決策', body: '' } },
    { type: 'Feature', data: { title: '特徴', features: '' } },
    { type: 'CTA', data: { title: 'まずはご相談ください', cta_text: '今すぐ予約する' } },
  ]
};

const defaultForm = {
  name: '',
  slug: '',
  description: '',
  thumbnail_url: '',
  preview_url: '',
  category: 'general',
  is_active: true,
  sort_order: 0,
  template_data_str: JSON.stringify(DEFAULT_TEMPLATE_DATA, null, 2),
};

export default function MasterLPTemplates() {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['lpTemplates'],
    queryFn: () => base44.entities.LPTemplate.list('sort_order'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      let template_data;
      try { template_data = JSON.parse(data.template_data_str); } catch { template_data = {}; }
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        thumbnail_url: data.thumbnail_url,
        preview_url: data.preview_url,
        category: data.category,
        is_active: data.is_active,
        sort_order: Number(data.sort_order),
        template_data,
      };
      return editing?.id
        ? base44.entities.LPTemplate.update(editing.id, payload)
        : base44.entities.LPTemplate.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpTemplates'] });
      setShowDialog(false);
      setEditing(null);
      toast.success(editing ? 'テンプレートを更新しました' : 'テンプレートを追加しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LPTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpTemplates'] });
      toast.success('削除しました');
    },
  });

  const handleUploadThumb = async (file) => {
    setUploadingThumb(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, thumbnail_url: file_url }));
    setUploadingThumb(false);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name,
      slug: t.slug || '',
      description: t.description || '',
      thumbnail_url: t.thumbnail_url || '',
      preview_url: t.preview_url || '',
      category: t.category || 'general',
      is_active: t.is_active !== false,
      sort_order: t.sort_order ?? 0,
      template_data_str: JSON.stringify(t.template_data || DEFAULT_TEMPLATE_DATA, null, 2),
    });
    setShowDialog(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowDialog(true);
  };

  return (
    <MasterLayout title="LPテンプレート管理">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">LPテンプレート</h2>
            <p className="text-sm text-slate-500 mt-0.5">LP新規作成時に選択できるテンプレートを管理します</p>
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
              <p className="font-medium">テンプレートがありません</p>
              <p className="text-sm mt-1">「テンプレートを追加」から作成してください</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <Card key={t.id} className={`hover:shadow-md transition-shadow ${!t.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  {t.thumbnail_url && (
                    <img src={t.thumbnail_url} alt={t.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{t.name}</h3>
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {CATEGORIES.find(c => c.value === t.category)?.label || t.category}
                      </span>
                      {t.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{t.description}</p>}
                      {t.template_data?.blocks && (
                        <p className="text-xs text-slate-400 mt-1">
                          {t.template_data.blocks.map(b => b.type || b.block_type).join(' → ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={t.is_active !== false}
                        onCheckedChange={() => {
                          base44.entities.LPTemplate.update(t.id, { is_active: !t.is_active })
                            .then(() => queryClient.invalidateQueries({ queryKey: ['lpTemplates'] }));
                        }}
                      />
                      <span className="text-xs text-slate-500">{t.is_active !== false ? '有効' : '無効'}</span>
                    </div>
                    <div className="flex gap-1">
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

      {/* 編集ダイアログ */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'テンプレートを編集' : '新規LPテンプレート追加'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">テンプレート名 *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="美容室向けLP" />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">スラッグ</Label>
                <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))} placeholder="beauty-salon-basic" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">カテゴリ</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1 block">表示順</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} min={0} />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1 block">説明</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="このテンプレートの説明..." />
            </div>

            {/* サムネイルアップロード */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1 block">サムネイル画像</Label>
              {form.thumbnail_url && (
                <div className="relative mb-2 inline-block">
                  <img src={form.thumbnail_url} alt="サムネイル" className="h-24 object-cover rounded border" />
                  <button
                    onClick={() => setForm(p => ({ ...p, thumbnail_url: '' }))}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >×</button>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Image className="w-4 h-4 mr-1" />}
                      画像をアップロード
                    </span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUploadThumb(e.target.files[0])} />
                </label>
                <Input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="またはURLを入力" className="text-sm flex-1" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1 block">プレビューURL</Label>
              <Input value={form.preview_url} onChange={e => setForm(p => ({ ...p, preview_url: e.target.value }))} placeholder="https://..." />
            </div>

            {/* template_data JSON */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1 block">ブロック構成 JSON（template_data）</Label>
              <Textarea
                value={form.template_data_str}
                onChange={e => setForm(p => ({ ...p, template_data_str: e.target.value }))}
                rows={12}
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-400 mt-1">
                blocks配列に type と data を定義。typeはブロック種別（Hero, Problem, CTA等）
              </p>
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