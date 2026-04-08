/**
 * PostDetailPage - 公開向け記事詳細ページ
 * /post/:slug?site_id=xxx
 * 目次自動生成・SEO対応・リッチスタイル
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Loader2, ChevronUp } from 'lucide-react';

const POST_TYPE_LABELS = {
  news: 'お知らせ',
  blog: 'ブログ',
  column: 'コラム',
  campaign: 'キャンペーン',
};

/** h2/h3をHTMLから抽出して目次データを生成 */
function extractToc(html) {
  const matches = [...(html || '').matchAll(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi)];
  return matches.map((m, i) => ({
    level: parseInt(m[1]),
    text: m[3].replace(/<[^>]+>/g, '').trim(),
    id: `heading-${i}`,
  }));
}

/** HTMLのh2/h3にid属性を付与する */
function injectHeadingIds(html) {
  let i = 0;
  return (html || '').replace(/<h([23])([^>]*)>/gi, (match, level, attrs) => {
    return `<h${level}${attrs} id="heading-${i++}">`;
  });
}

export default function PostDetailPage() {
  const { slug } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');
  const [activeHeading, setActiveHeading] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['post-detail', siteId, slug],
    queryFn: () => base44.entities.Post.filter({ site_id: siteId, slug }),
    enabled: !!siteId && !!slug,
  });

  const post = posts[0] || null;
  const toc = useMemo(() => extractToc(post?.content), [post?.content]);
  const processedContent = useMemo(() => injectHeadingIds(post?.content), [post?.content]);

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
    setOg('og:description', post.seo_description || post.excerpt);
    setOg('og:image', post.og_image_url || post.featured_image_url);
    if (post.noindex) setMeta('robots', 'noindex');
    if (post.canonical_url) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
      link.href = post.canonical_url;
    }
  }, [post]);

  // スクロール監視（目次ハイライト + トップボタン）
  useEffect(() => {
    if (toc.length === 0) return;
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      const headings = toc.map(t => document.getElementById(t.id)).filter(Boolean);
      let current = '';
      for (const el of headings) {
        if (el.getBoundingClientRect().top <= 120) current = el.id;
      }
      setActiveHeading(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [toc]);

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          <p className="text-lg">記事が見つかりません</p>
          <a href={`/posts?site_id=${siteId}`} className="mt-4 inline-block text-sm text-amber-600 hover:underline">
            ← 記事一覧に戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-4xl mx-auto px-4 py-12">

        {/* ─── ヘッダー ─── */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-0.5 rounded-full">
              {POST_TYPE_LABELS[post.post_type] || post.post_type}
            </span>
            {post.published_at && (
              <time className="text-sm text-slate-400" dateTime={post.published_at}>
                {format(new Date(post.published_at), 'yyyy年MM月dd日')}
              </time>
            )}
            {post.author_name && (
              <span className="text-sm text-slate-400">by {post.author_name}</span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-slate-900 leading-snug mb-5" style={{ fontFamily: 'serif' }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-base text-slate-500 leading-relaxed border-l-4 border-amber-300 pl-4 bg-amber-50/30 py-2 rounded-r-lg">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* ─── アイキャッチ ─── */}
        {post.featured_image_url && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-sm">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full max-h-[480px] object-cover"
            />
          </div>
        )}

        {/* ─── 目次 ─── */}
        {toc.length >= 2 && (
          <nav className="mb-10 bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
              <span>📋</span>目次
            </p>
            <ol className="space-y-1.5">
              {toc.map((item, i) => (
                <li key={item.id} className={item.level === 3 ? 'ml-4' : ''}>
                  <button
                    onClick={() => scrollToHeading(item.id)}
                    className={`text-left text-sm hover:text-amber-600 transition-colors ${
                      activeHeading === item.id
                        ? 'text-amber-600 font-medium'
                        : 'text-slate-600'
                    } ${item.level === 3 ? 'text-xs' : ''}`}
                  >
                    {item.level === 2 && <span className="text-slate-400 mr-1.5">{i + 1}.</span>}
                    {item.level === 3 && <span className="text-slate-300 mr-1.5">└</span>}
                    {item.text}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* ─── 本文 ─── */}
        <div
          className="
            prose prose-slate max-w-none
            prose-headings:font-light prose-headings:text-slate-800
            prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-3 prose-h2:mt-10 prose-h2:mb-5
            prose-h3:text-xl prose-h3:text-slate-700 prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-slate-600 prose-p:leading-[1.9] prose-p:my-4
            prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-amber-300 prose-blockquote:bg-amber-50/40 prose-blockquote:text-slate-500 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-img:rounded-xl prose-img:shadow-md prose-img:my-8
            prose-ul:text-slate-600 prose-ol:text-slate-600
            prose-strong:text-slate-800 prose-strong:font-semibold
            prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-slate-900 prose-pre:text-slate-100
            prose-hr:border-slate-200 prose-hr:my-10
          "
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />

        {/* ─── フッター ─── */}
        <footer className="mt-14 pt-8 border-t border-slate-100">
          {post.published_at && (
            <p className="text-xs text-slate-400 mb-4">
              公開日: {format(new Date(post.published_at), 'yyyy年MM月dd日')}
            </p>
          )}
          <a
            href={`/posts?site_id=${siteId}`}
            className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline"
          >
            ← 記事一覧に戻る
          </a>
        </footer>
      </article>

      {/* ─── スクロールトップボタン ─── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-slate-700 hover:bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          aria-label="トップへ戻る"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}