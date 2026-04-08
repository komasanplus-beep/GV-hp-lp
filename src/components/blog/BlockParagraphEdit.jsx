import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BlockParagraphEdit({ block, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1.5">本文</Label>
        <Textarea
          value={block.content || ''}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="段落を入力..."
          rows={4}
          className="text-sm resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1.5">フォントサイズ</Label>
          <Select
            value={block.style?.font_size || 'base'}
            onValueChange={(v) => onChange({
              style: { ...block.style, font_size: v }
            })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">小</SelectItem>
              <SelectItem value="base">標準</SelectItem>
              <SelectItem value="lg">大</SelectItem>
              <SelectItem value="xl">特大</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1.5">行間</Label>
          <Select
            value={block.style?.line_height || 'normal'}
            onValueChange={(v) => onChange({
              style: { ...block.style, line_height: v }
            })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tight">狭い</SelectItem>
              <SelectItem value="normal">標準</SelectItem>
              <SelectItem value="relaxed">広い</SelectItem>
              <SelectItem value="loose">とても広い</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">太字</Label>
        <Switch
          checked={block.style?.bold || false}
          onCheckedChange={(v) => onChange({
            style: { ...block.style, bold: v }
          })}
        />
      </div>
    </div>
  );
}