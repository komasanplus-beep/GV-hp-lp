/**
 * AdminPostManager
 * 記事管理ページ（一覧・作成・編集・削除 + カテゴリー/タグ管理タブ）
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Tag, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ---- 定数 ----
const POST_TYPES = [
  { value: 'news',     label: 'お知らせ',  color: 'bg-blue-100 text-blue-700' },
  { value: 'blog',     label: 'ブログ',    color: 'bg-green-100 text-green-700' },
  { value: 'column',   label: 'コラム',    color: 'bg-purple-100 text-purple-700' },
  { value: 'campaign', label: 'キャンペーン', color: 'bg-orange-100 text-orange-700' },
];

const STATUSES = [
  { value: 'published', label: '公開', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 'draft',     label: '下書き', color: 'bg-slate-50 border-slate-200 text-slate-500' },
];

const slugify = (text) =>
  text.toLowerCase().replace(/[\s\u3000]+/g, '-').replace(/[^\w\-]/g, '').replace(/--+/g, '-').trim();

const typeLabel = (val) => POST_TYPES.find(t => t.value === val) ?? POST_TYPES[0];
const statusLabel = (val) => STATUSES.find(s => s.value === val) ?? STATUSES[1];

// =========================================================
// 記事一覧タブ
// =========================================================
function PostsTab({ siteId }) {
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [form, setForm] = useState({});

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', siteId],
    queryFn: () => base44.entities.Post.filter({ site_id: siteId }, '-published_at'),
    enabled: !!siteId,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['postCategories', siteId],
    queryFn: () => base44.entities.PostCategory.filter({ site_id: siteId }, 'sort_order'),
    enabled: !!siteId,
  });
  const { data: tags = [] } = useQuery({
    queryKey: ['postTags', siteId],
    queryFn: () => base44.entities.PostTag.filter({ site_id: siteId }),
    enabled: !!siteId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Post.create({ ...data, site_id: siteId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posts', siteId] }); closeModal(); toast.success('記事を作成しました'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Post.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posts', siteId] }); closeModal(); toast.success('更新しました'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posts', siteId] }); setDeletePost(null); toast.success('削除しました'); },
  });

  const openCreate = () => {
    setEditingPost(null);
    setForm({ post_type: 'news', status: 'draft', title: '', slug: '', excerpt: '', content: '' });
    setIsModalOpen(true);
  };
  const openEdit = (post) => {
    setEditingPost(post);
    setForm(post);
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingPost(null); };

  const handleTitleChange = (title) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('タイトルは必須です'); return; }
    const payload = {
      ...form,
      published_at: form.status === 'published'
        ? (form.published_at || new Date().toISOString())
        : form.published_at,
    };
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filtered = posts.filter(p => {
    if (filterType !== 'all' && p.post_type !== filterType) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* フィルター + 新規作成 */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="種別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての種別</SelectItem>
              {POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 gap-1.5">
          <Plus className="w-4 h-4" />新規作成
        </Button>
      </div>

      {/* 一覧 */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-slate-400">
          <p className="text-3xl mb-2">📝</p>
          <p className="font-medium">記事がありません</p>
          <Button onClick={openCreate} className="mt-4 bg-amber-600 hover:bg-amber-700 gap-1.5">
            <Plus className="w-4 h-4" />最初の記事を作成
          </Button>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {filtered.map(post => {
            const type = typeLabel(post.post_type);
            const status = statusLabel(post.status);
            return (
              <div key={post.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                {post.featured_image_url && (
                  <img src={post.featured_image_url} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type.color}`}>{type.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{post.title}</p>
                  {post.excerpt && <p className="text-xs text-slate-400 mt-0.5 truncate">{post.excerpt}</p>}
                  {post.published_at && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(new Date(post.published_at), 'yyyy/MM/dd')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {post.slug && (
                    <a
                      href={`/post/${post.slug}?site_id=${siteId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                      title="プレビュー"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(post)} className="text-slate-400 hover:text-slate-700 h-8 w-8">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeletePost(post)} className="text-red-400 hover:bg-red-50 h-8 w-8">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 作成/編集モーダル */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? '記事を編集' : '新規記事'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">種別</label>
                <Select value={form.post_type} onValueChange={v => setForm(p => ({ ...p, post_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ステータス</label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">タイトル *</label>
              <Input
                value={form.title || ''}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="記事タイトル"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">スラッグ (URL)</label>
              <Input
                value={form.slug || ''}
                onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                placeholder="my-post-slug"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">抜粋</label>
              <Textarea
                value={form.excerpt || ''}
                onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
                placeholder="記事の概要（一覧ページで使用）"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">本文（HTML）</label>
              <Textarea
                value={form.content || ''}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="本文を入力してください..."
                rows={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">アイキャッチ画像URL</label>
              <Input
                value={form.featured_image_url || ''}
                onChange={e => setForm(p => ({ ...p, featured_image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {categories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">カテゴリー</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const selected = (form.category_ids || []).includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const ids = form.category_ids || [];
                          setForm(p => ({
                            ...p,
                            category_ids: selected ? ids.filter(i => i !== cat.id) : [...ids, cat.id],
                          }));
                        }}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          selected ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-300 text-slate-600 hover:border-amber-400'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">タグ</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const selected = (form.tag_ids || []).includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const ids = form.tag_ids || [];
                          setForm(p => ({
                            ...p,
                            tag_ids: selected ? ids.filter(i => i !== tag.id) : [...ids, tag.id],
                          }));
                        }}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          selected ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-300 text-slate-600 hover:border-slate-500'
                        }`}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>キャンセル</Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {editingPost ? '更新' : '作成'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記事を削除</AlertDialogTitle>
            <AlertDialogDescription>「{deletePost?.title}」を削除してもよろしいですか？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletePost.id)} className="bg-red-600 hover:bg-red-700">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =========================================================
// カテゴリー管理タブ
// =========================================================
function CategoriesTab({ siteId }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['postCategories', siteId],
    queryFn: () => base44.entities.PostCategory.filter({ site_id: siteId }, 'sort_order'),
    enabled: !!siteId,
  });

  const createMutation = useMutation({
    mutationFn: (n) => base44.entities.PostCategory.create({ site_id: siteId, name: n, slug: slugify(n) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['postCategories', siteId] }); setName(''); toast.success('カテゴリーを追加しました'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PostCategory.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['postCategories', siteId] }); setDeleteId(null); toast.success('削除しました'); },
  });

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="カテゴリー名"
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), name.trim() && createMutation.mutate(name.trim()))}
        />
        <Button onClick={() => name.trim() && createMutation.mutate(name.trim())} className="bg-amber-600 hover:bg-amber-700 gap-1.5" disabled={createMutation.isPending}>
          <Plus className="w-4 h-4" />追加
        </Button>
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">カテゴリーがありません</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{cat.name}</p>
                <p className="text-xs text-slate-400">/{cat.slug}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(cat.id)} className="text-red-400 hover:bg-red-50 h-8 w-8">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリーを削除</AlertDialogTitle>
            <AlertDialogDescription>このカテゴリーを削除しますか？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700">削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =========================================================
// タグ管理タブ
// =========================================================
function TagsTab({ siteId }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');

  const { data: tags = [] } = useQuery({
    queryKey: ['postTags', siteId],
    queryFn: () => base44.entities.PostTag.filter({ site_id: siteId }),
    enabled: !!siteId,
  });

  const createMutation = useMutation({
    mutationFn: (n) => base44.entities.PostTag.create({ site_id: siteId, name: n, slug: slugify(n) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['postTags', siteId] }); setName(''); toast.success('タグを追加しました'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PostTag.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['postTags', siteId] }); toast.success('削除しました'); },
  });

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="タグ名"
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), name.trim() && createMutation.mutate(name.trim()))}
        />
        <Button onClick={() => name.trim() && createMutation.mutate(name.trim())} className="bg-amber-600 hover:bg-amber-700 gap-1.5" disabled={createMutation.isPending}>
          <Plus className="w-4 h-4" />追加
        </Button>
      </div>
      {tags.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">タグがありません</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-sm px-3 py-1.5 rounded-full">
              <span>#{tag.name}</span>
              <button onClick={() => deleteMutation.mutate(tag.id)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =========================================================
// メインページ
// =========================================================
export default function AdminPostManager() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');

  // サイト一覧から選択（site_idがない場合の補完）
  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-created_date', 20),
    enabled: !siteId,
  });
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const effectiveSiteId = siteId || selectedSiteId;

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="記事管理">
        <div className="max-w-5xl space-y-6">

          {/* サイト選択（URLにsite_idがない場合） */}
          {!siteId && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700 shrink-0">サイトを選択：</label>
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="サイトを選んでください" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {!effectiveSiteId ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <p className="text-3xl mb-2">📋</p>
                <p className="font-medium">サイトを選択してください</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="posts">
              <TabsList className="mb-4">
                <TabsTrigger value="posts" className="gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />記事一覧
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />カテゴリー
                </TabsTrigger>
                <TabsTrigger value="tags" className="gap-1.5">
                  <Tag className="w-3.5 h-3.5" />タグ
                </TabsTrigger>
              </TabsList>
              <TabsContent value="posts">
                <PostsTab siteId={effectiveSiteId} />
              </TabsContent>
              <TabsContent value="categories">
                <CategoriesTab siteId={effectiveSiteId} />
              </TabsContent>
              <TabsContent value="tags">
                <TagsTab siteId={effectiveSiteId} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}