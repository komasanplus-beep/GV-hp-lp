import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft } from 'lucide-react';

export default function BlogPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  const { data: posts = [] } = useQuery({
    queryKey: ['blogPost', postId],
    queryFn: () => base44.entities.BlogPost.filter({ id: postId }),
    enabled: !!postId,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['blogCategories'],
    queryFn: () => base44.entities.BlogCategory.list('name'),
  });
  const { data: allPosts = [] } = useQuery({
    queryKey: ['blogPostsRelated'],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 4),
  });

  const post = posts[0];
  const related = allPosts.filter(p => p.id !== postId && p.status === 'published').slice(0, 3);

  if (!post) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400">記事が見つかりません</div>
    </div>
  );

  const catName = categories.find(c => c.id === (post.category_id || post.category))?.name || post.category;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to={createPageUrl('BlogPage')} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> ブログ一覧へ戻る
        </Link>

        {post.thumbnail_url && (
          <img src={post.thumbnail_url} alt={post.title} className="w-full h-64 object-cover rounded-xl mb-6" />
        )}

        <div className="flex items-center gap-3 mb-4">
          {catName && <Badge className="bg-amber-100 text-amber-800 border-amber-200">{catName}</Badge>}
          <span className="text-sm text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(post.created_date).toLocaleDateString('ja-JP')}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-6">{post.title}</h1>

        <div
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">関連記事</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} to={createPageUrl(`BlogPost?id=${r.id}`)} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  {r.thumbnail_url && <img src={r.thumbnail_url} alt={r.title} className="w-full h-28 object-cover" />}
                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}