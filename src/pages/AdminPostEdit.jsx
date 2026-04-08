/**
 * AdminPostEdit - 本格CMS記事編集ページ（WordPress水準）
 * /AdminPostEdit?site_id=xxx           → 新規作成
 * /AdminPostEdit?site_id=xxx&post_id=yyy → 編集
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Save, Loader2, ArrowLeft, ImageIcon, Eye, Globe, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import PostEditor from '@/components/post/PostEditor';
import PostCategoryTagPanel from '@/components/post/PostCategoryTagPanel';
import { format } from 'date-fns';

const POST_TYPES = [
  { value: 'news',     label: 'お知らせ' },
  { value: 'blog',     label: 'ブログ' },
  { value: 'column',   label: 'コラム' },
  { value: 'campaign', label: 'キャンペーン' },
];

const defaultForm = {
  title: '',
  slug: '',
  post_type: 'blog',
  excerpt: '',
  content: '',
  featured_image_url: '',
  author_name: '',
  status: 'draft',
  published_at: '',
  category_ids: [],
  tag_ids: [],
  seo_title: '',
  seo_description: '',
  og_image_url: '',
  canonical_url: '',
  noindex: false,
};

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^a-z0-9\-ぁ-ん一-龯ァ-ン]/g, '')
    .slice(0, 80);
}

/** h2/h3をHTMLから抽出して目次プレビューを生成 */
function extractToc(html) {
  const matches = [...(html || '').matchAll(/<h([23])[^>]*>(.*?)<\/h[23]>/gi)];
  return matches.map((m, i) => ({
    level: parseInt(m[1]),
    text: m[2].replace(/<[^>]+>/g, '').trim(),
    id: `toc-${i}`,
  }));
}

