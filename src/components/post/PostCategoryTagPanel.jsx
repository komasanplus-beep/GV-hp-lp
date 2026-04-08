/**
 * PostCategoryTagPanel - カテゴリー・タグ選択パネル
 */
import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function PostCategoryTagPanel({ categories, tags, form, setForm }) {
  const toggleCategory = (id) => {
    const current = form.category_ids || [];
    setForm(p => ({
      ...p,
      category_ids: current.includes(id) ? current.filter(x => x !== id) : [...current, id],
    }));
  };

  const toggleTag = (id) => {
    const current = form.tag_ids || [];
    setForm(p => ({
      ...p,
      tag_ids: current.includes(id) ? current.filter(x => x !== id) : [...current, id],
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">カテゴリー</p>
        {categories.length === 0 ? (
          <p className="text-xs text-slate-400">カテゴリーがありません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const selected = (form.category_ids || []).includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    selected
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-amber-400'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">タグ</p>
        {tags.length === 0 ? (
          <p className="text-xs text-slate-400">タグがありません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => {
              const selected = (form.tag_ids || []).includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    selected
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                  }`}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}