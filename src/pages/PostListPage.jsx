/**
 * PostListPage - 公開向け記事一覧ページ (/news, /blog など)
 * ?site_id=xxx&type=news|blog|column|campaign
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

const POST_TYPE_LABELS = {
  news: 'お知らせ',
  blog: 'ブログ',
  column: 'コラム',
  campaign: 'キャンペーン',
};

export default function PostListPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');
  const typeFilter = urlParams.get('type') || null;

  const [activeCat, setActiveCat] = useState(null);
  const [activeTag, setActiveTag] = useState(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['publicPosts', siteId, typeFilter],
    queryFn: () => {
      const filter = { site_id: siteId, status: 'published' };
      if (typeFilter) filter.post_type = typeFilter;
      return base44.entities.Post.filter(filter, '-published_at');
    },
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

  const filtered = posts.filter(p => {
    if (activeCat && !(p.category_ids || []).includes(activeCat)) return false;
    if (activeTag && !(p.tag_ids || []).includes(activeTag)) return false;
    return true;
  });

  const pageTitle = typeFilter ? POST_TYPE_LABELS[typeFilter] : '記事一覧';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-light text-slate-900 mb-8" style={{ fontFamily: 'serif' }}>{pageTitle}</h1>

        {/* Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveCat(null)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${!activeCat ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-300 text-slate-600 hover:border-amber-400'}`}
            >
              すべて
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${activeCat === cat.id ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-300 text-slate-600 hover:border-amber-400'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${activeTag === tag.id ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-300 text-slate-500 hover:border-slate-500'}`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <p className="text-4xl mb-3">📝</p>
            <p>記事がありません</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {filtered.map(post => (
              <a
                key={post.id}
                href={`/post/${post.slug}?site_id=${siteId}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {post.featured_image_url && (
                  <img src={post.featured_image_url} alt={post.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-amber-600 font-medium">{POST_TYPE_LABELS[post.post_type] || post.post_type}</span>
                    {post.published_at && (
                      <span className="text-xs text-slate-400">{format(new Date(post.published_at), 'yyyy/MM/dd')}</span>
                    )}
                  </div>
                  <h2 className="font-medium text-slate-800 line-clamp-2 group-hover:text-amber-700 transition-colors">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{post.excerpt}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}