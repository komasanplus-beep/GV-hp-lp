/**
 * ContactSettingsPanel
 * ページごとの接触情報設定（共通使用 vs カスタム）
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function ContactSettingsPanel({ page, onUpdate }) {
  const useCommon = page.use_common_contact !== false;

  const handleToggle = (val) => {
    onUpdate({ use_common_contact: val });
  };

  const handleCustomChange = (field, value) => {
    onUpdate({
      custom_contact: {
        ...(page.custom_contact || {}),
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4 p-5 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          共通接触情報を使用
        </label>
        <Switch
          checked={useCommon}
          onCheckedChange={handleToggle}
        />
      </div>

      {!useCommon && (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            このページで使用する接触情報をカスタマイズできます
          </p>

          <div>
            <Label className="text-xs">電話番号</Label>
            <Input
              value={page.custom_contact?.phone || ''}
              onChange={(e) => handleCustomChange('phone', e.target.value)}
              placeholder="090-1234-5678"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">メールアドレス</Label>
            <Input
              value={page.custom_contact?.email || ''}
              onChange={(e) => handleCustomChange('email', e.target.value)}
              placeholder="info@example.com"
              className="mt-1"
              type="email"
            />
          </div>

          <div>
            <Label className="text-xs">住所</Label>
            <Input
              value={page.custom_contact?.address || ''}
              onChange={(e) => handleCustomChange('address', e.target.value)}
              placeholder="東京都渋谷区..."
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Google Maps URL</Label>
            <Input
              value={page.custom_contact?.map_url || ''}
              onChange={(e) => handleCustomChange('map_url', e.target.value)}
              placeholder="https://maps.google.com/..."
              className="mt-1"
              type="url"
            />
          </div>
        </div>
      )}
    </div>
  );
}