import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BlockHeadingEdit({ block, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold mb-1.5 block">見出しレベル</label>
        <Select
          value={String(block.level)}
          onValueChange={(v) => onChange({ level: parseInt(v) })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">H2 - 大見出し</SelectItem>
            <SelectItem value="3">H3 - 中見出し</SelectItem>
            <SelectItem value="4">H4 - 小見出し</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1.5 block">見出しテキスト</label>
        <Input
          value={block.content || ''}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="見出しを入力..."
          className="text-sm"
        />
      </div>
    </div>
  );
}