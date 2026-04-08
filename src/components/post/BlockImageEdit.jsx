/**
 * BlockImageEdit - 画像ブロック編集
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

export default function BlockImageEdit({
  block,
  onUpdate,
  onImageUpload,
  isUploading,
}) {
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(block.id, file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* 画像プレビュー */}
      {block.image_url && (
        <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
          <img
            src={block.image_url}
            alt={block.alt_text}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* アップロードボタン */}
      <label className="flex items-center gap-2 cursor-pointer w-full border border-dashed border-slate-300 bg-slate-50 rounded-lg px-3 py-2.5 hover:border-blue-400 hover:bg-blue-50 transition-colors">
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <ImageIcon className="w-4 h-4 text-slate-400" />
        )}
        <span className="text-xs text-slate-600">
          {isUploading ? 'アップロード中...' : '画像をアップロード'}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
      </label>

      {/* 画像URL直接入力 */}
      <Input
        value={block.image_url || ''}
        onChange={(e) => onUpdate({ image_url: e.target.value })}
        placeholder="またはURLを直接入力（https://...）"
        className="text-xs"
      />

      {/* Alt テキスト */}
      <Input
        value={block.alt_text || ''}
        onChange={(e) => onUpdate({ alt_text: e.target.value })}
        placeholder="alt属性（SEOとアクセシビリティに重要）"
        className="text-sm"
      />

      {/* キャプション */}
      <Input
        value={block.caption || ''}
        onChange={(e) => onUpdate({ caption: e.target.value })}
        placeholder="キャプション（任意）"
        className="text-sm"
      />

      {/* 配置・幅 */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={block.align || 'center'}
          onChange={(e) => onUpdate({ align: e.target.value })}
          className="px-2 py-1.5 border border-slate-200 rounded text-xs"
        >
          <option value="left">左配置</option>
          <option value="center">中央配置</option>
          <option value="right">右配置</option>
        </select>
        <Input
          type="number"
          value={block.width || 100}
          onChange={(e) => onUpdate({ width: parseInt(e.target.value) })}
          placeholder="幅（%）"
          min="10"
          max="100"
          className="text-xs"
        />
      </div>
    </div>
  );
}