/**
 * AdminBlogEditor
 * ブログ記事作成・編集（ブロック型 + AI統合）
 * AI生成→編集→公開を1画面で完結
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import BlockEditor from '@/components/blog/BlockEditor';
import AIBlogGeneratorPanel from '@/components/blog/AIBlogGeneratorPanel';
import TableOfContents from '@/components/blog/TableOfContents';
import { generateExcerpt } from '@/lib/blockUtils';

const STATUS_OPTIONS = [
  { value: 'draft', label: '下書き' },
  { value: 'published', label: '公開' },
];

export default function AdminBlogEditor() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('id');
  const siteId = searchParams.get('site_id');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    blocks: [],
    status: 'draft',
    category_id: '',
    tag_ids: [],
    thumbnail_url: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    featured: false,
    generate_toc: true,
  });
  const [showPreview, setShowPreview] = useState(false);

  // ===== 記事取得 =====
  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => base44.asServiceRole.entities.Article.get(articleId),
    enabled: !!articleId,
  });

  // ===== カテゴリ取得 =====
  const { data: categories = [] } = useQuery({
    queryKey: ['post_categories', siteId],
    queryFn: () =>
      base44.asServiceRole.entities.PostCategory.filter({ site_id: siteId }),
  });

  // ===== 保存 =====
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (articleId) {
        return base44.asServiceRole.entities.Article.update(articleId, data);
      } else {
        return base44.asServiceRole.entities.Article.create({
          ...data,
          site_id: siteId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article'] });
      toast.success(articleId ? '記事を更新しました' : '記事を作成しました');
    },
    onError: (err) => {
      toast.error('保存に失敗しました: ' + err.message);
    },
  });

  useEffect(() => {
    if (article) {
      setForm(article);
    }
  }, [article]);

  const handleBlocksChange = (newBlocks) => {
    setForm(p => ({
      ...p,
      blocks: newBlocks,
      excerpt: generateExcerpt(newBlocks),
    }));
  };

  const handleAIInsert = (generated) => {
    setForm(p => ({
      ...p,
      title: p.title || generated.title,
      blocks: generated.blocks,
      excerpt: generated.excerpt,
      seo_title: generated.seo_title || p.seo_title,
      seo_description: generated.seo_description || p.seo_description,
    }));
    toast.success('AIが生成した記事をエディタに挿入しました');
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }
    if (form.blocks.length === 0) {
      toast.error('最低1つのブロックが必要です');
      return;
    }

    const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, '-');
    saveMutation.mutate({
      ...form,
      slug,
      published_at: form.status === 'published' ? new Date().toISOString() : null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* ━━━ ヘッダ ━━━ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ブログ記事{articleId ? '編集' : '作成'}</h1>
            <p className="text-sm text-slate-500 mt-1">ブロックエディタ + AI生成</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? '編集' : 'プレビュー'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-violet-600 gap-2"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存
            </Button>
          </div>
        </div>

        {showPreview ? (
          // ━━━ プレビュー画面 ━━━
          <div className="bg-white rounded-lg shadow-lg p-8 prose max-w-4xl mx-auto">
            <h1>{form.title}</h1>
            {form.generate_toc && <TableOfContents blocks={form.blocks} />}
            <BlockRenderer blocks={form.blocks} />
          </div>
        ) : (
          // ━━━ 編集画面 ━━━
          <div className="space-y-6">
            {/* ━━━ AI生成パネル（最上部） ━━━ */}
            {!articleId && (
              <AIBlogGeneratorPanel siteId={siteId} onArticleInsert={handleAIInsert} />
            )}

            {/* ━━━ メイン記事情報 ━━━ */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block">タイトル</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="記事タイトル..."
                  className="text-lg font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block">URL スラグ</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))}
                  placeholder="url-slug"
                  className="text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">自動生成: {form.title.toLowerCase().replace(/\s+/g, '-')}</p>
              </div>
            </div>

            {/* ━━━ ブロックエディタ（中段） ━━━ */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">記事本文</h2>
              <BlockEditor blocks={form.blocks} onChange={handleBlocksChange} />
            </div>

            {/* ━━━ 目次表示（オプション） ━━━ */}
            {form.blocks.length > 0 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
                <label className="text-sm font-semibold">目次を表示</label>
                <Switch
                  checked={form.generate_toc}
                  onCheckedChange={(v) => setForm(p => ({ ...p, generate_toc: v }))}
                />
              </div>
            )}

            {/* ━━━ SEO & 公開設定（下段） ━━━ */}
            <div className="grid grid-cols-2 gap-6">
              {/* ━━━ SEO設定 ━━━ */}
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h3 className="font-bold text-base">SEO設定</h3>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">SEOタイトル</label>
                  <Input
                    value={form.seo_title}
                    onChange={(e) => setForm(p => ({ ...p, seo_title: e.target.value }))}
                    placeholder="60文字以内"
                    className="text-sm"
                    maxLength={60}
                  />
                  <p className="text-xs text-slate-400 mt-1">{form.seo_title.length} / 60</p>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">メタディスクリプション</label>
                  <Input
                    value={form.seo_description}
                    onChange={(e) => setForm(p => ({ ...p, seo_description: e.target.value }))}
                    placeholder="160文字以内"
                    className="text-sm"
                    maxLength={160}
                  />
                  <p className="text-xs text-slate-400 mt-1">{form.seo_description.length} / 160</p>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">SEOキーワード</label>
                  <Input
                    value={form.seo_keywords}
                    onChange={(e) => setForm(p => ({ ...p, seo_keywords: e.target.value }))}
                    placeholder="キーワード1, キーワード2"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* ━━━ 公開設定 ━━━ */}
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h3 className="font-bold text-base">公開設定</h3>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">ステータス</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">カテゴリ</label>
                  <select
                    value={form.category_id || ''}
                    onChange={(e) => setForm(p => ({ ...p, category_id: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">カテゴリなし</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold">トップに表示</label>
                  <Switch
                    checked={form.featured}
                    onCheckedChange={(v) => setForm(p => ({ ...p, featured: v }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ブロック配列をレンダリング（プレビュー用）
 */
function BlockRenderer({ blocks }) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading':
            const HTag = `h${block.level}`;
            return (
              <HTag key={block.id} className="font-bold" id={block.id}>
                {block.content}
              </HTag>
            );
          case 'paragraph':
            return (
              <p key={block.id} className="leading-relaxed">
                {block.content}
              </p>
            );
          case 'image':
            return (
              <div key={block.id} className={`text-${block.align}`}>
                <img
                  src={block.image_url}
                  alt={block.alt_text}
                  style={{ width: `${block.width}%` }}
                  className="rounded-lg"
                />
                {block.alt_text && (
                  <p className="text-xs text-slate-500 mt-1">{block.alt_text}</p>
                )}
              </div>
            );
          case 'list':
            const ListTag = block.list_type === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={block.id} className="ml-5 space-y-1">
                {block.items?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ListTag>
            );
          case 'quote':
            return (
              <blockquote key={block.id} className="pl-4 border-l-4 border-slate-300 italic">
                {block.content}
                {block.citation && (
                  <footer className="text-sm mt-2">— {block.citation}</footer>
                )}
              </blockquote>
            );
          case 'separator':
            return <hr key={block.id} className="my-4" />;
          case 'code':
            return (
              <pre key={block.id} className="bg-slate-100 p-3 rounded overflow-auto">
                <code>{block.content}</code>
              </pre>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}