/**
 * PostCategoryTagPanel - カテゴリー選択 + タグ選択・新規作成パネル
 */
import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const slugify = (text) =>
  text.toLowerCase().replace(/[\s\u3000]+/g, '-').replace(/[^\w\-]/g, '').replace(/--+/g, '-').trim() || `tag-${Date.now()}`;

export default function PostCategoryTagPanel({ categories, tags, form, setForm, siteId }) {
  const qc = useQueryClient();
  const [tagInput, setTagInput] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const inputRef = useRef(null);

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

  const removeTag = (id) => {
    setForm(p => ({ ...p, tag_ids: (p.tag_ids || []).filter(x => x !== id) }));
  };

  // フィルタリングされた候補タグ（未選択かつ入力に一致）
  const selectedTagIds = form.tag_ids || [];
  const filtered = tagInput.trim()
    ? tags.filter(t => t.name.includes(tagInput.trim()) && !selectedTagIds.includes(t.id))
    : [];
  const exactMatch = tags.find(t => t.name === tagInput.trim());
  const showCreateOption = tagInput.trim() && !exactMatch;

  const handleAddExistingTag = (tag) => {
    if (!selectedTagIds.includes(tag.id)) {
      setForm(p => ({ ...p, tag_ids: [...selectedTagIds, tag.id] }));
    }
    setTagInput('');
  };

  const handleCreateTag = async () => {
    const name = tagInput.trim();
    if (!name || !siteId || isCreatingTag) return;

    // 重複チェック（同サイト内）
    const existing = tags.find(t => t.name === name);
    if (existing) {
      handleAddExistingTag(existing);
      return;
    }

    setIsCreatingTag(true);
    try {
      const newTag = await base44.entities.PostTag.create({
        site_id: siteId,
        name,
        slug: slugify(name),
      });
      qc.invalidateQueries({ queryKey: ['postTags', siteId] });
      setForm(p => ({ ...p, tag_ids: [...(p.tag_ids || []), newTag.id] }));
      setTagInput('');
      toast.success(`タグ「${name}」を作成しました`);
    } catch (err) {
      toast.error('タグ作成に失敗しました');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && !showCreateOption) {
        handleAddExistingTag(filtered[0]);
      } else if (tagInput.trim()) {
        handleCreateTag();
      }
    }
    if (e.key === 'Escape') {
      setTagInput('');
    }
  };

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

  return (
    <div className="space-y-4">
      {/* カテゴリー */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">カテゴリー</p>
        {categories.length === 0 ? (
          <p className="text-xs text-slate-400">カテゴリーがありません</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => {
              const selected = (form.category_ids || []).includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
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

      {/* タグ */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">タグ</p>

        {/* 選択済みタグチップ */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedTags.map(tag => (
              <span key={tag.id} className="flex items-center gap-1 bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full">
                #{tag.name}
                <button type="button" onClick={() => removeTag(tag.id)} className="hover:text-red-300 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* タグ入力 */}
        <div className="relative">
          <input
            ref={inputRef}
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="タグを入力、Enterで追加..."
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
          />

          {/* ドロップダウン候補 */}
          {tagInput.trim() && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              {filtered.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleAddExistingTag(tag); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  #{tag.name}
                </button>
              ))}
              {showCreateOption && (
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleCreateTag(); }}
                  disabled={isCreatingTag}
                  className="w-full text-left px-3 py-2 text-xs text-violet-700 hover:bg-violet-50 transition-colors flex items-center gap-1.5 border-t border-slate-100"
                >
                  <Plus className="w-3.5 h-3.5" />「{tagInput.trim()}」を新規タグとして追加
                </button>
              )}
              {filtered.length === 0 && !showCreateOption && (
                <p className="px-3 py-2 text-xs text-slate-400">一致するタグがありません</p>
              )}
            </div>
          )}
        </div>

        {/* 未選択の既存タグ一覧 */}
        {!tagInput && tags.filter(t => !selectedTagIds.includes(t.id)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.filter(t => !selectedTagIds.includes(t.id)).map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="px-2.5 py-1 rounded-full text-xs border border-slate-300 text-slate-600 hover:border-slate-500 transition-colors"
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}