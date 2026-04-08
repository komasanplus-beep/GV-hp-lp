/**
 * AdminPostManager - 記事一覧管理ページ（専用ページ型・ポップアップ廃止）
 * /AdminPostManager?site_id=xxx
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Tag, FolderOpen, Eye, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const POST_TYPES = [
  { value: 'news',     label: 'お知らせ',     color: 'bg-blue-100 text-blue-700' },
  { value: 'blog',     label: 'ブログ',       color: 'bg-green-100 text-green-700' },
  { value: 'column',   label: 'コラム',       color: 'bg-purple-100 text-purple-700' },
  { value: 'campaign', label: 'キャンペーン', color: 'bg-orange-100 text-orange-700' },
];

const STATUSES = [
  { value: 'published', label: '公開中', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { value: 'draft',     label: '下書き', color: 'bg-slate-50 border-slate-200 text-slate-500' },
];

const slugify = (text) =>
  text.toLowerCase().replace(/[\s\u3000]+/g, '-').replace(/[^\w\-]/g, '').replace(/--+/g, '-').trim();

const typeLabel = (val) => POST_TYPES.find(t => t.value === val) ?? POST_TYPES[1];
const statusLabel = (val) => STATUSES.find(s => s.value === val) ?? STATUSES[1];

// =========================================================
// 記事一覧タブ
// =========================================================
function PostsTab({ siteId }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTarget, setFilterTarget] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletePost, setDeletePost] = useState(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', siteId],
    queryFn: () => base44.entities.Post.filter({ site_id: siteId }, '-published_at'),
    enabled: !!siteId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts', siteId] });
      setDeletePost(null);
      toast.success('記事を削除しました');
    },
  });

  // クイック公開/下書き切替
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Post.update(id, {
      status,
      published_at: status === 'published' ? new Date().toISOString() : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts', siteId] });
      toast.success('ステータスを変更しました');
    },
  });

  const filtered = posts.filter(p => {
    if (filterType !== 'all' && p.post_type !== filterType) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery && !p.title?.includes(searchQuery)) return false;
    if (filterTarget !== 'all') {
      const targets = p.display_targets || { show_on_home: true, show_on_lp: false };
      if (filterTarget === 'home' && !targets.show_on_home) return false;
      if (filterTarget === 'lp' && !targets.show_on_lp) return false;
      if (filterTarget === 'both' && !(targets.show_on_home && targets.show_on_lp)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* フィルターバー */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="タイトル検索..."
              className="pl-8 h-9 w-44 text-sm"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="種別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての種別</SelectItem>
              {POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTarget} onValueChange={setFilterTarget}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="表示先" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="home">ホームページのみ</SelectItem>
              <SelectItem value="lp">LPのみ</SelectItem>
              <SelectItem value="both">HP + LP</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-slate-400">{filtered.length} 件</span>
        </div>
        <Button
          onClick={() => navigate(`/AdminPostEdit?site_id=${siteId}`)}
          className="bg-amber-600 hover:bg-amber-700 gap-1.5 h-9"
        >
          <Plus className="w-4 h-4" />新規記事作成
        </Button>
      </div>

      {/* 一覧テーブル */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-400">
            <p className="text-3xl mb-2">📝</p>
            <p className="font-medium">記事がありません</p>
            <Button
              onClick={() => navigate(`/AdminPostEdit?site_id=${siteId}`)}
              className="mt-4 bg-amber-600 hover:bg-amber-700 gap-1.5"
            >
              <Plus className="w-4 h-4" />最初の記事を作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* ヘッダー */}
          <div className="hidden md:grid grid-cols-[auto_1fr_120px_100px_100px_130px_100px] gap-4 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
            <span className="w-14">画像</span>
            <span>タイトル</span>
            <span>種別</span>
            <span>ステータス</span>
            <span>表示先</span>
            <span>投稿日</span>
            <span>操作</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map(post => {
              const type = typeLabel(post.post_type);
              const status = statusLabel(post.status);
              const targets = post.display_targets || { show_on_home: true, show_on_lp: false };
              const targetText = targets.show_on_home && targets.show_on_lp ? 'HP+LP' : targets.show_on_home ? 'HP' : targets.show_on_lp ? 'LP' : '非表示';
              return (
                <div key={post.id} className="grid md:grid-cols-[auto_1fr_120px_100px_100px_130px_100px] gap-4 items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                  {/* サムネ */}
                  <div className="w-14 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                    {post.featured_image_url ? (
                      <img src={post.featured_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-lg">📄</div>
                    )}
                  </div>
                  {/* タイトル */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{post.title}</p>
                    {post.excerpt && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{post.excerpt}</p>
                    )}
                    <p className="text-xs text-slate-300 mt-0.5 truncate font-mono">/post/{post.slug}</p>
                  </div>
                  {/* 種別 */}
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type.color}`}>
                      {type.label}
                    </span>
                  </div>
                  {/* ステータス */}
                  <div>
                    <button
                      onClick={() => toggleStatusMutation.mutate({
                        id: post.id,
                        status: post.status === 'published' ? 'draft' : 'published',
                      })}
                      className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${status.color}`}
                    >
                      {status.label}
                    </button>
                  </div>
                  {/* 表示先 */}
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {targetText}
                    </span>
                  </div>
                  {/* 投稿日 */}
                  <div className="text-xs text-slate-400">
                    {post.published_at
                      ? format(new Date(post.published_at), 'yyyy/MM/dd HH:mm')
                      : '—'}
                  </div>
                  {/* 操作 */}
                  <div className="flex items-center gap-1">
                    {post.slug && (
                      <a
                        href={`/post/${post.slug}?site_id=${siteId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                        title="プレビュー"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/AdminPostEdit?site_id=${siteId}&post_id=${post.id}`)}
                      className="text-slate-400 hover:text-slate-700 h-8 w-8"
                      title="編集"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletePost(post)}
                      className="text-red-400 hover:bg-red-50 h-8 w-8"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 削除確認 */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記事を削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletePost?.title}」を完全に削除します。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletePost.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              削除する
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

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-created_date', 20),
  });
  const [selectedSiteId, setSelectedSiteId] = useState(siteId || '');

  // sites取得後、未選択なら最初のサイトを自動選択
  useEffect(() => {
    if (!selectedSiteId && sites.length > 0) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  const effectiveSiteId = siteId || selectedSiteId;

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="記事管理">
        <div className="max-w-6xl space-y-6">

          {!siteId && sites.length > 0 && (
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