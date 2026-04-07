import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Tag, ChevronRight } from 'lucide-react';

export default function BlogPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category');
  const siteId = urlParams.get('site_id');
  const [selectedCategory, setSelectedCategory] = useState(categoryId || '');
  const [selectedMonth, setSelectedMonth] = useState('');

  const { data: posts = [] } = useQuery({
    queryKey: ['blogPosts', siteId],
    queryFn: () => (siteId
      ? base44.entities.BlogPost.filter({ site_id: siteId }, '-created_date', 100)
      : []),
    enabled: !!siteId,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['blogCategories'],
    queryFn: () => base44.entities.BlogCategory.list('name'),
  });

  const published = posts.filter(p => p.status === 'published');

  const filtered = published.filter(p => {
    const catMatch = !selectedCategory || p.category_id === selectedCategory || (p.category && p.category === selectedCategory);
    const month = selectedMonth ? new Date(p.created_date).toISOString().slice(0, 7) : '';
    const monthMatch = !selectedMonth || month === selectedMonth;
    return catMatch && monthMatch;
  });

  const months = [...new Set(published.map(p => new Date(p.created_date).toISOString().slice(0, 7)))].sort().reverse();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900">ブログ</h1>
          <p className="text-slate-500 mt-2">最新情報・お役立ち情報をお届けします</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 記事一覧 (左 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-400">記事が見つかりません</div>
            ) : (
              filtered.map(post => (
                <article key={post.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  {post.thumbnail_url && (
                    <img src={post.thumbnail_url} alt={post.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      {(post.category_id || post.category) && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                          {categories.find(c => c.id === (post.category_id || post.category))?.name || post.category}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.created_date).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">{post.title}</h2>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4">{post.excerpt || (post.content || '').replace(/<[^>]*>/g, '').slice(0, 120)}...</p>
                    <Link to={createPageUrl(`BlogPost?id=${post.id}`)} className="inline-flex items-center text-sm text-amber-600 hover:text-amber-700 font-medium">
                      続きを読む <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* サイドバー (右 1/3) */}
          <div className="space-y-6">
            {/* カテゴリ */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4" /> カテゴリ
              </h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!selectedCategory ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    すべて <span className="text-slate-400 ml-1">({published.length})</span>
                  </button>
                </li>
                {categories.map(cat => {
                  const count = published.filter(p => p.category_id === cat.id || p.category === cat.id).length;
                  return (
                    <li key={cat.id}>
                      <button
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat.id ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {cat.name} <span className="text-slate-400 ml-1">({count})</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 月別アーカイブ */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> 月別アーカイブ
              </h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedMonth('')}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!selectedMonth ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    すべて
                  </button>
                </li>
                {months.map(m => {
                  const count = published.filter(p => new Date(p.created_date).toISOString().slice(0, 7) === m).length;
                  const [y, mo] = m.split('-');
                  return (
                    <li key={m}>
                      <button
                        onClick={() => setSelectedMonth(m)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedMonth === m ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {y}年{mo}月 <span className="text-slate-400 ml-1">({count})</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}