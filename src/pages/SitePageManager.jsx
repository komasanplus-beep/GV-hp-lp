import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Pencil, Trash2, Loader2, Layout, ArrowRight, Globe, Eye, Zap, Edit3, Search } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/utils';

const PAGE_TYPES = [
  { value: 'home', label: 'HOME' },
  { value: 'about', label: 'ABOUT' },
  { value: 'menu', label: 'MENU' },
  { value: 'staff', label: 'STAFF' },
  { value: 'gallery', label: 'GALLERY' },
  { value: 'access', label: 'ACCESS' },
  { value: 'contact', label: 'CONTACT' },
  { value: 'custom', label: 'カスタム' },
];

const PAGE_ICONS = {
  home: '🏠', about: 'ℹ️', menu: '📋', staff: '👥',
  gallery: '🖼️', access: '📍', contact: '📬', custom: '📄',
};

export default function SitePageManager() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', page_type: 'custom', status: 'draft' });
  const queryClient = useQueryClient();

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-created_date'),
  });

  const selectedSiteId = siteId || sites[0]?.id;
  const selectedSite = sites.find(s => s.id === selectedSiteId);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['sitePages', selectedSiteId],
    queryFn: () => selectedSiteId
      ? base44.entities.SitePage.filter({ site_id: selectedSiteId }, 'sort_order')
      : [],
    enabled: !!selectedSiteId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, site_id: selectedSiteId };
      return editing?.id
        ? base44.entities.SitePage.update(editing.id, payload)
        : base44.entities.SitePage.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sitePages'] });
      setShowDialog(false);
      sonnerToast.success(editing ? 'ページを更新しました' : 'ページを追加しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SitePage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sitePages'] });
      sonnerToast.success('削除しました');
    },
  });

  const openEdit = (page) => {
    setEditing(page);
    setForm({ title: page.title, slug: page.slug, page_type: page.page_type || 'custom', status: page.status });
    setShowDialog(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', slug: '', page_type: 'custom', status: 'draft' });
    setShowDialog(true);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="ページ管理">
        <div className="max-w-4xl space-y-6">
          {/* Site selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">ページ管理</h2>
              <p className="text-sm text-slate-500 mt-0.5">各ページのブロックを編集できます</p>
            </div>
            <div className="flex gap-3">
              {sites.length > 1 && (
                <Select
                  value={selectedSiteId || ''}
                  onValueChange={id => window.location.href = createPageUrl('SitePageManager') + '?site_id=' + id}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="サイトを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {selectedSiteId && (
                <>
                  <Link to={`${createPageUrl('SiteHeaderSettings')}?site_id=${selectedSiteId}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />ヘッダー設定
                    </Button>
                  </Link>
                  <Link to={`${createPageUrl('SiteFooterSettings')}?site_id=${selectedSiteId}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />フッター設定
                    </Button>
                  </Link>
                  <Link to={`${createPageUrl('SiteSeoSettings')}?site_id=${selectedSiteId}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Search className="w-3.5 h-3.5" />SEO設定
                    </Button>
                  </Link>
                  <a href={`/site/${selectedSiteId}?preview=true`} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Eye className="w-3.5 h-3.5" />プレビュー
                    </Button>
                  </a>
                  <Button 
                    onClick={async () => {
                      try {
                        const res = await base44.functions.invoke('migrateHomeToSiteBlocks', { site_id: selectedSiteId });
                        sonnerToast.success(`${res.data.blocks_created}個のブロックを移植しました`);
                        queryClient.invalidateQueries({ queryKey: ['sitePages'] });
                      } catch (err) {
                        sonnerToast.error('移植に失敗しました: ' + err.message);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />データを初期化
                  </Button>
                  <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                    <Plus className="w-4 h-4" />ページ追加
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* No site selected */}
          {!selectedSiteId && (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">サイトがありません</p>
                <p className="text-sm mt-1 mb-4">先にサイトを作成してください</p>
                <Link to={createPageUrl('AdminSiteList')}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">サイト管理へ</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Page list */}
          {selectedSiteId && (
            <>
              {selectedSite && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">{selectedSite.site_name}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full border ml-2",
                    selectedSite.status === 'published' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                  )}>
                    {selectedSite.status === 'published' ? '公開中' : '下書き'}
                  </span>
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
              ) : pages.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">ページがありません</p>
                    <p className="text-sm mt-1">「ページ追加」から作成できます</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {pages.map(page => (
                    <Card key={page.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4 px-5 flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                          {PAGE_ICONS[page.page_type] || '📄'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800">{page.title}</h3>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full border flex-shrink-0",
                              page.status === 'published' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                            )}>
                              {page.status === 'published' ? '公開中' : '下書き'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">/{page.slug}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Link to={`${createPageUrl('SiteBlockEditor')}?page_id=${page.id}&site_id=${selectedSiteId}`}>
                            <Button variant="outline" size="sm" className="gap-1 text-xs">
                              <Layout className="w-3.5 h-3.5" />ブロック編集
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(page)}>
                            <Pencil className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(page.id)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'ページを編集' : 'ページを追加'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ページ種別</label>
                <Select value={form.page_type} onValueChange={val => setForm(p => ({ ...p, page_type: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ページタイトル *</label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="例: HOME" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">スラッグ (URL)</label>
                <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="例: home" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ステータス</label>
                <Select value={form.status} onValueChange={val => setForm(p => ({ ...p, status: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">下書き</SelectItem>
                    <SelectItem value="published">公開</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>キャンセル</Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => saveMutation.mutate(form)}
                  disabled={!form.title || saveMutation.isPending}
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? '更新' : '追加')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </UserLayout>
    </ProtectedRoute>
  );
}