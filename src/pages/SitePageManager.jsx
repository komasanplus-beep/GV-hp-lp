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
import { Plus, FileText, Pencil, Trash2, Loader2, Layout, ArrowRight, Globe, Eye, Zap, Edit3, Search, ChevronDown, AlertTriangle } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/utils';
import PageBlocksList from '@/components/site/PageBlocksList';
import BackupManager from '@/components/site/BackupManager';
import { createBackup } from '@/lib/backup';

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
  const [expandedPageId, setExpandedPageId] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState('confirm'); // 'confirm' | 'backup_prompt' | 'executing'
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
                        <CardContent className="p-0">
                          {/* Page Header */}
                          <div className="py-4 px-5 flex items-center gap-4">
                            <button
                              onClick={() => setExpandedPageId(expandedPageId === page.id ? null : page.id)}
                              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                            >
                              <ChevronDown className={cn(
                                "w-5 h-5 transition-transform",
                                expandedPageId === page.id ? 'rotate-180' : ''
                              )} />
                            </button>
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">
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
                              <Button variant="ghost" size="icon" onClick={() => openEdit(page)}>
                                <Pencil className="w-4 h-4 text-slate-400" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(page.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </div>

                          {/* Block List (Expanded) */}
                          {expandedPageId === page.id && (
                            <div className="border-t border-slate-200 py-4 px-5 bg-slate-50/50">
                              <PageBlocksList
                                pageId={page.id}
                                siteId={selectedSiteId}
                                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['sitePages'] })}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
              )}
            </>
          )}
        </div>

        {/* ── バックアップ管理 ── */}
        {selectedSiteId && (
          <div className="max-w-4xl mt-4">
            <BackupManager siteId={selectedSiteId} />
          </div>
        )}

        {/* ── 危険ゾーン ── */}
        {selectedSiteId && (
          <div className="mt-6 max-w-4xl border-2 border-red-200 bg-red-50/60 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-semibold text-red-700">データ管理（危険操作）</h3>
            </div>
            <p className="text-sm text-red-600 leading-relaxed mb-4">
              この操作を行うと、現在のサイトに登録されているページ・ブロック・サービス・記事などのデータがすべて削除され、初期状態に戻ります。<br />
              <strong>この操作は元に戻すことができません。</strong><br /><br />
              主に以下のような場合に使用します：<br />
              ・サイトを作り直したい場合<br />
              ・テンプレートを初期状態から再生成したい場合
            </p>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => { setResetConfirmText(''); setResetStep('confirm'); setShowResetModal(true); }}
            >
              <AlertTriangle className="w-4 h-4" />データを初期化する
            </Button>
          </div>
        )}

        {/* ── 初期化確認モーダル ── */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">

              {/* Step1: バックアップ確認 */}
              {resetStep === 'confirm' && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">初期化前にバックアップを作成しますか？</h2>
                  </div>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    初期化を実行する前に、現在の状態を保存しておくことをおすすめします。バックアップがあれば、後から復元できます。
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowResetModal(false)}
                      className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => setResetStep('backup_prompt')}
                      className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      スキップして続行
                    </button>
                    <button
                      onClick={async () => {
                        setIsResetting(true);
                        try {
                          await createBackup(selectedSiteId, { name: '初期化前の自動保存', type: 'auto' });
                          queryClient.invalidateQueries({ queryKey: ['backups', selectedSiteId] });
                          sonnerToast.success('バックアップを作成しました');
                          setResetStep('backup_prompt');
                        } catch (err) {
                          sonnerToast.error('バックアップに失敗: ' + err.message);
                        } finally {
                          setIsResetting(false);
                        }
                      }}
                      disabled={isResetting}
                      className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      {isResetting
                        ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</>
                        : 'バックアップして続行'
                      }
                    </button>
                  </div>
                </>
              )}

              {/* Step2: DELETE入力 */}
              {resetStep === 'backup_prompt' && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">本当に初期化しますか？</h2>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    この操作により、すべてのデータが削除されます。<br />
                    <strong className="text-red-600">元に戻すことはできません。</strong>
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4 mb-5">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      実行する場合は <code className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">DELETE</code> と入力してください
                    </p>
                    <input
                      type="text"
                      value={resetConfirmText}
                      onChange={e => setResetConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowResetModal(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      disabled={isResetting}
                    >
                      キャンセル
                    </button>
                    <button
                      disabled={resetConfirmText !== 'DELETE' || isResetting}
                      onClick={async () => {
                        setIsResetting(true);
                        try {
                          const pages = await base44.entities.SitePage.filter({ site_id: selectedSiteId });
                          for (const p of pages) await base44.entities.SitePage.delete(p.id);
                          const blocks = await base44.entities.SiteBlock.filter({ site_id: selectedSiteId });
                          for (const b of blocks) await base44.entities.SiteBlock.delete(b.id);
                          const services = await base44.entities.Service.filter({ site_id: selectedSiteId });
                          for (const s of services) await base44.entities.Service.delete(s.id);
                          const posts = await base44.entities.Post.filter({ site_id: selectedSiteId });
                          for (const po of posts) await base44.entities.Post.delete(po.id);
                          queryClient.invalidateQueries({ queryKey: ['sitePages'] });
                          setShowResetModal(false);
                          sonnerToast.success('データを初期化しました');
                        } catch (err) {
                          sonnerToast.error('初期化に失敗しました: ' + err.message);
                        } finally {
                          setIsResetting(false);
                          setResetConfirmText('');
                        }
                      }}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      {isResetting
                        ? <><Loader2 className="w-4 h-4 animate-spin" />初期化中...</>
                        : <><AlertTriangle className="w-4 h-4" />初期化を実行する</>
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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