export default function AdminPostEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');
  const postId = urlParams.get('post_id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(defaultForm);
  const [isUploading, setIsUploading] = useState(false);
  const [showTocPreview, setShowTocPreview] = useState(false);

  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => base44.entities.Post.filter({ id: postId }).then(r => r[0]),
    enabled: !!postId,
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

  useEffect(() => {
    if (existingPost) {
      setForm({ ...defaultForm, ...existingPost });
    }
  }, [existingPost]);

  // 目次プレビュー
  const toc = useMemo(() => extractToc(form.content), [form.content]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        site_id: siteId,
        published_at: data.status === 'published' && !data.published_at
          ? new Date().toISOString()
          : (data.published_at || null),
      };
      return postId
        ? base44.entities.Post.update(postId, payload)
        : base44.entities.Post.create(payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['posts', siteId] });
      toast.success(postId ? '記事を更新しました' : '記事を作成しました');
      // 新規作成時は編集ページに遷移（以後は更新）
      if (!postId && result?.id) {
        navigate(`/AdminPostEdit?site_id=${siteId}&post_id=${result.id}`);
      }
    },
    onError: (err) => toast.error(`保存失敗: ${err.message}`),
  });

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm(p => ({
      ...p,
      title,
      slug: p.slug || toSlug(title),
      seo_title: p.seo_title || title,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, featured_image_url: file_url }));
    setIsUploading(false);
  };

  const handleSave = (status) => {
    if (!form.title) { toast.error('タイトルは必須です'); return; }
    saveMutation.mutate({ ...form, status });
  };

  const handlePublishNow = () => {
    if (!form.title) { toast.error('タイトルは必須です'); return; }
    saveMutation.mutate({
      ...form,
      status: 'published',
      published_at: new Date().toISOString(),
    });
  };

  if (postId && isLoadingPost) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="記事を編集">
          <div className="flex justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  const isPublished = form.status === 'published';

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title={postId ? '記事を編集' : '新規記事作成'}>
        <div className="max-w-7xl">
          {/* ─── トップバー ─── */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <button
              onClick={() => navigate(`/AdminPostManager?site_id=${siteId}`)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />記事一覧に戻る
            </button>

            <div className="flex items-center gap-2">
              {/* ステータス表示 */}
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                isPublished
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {isPublished ? '公開中' : '下書き'}
              </span>

              {/* プレビュー */}
              {form.slug && (
                <a
                  href={`/post/${form.slug}?site_id=${siteId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-amber-600 transition-colors border border-slate-200 px-3 py-1.5 rounded-md hover:border-amber-300"
                >
                  <Eye className="w-3.5 h-3.5" />プレビュー
                </a>
              )}

              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={saveMutation.isPending}
                className="gap-1.5"
              >
                {saveMutation.isPending && form.status === 'draft'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <FileText className="w-3.5 h-3.5" />
                }
                下書き保存
              </Button>

              <Button
                className="bg-amber-600 hover:bg-amber-700 gap-1.5"
                onClick={() => handleSave('published')}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Globe className="w-3.5 h-3.5" />
                }
                {isPublished ? '更新する' : '公開する'}
              </Button>
            </div>
          </div>

          {/* ─── 2カラムレイアウト ─── */}
          <div className="grid xl:grid-cols-[1fr_340px] gap-6">

            {/* ── 左カラム: タイトル + 本文 ── */}
            <div className="space-y-5">
              {/* タイトル・スラッグ・抜粋 */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <Input
                      value={form.title}
                      onChange={handleTitleChange}
                      placeholder="記事タイトルを入力..."
                      className="text-2xl font-semibold border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-amber-400 h-auto py-2 placeholder:text-slate-300"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 shrink-0">/post/</span>
                    <Input
                      value={form.slug}
                      onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                      placeholder="url-slug"
                      className="text-xs text-slate-500 font-mono h-7 border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">抜粋（一覧ページ・SNSに表示）</label>
                    <Textarea
                      value={form.excerpt}
                      onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
                      placeholder="記事の要約を120文字程度で..."
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 本文エディタ */}
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">本文エディタ</CardTitle>
                  {toc.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowTocPreview(p => !p)}
                      className="text-xs text-amber-600 hover:underline"
                    >
                      {showTocPreview ? '目次を隠す' : `目次プレビュー (${toc.length}件)`}
                    </button>
                  )}
                </CardHeader>

                {/* 目次プレビュー */}
                {showTocPreview && toc.length > 0 && (
                  <div className="mx-5 mb-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">目次プレビュー</p>
                    <ol className="space-y-1">
                      {toc.map((item, i) => (
                        <li key={i} className={`text-sm text-slate-700 ${item.level === 3 ? 'ml-4 text-xs text-slate-500' : ''}`}>
                          {item.level === 2 ? `${i + 1}. ` : '　└ '}{item.text}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <CardContent className="p-5 pt-0">
                  <PostEditor value={form.content} onChange={v => setForm(p => ({ ...p, content: v }))} />
                </CardContent>
              </Card>
            </div>

            {/* ── 右サイドバー ── */}
            <div className="space-y-4">

              {/* 公開設定 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700">公開設定</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {/* 記事タイプ */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">記事タイプ</label>
                    <Select value={form.post_type} onValueChange={v => setForm(p => ({ ...p, post_type: v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 著者名 */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">著者名</label>
                    <Input
                      value={form.author_name}
                      onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))}
                      placeholder="スタッフ名など"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* 公開日時 */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">公開日時</label>
                    <Input
                      type="datetime-local"
                      value={form.published_at ? form.published_at.slice(0, 16) : ''}
                      onChange={e => setForm(p => ({ ...p, published_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                      className="h-9 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, published_at: new Date().toISOString() }))}
                      className="mt-1 flex items-center gap-1 text-xs text-amber-600 hover:underline"
                    >
                      <Clock className="w-3 h-3" />今すぐの日時を設定
                    </button>
                  </div>

                  {/* 今すぐ公開ボタン */}
                  {!isPublished && (
                    <Button
                      onClick={handlePublishNow}
                      disabled={saveMutation.isPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-sm"
                    >
                      <Globe className="w-3.5 h-3.5" />今すぐ公開
                    </Button>
                  )}
                  {isPublished && form.published_at && (
                    <p className="text-xs text-slate-400 text-center">
                      公開日: {format(new Date(form.published_at), 'yyyy/MM/dd HH:mm')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* アイキャッチ画像 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700">アイキャッチ画像</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {form.featured_image_url ? (
                    <div className="space-y-2">
                      <img
                        src={form.featured_image_url}
                        alt=""
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, featured_image_url: '' }))}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        画像を削除
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 cursor-pointer hover:border-amber-300 transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-slate-300 mb-2" />
                          <span className="text-xs text-slate-400">クリックしてアップロード</span>
                          <span className="text-xs text-slate-300 mt-0.5">PNG, JPG, WebP</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </CardContent>
              </Card>

              {/* カテゴリー / タグ / SEO タブ */}
              <Card>
                <CardContent className="p-4">
                  <Tabs defaultValue="meta">
                    <TabsList className="w-full mb-3 grid grid-cols-2">
                      <TabsTrigger value="meta" className="text-xs">カテゴリー/タグ</TabsTrigger>
                      <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
                    </TabsList>

                    <TabsContent value="meta">
                      <PostCategoryTagPanel
                        categories={categories}
                        tags={tags}
                        form={form}
                        setForm={setForm}
                      />
                    </TabsContent>

                    <TabsContent value="seo">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">SEOタイトル</label>
                          <Input
                            value={form.seo_title || ''}
                            onChange={e => setForm(p => ({ ...p, seo_title: e.target.value }))}
                            placeholder="60文字以内推奨"
                            className="text-sm h-9"
                          />
                          <p className="text-xs text-slate-400 mt-1">{(form.seo_title || '').length} / 60</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">メタディスクリプション</label>
                          <Textarea
                            value={form.seo_description || ''}
                            onChange={e => setForm(p => ({ ...p, seo_description: e.target.value }))}
                            placeholder="160文字以内推奨"
                            rows={3}
                            className="text-sm resize-none"
                          />
                          <p className="text-xs text-slate-400 mt-1">{(form.seo_description || '').length} / 160</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">OG画像URL</label>
                          <Input
                            value={form.og_image_url || ''}
                            onChange={e => setForm(p => ({ ...p, og_image_url: e.target.value }))}
                            placeholder="https://..."
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">カノニカルURL</label>
                          <Input
                            value={form.canonical_url || ''}
                            onChange={e => setForm(p => ({ ...p, canonical_url: e.target.value }))}
                            placeholder="https://..."
                            className="text-sm h-9"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={form.noindex || false}
                            onCheckedChange={v => setForm(p => ({ ...p, noindex: v }))}
                          />
                          <label className="text-xs text-slate-600">noindex（検索非表示）</label>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}