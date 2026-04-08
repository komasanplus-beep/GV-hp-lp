/**
 * AdminPostEdit - 記事編集画面
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Save, Loader2, ArrowLeft, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import PostEditor from '@/components/post/PostEditor';
import PostSeoPanel from '@/components/post/PostSeoPanel';
import PostCategoryTagPanel from '@/components/post/PostCategoryTagPanel';

const POST_TYPES = [
  { value: 'news', label: 'お知らせ' },
  { value: 'blog', label: 'ブログ' },
  { value: 'column', label: 'コラム' },
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
  category_ids: [],
  tag_ids: [],
  seo_title: '',
  seo_description: '',
  og_image_url: '',
  canonical_url: '',
  noindex: false,
};

// タイトルからスラッグを自動生成
function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^a-z0-9\-ぁ-ん一-龯ァ-ン]/g, '')
    .slice(0, 80);
}

export default function AdminPostEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');
  const postId = urlParams.get('post_id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(defaultForm);
  const [isUploading, setIsUploading] = useState(false);

  // 既存記事の取得
  const { data: existingPost } = useQuery({
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

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        site_id: siteId,
        published_at: data.status === 'published' && !data.published_at
          ? new Date().toISOString()
          : data.published_at,
      };
      return postId
        ? base44.entities.Post.update(postId, payload)
        : base44.entities.Post.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', siteId] });
      toast.success(postId ? '記事を更新しました' : '記事を作成しました');
      navigate(`/AdminPostList?site_id=${siteId}`);
    },
    onError: (err) => toast.error(`保存失敗: ${err.message}`),
  });

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm(p => ({
      ...p,
      title,
      slug: p.slug || toSlug(title),
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

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title={postId ? '記事を編集' : '新規記事作成'}>
        <div className="max-w-6xl">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <button
              onClick={() => navigate(`/AdminPostList?site_id=${siteId}`)}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />記事一覧に戻る
            </button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSave('draft')} disabled={saveMutation.isPending}>
                下書き保存
              </Button>
              <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={() => handleSave('published')} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                公開
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main: Title + Content */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">タイトル *</label>
                    <Input
                      value={form.title}
                      onChange={handleTitleChange}
                      placeholder="記事タイトルを入力"
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">スラッグ（URL）</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 flex-shrink-0">/post/</span>
                      <Input
                        value={form.slug}
                        onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                        placeholder="my-post-slug"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">抜粋</label>
                    <Textarea
                      value={form.excerpt}
                      onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
                      placeholder="一覧に表示される抜粋文..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">本文</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <PostEditor value={form.content} onChange={v => setForm(p => ({ ...p, content: v }))} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* 公開設定 */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">公開設定</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">記事タイプ</label>
                    <Select value={form.post_type} onValueChange={v => setForm(p => ({ ...p, post_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">著者名</label>
                    <Input
                      value={form.author_name}
                      onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))}
                      placeholder="スタッフ名など"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* アイキャッチ */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">アイキャッチ画像</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                  {form.featured_image_url && (
                    <img src={form.featured_image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                  )}
                  <label className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-3 cursor-pointer hover:border-amber-300 transition-colors">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                      <span className="text-xs text-slate-500 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />画像をアップロード
                      </span>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                  {form.featured_image_url && (
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, featured_image_url: '' }))}
                      className="text-xs text-red-400 hover:text-red-600 mt-1"
                    >
                      画像を削除
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* カテゴリー・タグ・SEO タブ */}
              <Card>
                <CardContent className="p-4">
                  <Tabs defaultValue="categories">
                    <TabsList className="w-full mb-3">
                      <TabsTrigger value="categories" className="flex-1 text-xs">カテゴリー/タグ</TabsTrigger>
                      <TabsTrigger value="seo" className="flex-1 text-xs">SEO</TabsTrigger>
                    </TabsList>
                    <TabsContent value="categories">
                      <PostCategoryTagPanel
                        categories={categories}
                        tags={tags}
                        form={form}
                        setForm={setForm}
                      />
                    </TabsContent>
                    <TabsContent value="seo">
                      <PostSeoPanel form={form} setForm={setForm} />
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