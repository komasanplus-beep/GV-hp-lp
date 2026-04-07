import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const ANIMATION_TYPES = [
  { value: 'none', label: 'なし' },
  { value: 'fade-in', label: 'フェード' },
  { value: 'fade-up', label: 'フェード＋上から' },
  { value: 'fade-down', label: 'フェード＋下から' },
  { value: 'slide-up', label: 'スライド＋上' },
  { value: 'slide-left', label: 'スライド＋左' },
  { value: 'slide-right', label: 'スライド＋右' },
  { value: 'zoom-in', label: 'ズーム' },
];

const ANIMATION_TRIGGERS = [
  { value: 'on-load', label: 'ページ読込時' },
  { value: 'on-scroll', label: 'スクロール時' },
];

export default function SiteBlockAnimationForm({ data, onChange }) {
  const {
    animation_type = 'fade-up',
    animation_trigger = 'on-scroll',
    animation_delay = 0,
    animation_duration = 600,
    animation_once = true,
  } = data;

  const isDisabled = animation_type === 'none';

  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-sm text-slate-800">アニメーション設定</h3>

      {/* Animation Type */}
      <div>
        <Label className="text-xs font-medium text-slate-700 mb-1 block">
          アニメーション種類
        </Label>
        <Select value={animation_type} onValueChange={(v) => handleChange('animation_type', v)}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANIMATION_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rest of the fields are disabled if animation_type === 'none' */}
      <div className={cn(isDisabled && 'opacity-50 pointer-events-none')}>
        {/* Animation Trigger */}
        <div>
          <Label className="text-xs font-medium text-slate-700 mb-1 block">
            表示タイミング
          </Label>
          <Select value={animation_trigger} onValueChange={(v) => handleChange('animation_trigger', v)}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANIMATION_TRIGGERS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Animation Delay */}
        <div className="mt-3">
          <Label className="text-xs font-medium text-slate-700 mb-1 block">
            遅延 (ms)
          </Label>
          <Input
            type="number"
            min="0"
            step="50"
            value={animation_delay}
            onChange={(e) => handleChange('animation_delay', parseInt(e.target.value) || 0)}
            className="text-sm"
          />
        </div>

        {/* Animation Duration */}
        <div className="mt-3">
          <Label className="text-xs font-medium text-slate-700 mb-1 block">
            継続時間 (ms)
          </Label>
          <Input
            type="number"
            min="100"
            step="50"
            value={animation_duration}
            onChange={(e) => handleChange('animation_duration', parseInt(e.target.value) || 600)}
            className="text-sm"
          />
        </div>

        {/* Animation Once */}
        <div className="mt-3 flex items-center gap-3">
          <Switch
            checked={animation_once}
            onCheckedChange={(v) => handleChange('animation_once', v)}
          />
          <Label className="text-xs font-medium text-slate-700">
            1回のみ再生
          </Label>
        </div>
      </div>
    </div>
  );
}