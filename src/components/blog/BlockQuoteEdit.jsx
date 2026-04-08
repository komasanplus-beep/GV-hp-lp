import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BlockQuoteEdit({ block, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1.5">引用文</Label>
        <Textarea
          value={block.content || ''}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="引用文を入力..."
          rows={3}
          className="text-sm resize-none"
        />
      </div>
      <div>
        <Label className="text-xs mb-1.5">出典（オプション）</Label>
        <Input
          value={block.citation || ''}
          onChange={(e) => onChange({ citation: e.target.value })}
          placeholder="著者・出典..."
          className="text-sm"
        />
      </div>
    </div>
  );
}