/**
 * BlockHeadingEdit - 見出しブロック編集
 */
import React from 'react';
import { Input } from '@/components/ui/input';

export default function BlockHeadingEdit({ block, onUpdate }) {
  return (
    <div className="space-y-2">
      <select
        value={block.level || 'h2'}
        onChange={(e) => onUpdate({ level: e.target.value })}
        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-semibold"
      >
        <option value="h2">見出し2（H2）</option>
        <option value="h3">見出し3（H3）</option>
        <option value="h4">見出し4（H4）</option>
      </select>
      <Input
        value={block.text || ''}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="見出しテキストを入力"
        className="text-base font-semibold"
      />
    </div>
  );
}