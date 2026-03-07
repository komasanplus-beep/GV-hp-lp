import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomeBlogSection() {
  const { data: posts = [] } = useQuery({
    queryKey: ['homeBlogPosts'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published', show_on_home: true }, 'home_block_order', 5),
  });

  if (posts.length === 0) return null;

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ブログ・お知らせ</h2>
            <p className="text-slate-500 mt-1 text-sm">最新情報をお届けします</p>
          </div>
          <Button variant="outline" asChild>
            <Link to={createPageUrl('BlogPage')}>
              もっと見る <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(0, 5).map(post => (
            <article key={post.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              {post.thumbnail_url && (
                <img src={post.thumbnail_url} alt={post.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <span className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.created_date).toLocaleDateString('ja-JP')}
                </span>
                <h3 className="font-semibold text-slate-800 line-clamp-2 mb-2">{post.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                  {post.excerpt || (post.content || '').replace(/<[^>]*>/g, '').slice(0, 80)}
                </p>
                <Link
                  to={createPageUrl(`BlogPost?id=${post.id}`)}
                  className="inline-flex items-center text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  続きを読む <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}