/**
 * AdminPostEdit - 記事編集ページ（2カラムレイアウト）
 * /AdminPostEdit?site_id=xxx&post_id=xxx（新規はpost_idなし）
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, Eye, Image } from 'lucide-react';
import { toast } from 'sonner';
import BlockBasedPostEditor from '@/components/post/BlockBasedPostEditor';
import PostSeoPanel from '@/components/post/PostSeoPanel';
import PostCategoryTagPanel from '@/components/post/PostCategoryTagPanel';
import AIPostGeneratorPanel from '@/components/post/AIPostGeneratorPanel';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const POST_TYPES = [
  { value: 'news',     label: 'お知らせ' },
  { value: 'blog',     label: 'ブログ' },
  { value: 'column',   label: 'コラム' },
  { value: 'campaign', label: 'キャンペーン' },
];

const slugify = (text) =>
  text.toLowerCase().replace(/[\s\u3000]+/g, '-').replace(/[^\w\-]/g, '').replace(/--+/g, '-').trim() ||
  `post-${Date.now()}`;

export default function AdminPostEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId  = urlParams.get('site_id');
  const postId  = urlParams.get('post_id');
  const isNew   = !postId;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    site_id: siteId || '',
    post_type: 'blog',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    blocks: [],
    featured_image_url: '',
    status: 'draft',
    published_at: '',
    author_name: '',
    seo_title: '',
    seo_description: '',
    og_image_url: '',
    canonical_url: '',
    noindex: false,
    category_ids: [],
    tag_ids: [],
    featured: false,
    display_targets: {
      show_on_home: true,
      show_on_lp: false,
      home_page_ids: [],
      lp_ids: [],
    },
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // AI feature access
  const { data: aiAccess } = useFeatureAccess('ai_post_generation');
  const canUseAI = aiAccess?.allowed !== false;

  // 既存記事の取得
  const { data: postData, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => base44.entities.Post.filter({ id: postId }),
    enabled: !!postId,
  });

  // 取得した記事データをフォームに反映（旧content→blocks互換変換付き）
  React.useEffect(() => {
    if (postData && postData.length > 0) {
      const post = postData[0];
      let blocks = post.blocks || [];
      // 旧形式互換：content(HTML)があってblocksが空の場合、paragraphブロックに変換
      if (blocks.length === 0 && post.content) {
        blocks = [{
          id: `blk_migrated_${Date.now()}`,
          type: 'paragraph',
          html: post.content,
        }];
      }
      // 表示先設定がない場合は自動補完（後方互換性）
      const defaultDisplayTargets = {
        show_on_home: true,
        show_on_lp: false,
        home_page_ids: [],
        lp_ids: [],
      };
      setForm({ ...post, blocks, display_targets: post.display_targets || defaultDisplayTargets });
      setSlugTouched(true);
    }
  }, [postData]);

  // カテゴリー・タグ取得
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

  // ホームページの取得（表示先設定用）
  const { data: homePages = [] } = useQuery({
    queryKey: ['sitePages', siteId],
    queryFn: () => base44.entities.SitePage.filter({ site_id: siteId }, 'sort_order'),
    enabled: !!siteId,
  });

  // LPの取得（表示先設定用）
  const { data: lps = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date'),
  });

  // タイトル変更時にスラッグ自動生成
  useEffect(() => {
    if (!slugTouched && form.title) {
      setForm(p => ({ ...p, slug: slugify(form.title) }));
    }
  }, [form.title, slugTouched]);

  // 保存ミューテーション
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isNew) {
        return base44.entities.Post.create(data);
      } else {
        return base44.entities.Post.update(postId, data);
      }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['posts', siteId] });
      toast.success(isNew ? '記事を作成しました' : '記事を保存しました');
      if (isNew && result?.id) {
        navigate(`/AdminPostEdit?site_id=${siteId}&post_id=${result.id}`, { replace: true });
      }
    },
    onError: (err) => {
      toast.error('保存に失敗しました: ' + err.message);
    },
  });

  const handleSave = (statusOverride) => {
    const data = { ...form };
    if (statusOverride) data.status = statusOverride;
    if (data.status === 'published' && !data.published_at) {
      data.published_at = new Date().toISOString();
    }
    // ブロック配列が空でなければ使用、なければ空文字列（旧contentはDB内で保持）
    if (!data.blocks || data.blocks.length === 0) {
      data.blocks = [];
    }
    saveMutation.mutate(data);
  };

  // アイキャッチ画像アップロード
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImageUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm(p => ({ ...p, featured_image_url: res.file_url }));
      toast.success('画像をアップロードしました');
    } catch {
      toast.error('アップロードに失敗しました');
    } finally {
      setIsImageUploading(false);
      e.target.value = '';
    }
  };

  // AI生成結果の反映（blocks対応）
  const handleApplyAll = (generated) => {
    // AI結果をブロック配列に変換（generated.blocksがあればそのまま使用）
    let newBlocks = generated.blocks || [];
    if (newBlocks.length === 0 && generated.content) {
      // HTML文字列が返ってきた場合はparagraphブロックに変換
      newBlocks = [{
        id: `blk_ai_${Date.now()}`,
        type: 'paragraph',
        html: generated.content,
      }];
    }
    setForm(p => ({
      ...p,
      title:           generated.title       || p.title,
      excerpt:         generated.excerpt      || p.excerpt,
      blocks:          newBlocks.length > 0 ? newBlocks : p.blocks,
      seo_title:       generated.seo_title    || p.seo_title,
      seo_description: generated.seo_description || p.seo_description,
      slug: !slugTouched && generated.title ? slugify(generated.title) : p.slug,
    }));
    toast.success('記事内容を反映しました');
  };

  const handleApplyTitle = (generated) => {
    setForm(p => ({
      ...p,
      title:  generated.title || p.title,
      excerpt: generated.excerpt || p.excerpt,
    }));
    toast.success('タイトルと抜粋を反映しました');
  };

  if (isLoadingPost) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="記事編集">
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="editor-container">
        {/* ── ヘッダー ── */}
        <div className="editor-header">
          <Input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="記事タイトル"
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:border-amber-500 px-0 bg-transparent text-lg font-bold"
          />
          
          {form.slug && !isNew && (
            <a
              href={`/post/${form.slug}?site_id=${siteId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />プレビュー
            </a>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            disabled={saveMutation.isPending}
            className="gap-1.5"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            下書き保存
          </Button>
          
          <Button
            size="sm"
            onClick={() => handleSave('published')}
            disabled={saveMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 gap-1.5"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {form.status === 'published' ? '更新・公開' : '公開する'}
          </Button>
        </div>

        {/* ── ボディ ── */}
        <div className="editor-body">
          <div className="max-w-7xl mx-auto p-6">
            {/* 2カラムレイアウト */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

              {/* ── 左カラム: コンテンツ ── */}
              <div className="space-y-4">
              {/* タイトル */}
              <div>
                <Input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="記事タイトルを入力..."
                  className="text-xl font-bold h-12 border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-amber-500 bg-transparent"
                />
              </div>

              {/* スラッグ */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">URL: /post/</span>
                <Input
                  value={form.slug}
                  onChange={e => { setSlugTouched(true); setForm(p => ({ ...p, slug: e.target.value })); }}
                  placeholder="url-slug"
                  className="h-7 text-xs text-slate-500 border-slate-200"
                />
              </div>

              {/* 抜粋 */}
              <Textarea
                value={form.excerpt}
                onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
                placeholder="記事の抜粋・要約（検索結果やSNSシェア時に表示）"
                rows={2}
                className="resize-none text-sm"
              />

              {/* 本文ブロックエディタ */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h3 className="text-sm font-bold text-slate-700 mb-3">本文ブロック</h3>
                <BlockBasedPostEditor
                  blocks={form.blocks || []}
                  onChange={(newBlocks) => setForm(p => ({ ...p, blocks: newBlocks }))}
                />
              </div>
            </div>

            {/* ── 右カラム: AI + 設定 ── */}
            <div className="space-y-4">

              {/* AIパネル */}
              <Card>
                <CardContent className="pt-4">
                  <AIPostGeneratorPanel
                    siteId={siteId}
                    onApplyAll={handleApplyAll}
                    onApplyTitle={handleApplyTitle}
                    canUseAI={canUseAI}
                  />
                </CardContent>
              </Card>

              {/* 公開設定 */}
              <Card>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm">公開設定</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="label-xs">記事タイプ</label>
                    <Select value={form.post_type} onValueChange={v => setForm(p => ({ ...p, post_type: v }))}>
                      <SelectTrigger className="h-8 text-sm mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="label-xs">著者名</label>
                    <Input
                      value={form.author_name}
                      onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))}
                      placeholder="著者名"
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="label-xs">公開日時</label>
                    <Input
                      type="datetime-local"
                      value={form.published_at ? form.published_at.slice(0, 16) : ''}
                      onChange={e => setForm(p => ({ ...p, published_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">ステータス</span>
                    <Badge
                      className={form.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'}
                    >
                      {form.status === 'published' ? '公開中' : '下書き'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* アイキャッチ画像 */}
              <Card>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm">アイキャッチ画像</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {form.featured_image_url && (
                    <img src={form.featured_image_url} alt="" className="w-full h-32 object-cover rounded-lg" />
                  )}
                  <label className="flex items-center gap-2 cursor-pointer w-full border border-dashed border-slate-300 bg-slate-50 rounded-lg px-3 py-2.5 hover:border-amber-400 transition-colors">
                    {isImageUploading
                      ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      : <Image className="w-4 h-4 text-slate-400" />}
                    <span className="text-xs text-slate-500">画像をアップロード</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isImageUploading} />
                  </label>
                  <Input
                    value={form.featured_image_url}
                    onChange={e => setForm(p => ({ ...p, featured_image_url: e.target.value }))}
                    placeholder="または画像URLを直接入力"
                    className="h-8 text-xs"
                  />
                </CardContent>
              </Card>

              {/* カテゴリー / タグ */}
              <Card>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm">カテゴリー / タグ</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <PostCategoryTagPanel
                    categories={categories}
                    tags={tags}
                    form={form}
                    setForm={setForm}
                    siteId={siteId}
                  />
                </CardContent>
              </Card>

              {/* 表示先設定 */}
              <Card>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm">表示先設定</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.display_targets?.show_on_home ?? true}
                        onChange={e => setForm(p => ({
                          ...p,
                          display_targets: { ...p.display_targets, show_on_home: e.target.checked }
                        }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-slate-700">ホームページに表示</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.display_targets?.show_on_lp ?? false}
                        onChange={e => setForm(p => ({
                          ...p,
                          display_targets: { ...p.display_targets, show_on_lp: e.target.checked }
                        }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-slate-700">LPに表示</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">トップに表示</label>
                    <Switch
                      checked={form.featured ?? false}
                      onCheckedChange={v => setForm(p => ({ ...p, featured: v }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SEO設定 */}
              <Card>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm">SEO設定</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <PostSeoPanel form={form} setForm={setForm} />
                </CardContent>
              </Card>

              </div>
          </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}