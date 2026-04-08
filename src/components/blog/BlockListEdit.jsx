import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

export default function BlockListEdit({ block, onChange }) {
  const items = block.items || [];

  const addItem = () => {
    onChange({ items: [...items, ''] });
  };

  const updateItem = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange({ items: newItems });
  };

  const removeItem = (index) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1.5">リスト種類</Label>
        <Select
          value={block.list_type || 'unordered'}
          onValueChange={(v) => onChange({ list_type: v })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unordered">・ （箇条書き）</SelectItem>
            <SelectItem value="ordered">1. （番号付き）</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">リスト項目</Label>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <span className="text-xs text-slate-500 w-5">
              {block.list_type === 'ordered' ? `${idx + 1}.` : '•'}
            </span>
            <Input
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              placeholder={`項目 ${idx + 1}`}
              className="text-sm"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeItem(idx)}
              className="w-8 h-8 p-0 text-red-600"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={addItem} variant="outline" size="sm" className="w-full gap-2">
        <Plus className="w-3.5 h-3.5" />
        項目を追加
      </Button>
    </div>
  );
}