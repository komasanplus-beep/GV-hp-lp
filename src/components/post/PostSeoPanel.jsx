/**
 * PostSeoPanel - SEO設定パネル
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function PostSeoPanel({ form, setForm }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">SEOタイトル</label>
        <Input
          value={form.seo_title || ''}
          onChange={e => setForm(p => ({ ...p, seo_title: e.target.value }))}
          placeholder="60文字以内推奨"
        />
        <p className="text-xs text-slate-400 mt-1">{(form.seo_title || '').length} / 60文字</p>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">メタディスクリプション</label>
        <Textarea
          value={form.seo_description || ''}
          onChange={e => setForm(p => ({ ...p, seo_description: e.target.value }))}
          placeholder="160文字以内推奨"
          rows={3}
        />
        <p className="text-xs text-slate-400 mt-1">{(form.seo_description || '').length} / 160文字</p>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">OG画像URL</label>
        <Input
          value={form.og_image_url || ''}
          onChange={e => setForm(p => ({ ...p, og_image_url: e.target.value }))}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">カノニカルURL</label>
        <Input
          value={form.canonical_url || ''}
          onChange={e => setForm(p => ({ ...p, canonical_url: e.target.value }))}
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={form.noindex || false}
          onCheckedChange={v => setForm(p => ({ ...p, noindex: v }))}
        />
        <label className="text-sm text-slate-700">noindex（検索エンジンに表示しない）</label>
      </div>
    </div>
  );
}