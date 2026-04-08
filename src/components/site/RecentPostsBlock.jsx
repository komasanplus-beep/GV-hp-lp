/**
 * RecentPostsBlock - サイトトップ表示用 新着記事ブロック
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function RecentPostsBlock({ d, siteId, postType, label }) {
  const { data: posts = [] } = useQuery({
    queryKey: ['recentPosts', siteId, postType],
    queryFn: () => base44.entities.Post.filter(
      { site_id: siteId, post_type: postType, status: 'published' },
      '-published_at',
      6
    ),
    enabled: !!siteId,
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          {d.title ? (
            <h2 className="text-3xl font-light text-slate-900" style={{ fontFamily: 'serif' }}>{d.title}</h2>
          ) : (
            <h2 className="text-3xl font-light text-slate-900" style={{ fontFamily: 'serif' }}>{label}</h2>
          )}
          <a
            href={`/posts?site_id=${siteId}&type=${postType}`}
            className="text-sm text-amber-600 hover:underline"
          >
            すべて見る →
          </a>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-slate-300 py-8 text-3xl">📝</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map(post => (
              <a
                key={post.id}
                href={`/post/${post.slug}?site_id=${siteId}`}
                className="flex items-start gap-4 py-4 group hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
              >
                {post.featured_image_url && (
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-20 h-14 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {post.published_at && (
                    <p className="text-xs text-slate-400 mb-1">{format(new Date(post.published_at), 'yyyy/MM/dd')}</p>
                  )}
                  <p className="text-slate-700 font-medium truncate group-hover:text-amber-700 transition-colors">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{post.excerpt}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}