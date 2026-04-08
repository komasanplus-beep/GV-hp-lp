/**
 * PostDetailPage - 公開向け記事詳細ページ
 * /post/:slug?site_id=xxx
 */
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

const POST_TYPE_LABELS = {
  news: 'お知らせ',
  blog: 'ブログ',
  column: 'コラム',
  campaign: 'キャンペーン',
};

export default function PostDetailPage() {
  const { slug } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['post-detail', siteId, slug],
    queryFn: () => base44.entities.Post.filter({ site_id: siteId, slug }),
    enabled: !!siteId && !!slug,
  });

  const post = posts[0] || null;

  // SEO head injection
  useEffect(() => {
    if (!post) return;
    document.title = post.seo_title || post.title;
    const setMeta = (name, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    const setOg = (prop, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.content = content;
    };
    setMeta('description', post.seo_description);
    setOg('og:title', post.seo_title || post.title);
    setOg('og:description', post.seo_description);
    setOg('og:image', post.og_image_url || post.featured_image_url);
    if (post.noindex) setMeta('robots', 'noindex');
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-5xl mb-4">404</p>
          <p>記事が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-amber-600 font-medium">{POST_TYPE_LABELS[post.post_type] || post.post_type}</span>
            {post.published_at && (
              <span className="text-sm text-slate-400">{format(new Date(post.published_at), 'yyyy年MM月dd日')}</span>
            )}
            {post.author_name && <span className="text-sm text-slate-400">by {post.author_name}</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-slate-900 leading-tight mb-4" style={{ fontFamily: 'serif' }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-slate-500 leading-relaxed border-l-4 border-amber-300 pl-4">{post.excerpt}</p>
          )}
        </header>

        {/* Eyecatch */}
        {post.featured_image_url && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img src={post.featured_image_url} alt={post.title} className="w-full max-h-96 object-cover" />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-slate max-w-none
            prose-headings:font-light prose-headings:text-slate-800
            prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 prose-h2:mb-4
            prose-h3:text-xl prose-h3:text-slate-700
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-amber-300 prose-blockquote:text-slate-500
            prose-img:rounded-lg prose-img:shadow-sm
            prose-ul:text-slate-600 prose-ol:text-slate-600
            prose-strong:text-slate-800
          "
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {/* Back */}
        <div className="mt-12 pt-8 border-t border-slate-100">
          <a href={`/posts?site_id=${siteId}`} className="text-sm text-amber-600 hover:underline">
            ← 記事一覧に戻る
          </a>
        </div>
      </article>
    </div>
  );
}