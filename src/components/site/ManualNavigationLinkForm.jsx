import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function ManualNavigationLinkForm({ onSave, onCancel, initialData = null, isLoading = false }) {
  const [form, setForm] = useState(initialData || {
    label: '',
    url: '',
    target: '_self',
    placement: 'header',
    sort_order: 0,
  });
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    if (!form.label.trim()) {
      setError('リンク名を入力してください');
      return;
    }
    if (!form.url.trim()) {
      setError('URLを入力してください');
      return;
    }
    if (!/^https?:\/\//.test(form.url) && !form.url.startsWith('/')) {
      setError('URLは http:// または https:// で始まるか、/ で始まる必要があります');
      return;
    }
    onSave(form);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">リンク名 *</label>
        <Input
          value={form.label}
          onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
          placeholder="例: 採用情報"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">URL *</label>
        <Input
          value={form.url}
          onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
          placeholder="https://example.com/recruit"
          disabled={isLoading}
        />
        <p className="text-xs text-slate-400 mt-1">http(s)://で始まるURLまたは/で始まる相対URLを入力</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">開き方</label>
          <Select value={form.target} onValueChange={v => setForm(p => ({ ...p, target: v }))}>
            <SelectTrigger className="h-9" disabled={isLoading}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_self">同じタブで開く</SelectItem>
              <SelectItem value="_blank">新しいタブで開く</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">表示場所</label>
          <Select value={form.placement} onValueChange={v => setForm(p => ({ ...p, placement: v }))}>
            <SelectTrigger className="h-9" disabled={isLoading}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="header">上部メニュー</SelectItem>
              <SelectItem value="footer">フッター</SelectItem>
              <SelectItem value="both">両方</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">表示順</label>
        <Input
          type="number"
          value={form.sort_order}
          onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
          placeholder="0"
          min="0"
          disabled={isLoading}
        />
        <p className="text-xs text-slate-400 mt-1">小さい番号ほど上に表示されます</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </Button>
        <Button
          className="flex-1 bg-amber-600 hover:bg-amber-700"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          保存
        </Button>
      </div>
    </div>
  );
}