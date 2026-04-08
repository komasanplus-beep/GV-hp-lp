/**
 * LPThemePanel
 * LP編集画面のテーマ設定パネル
 * ホームページ共通デザインの設定・プレビュー
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Palette } from 'lucide-react';
import { toast } from 'sonner';

export default function LPThemePanel({ lp, siteId, onUpdate }) {
  const [useTheme, setUseTheme] = useState(lp?.use_site_theme !== false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const qc = useQueryClient();

  // テーマ取得
  const { data: theme, isLoading: themeLoading } = useQuery({
    queryKey: ['siteTheme', siteId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSiteTheme', { site_id: siteId });
      return res.data?.theme;
    },
    enabled: !!siteId,
  });

  // テーマ更新mutation
  const updateThemeMutation = useMutation({
    mutationFn: (updates) =>
      base44.functions.invoke('updateSiteTheme', {
        site_id: siteId,
        ...updates,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteTheme', siteId] });
      toast.success('テーマを更新しました');
      onUpdate?.();
    },
    onError: (err) => {
      toast.error('更新に失敗しました: ' + err.message);
    },
  });

  // LP設定更新mutation
  const updateLPMutation = useMutation({
    mutationFn: (data) => base44.entities.LandingPage.update(lp.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lpBySlug', lp.slug] });
      toast.success('設定を保存しました');
    },
    onError: (err) => {
      toast.error('保存に失敗しました: ' + err.message);
    },
  });

  const handleThemeToggle = (value) => {
    setUseTheme(value);
    updateLPMutation.mutate({ use_site_theme: value });
  };

  const handleThemeUpdate = (field, value) => {
    updateThemeMutation.mutate({ [field]: value });
  };

  if (themeLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm">共通テーマ設定</CardTitle>
          </div>
          <Switch
            checked={useTheme}
            onCheckedChange={handleThemeToggle}
            disabled={updateLPMutation.isPending}
          />
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {/* テーマ説明 */}
        {useTheme && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
            <p className="font-semibold mb-1">✓ ホームページと同じデザイン</p>
            <p>このLPはホームページの共通テーマを使用しており、統一感のある表示になります。</p>
          </div>
        )}

        {/* 基本設定 */}
        {useTheme && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* 見出しサイズ */}
              <div>
                <label className="label-xs">H1サイズ (px)</label>
                <Input
                  type="number"
                  value={theme?.font_size_h1 || 32}
                  onChange={(e) =>
                    handleThemeUpdate('font_size_h1', parseInt(e.target.value))
                  }
                  className="h-8 text-sm mt-1"
                  disabled={updateThemeMutation.isPending}
                />
              </div>
              <div>
                <label className="label-xs">H2サイズ (px)</label>
                <Input
                  type="number"
                  value={theme?.font_size_h2 || 24}
                  onChange={(e) =>
                    handleThemeUpdate('font_size_h2', parseInt(e.target.value))
                  }
                  className="h-8 text-sm mt-1"
                  disabled={updateThemeMutation.isPending}
                />
              </div>
            </div>

            {/* 本文設定 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs">本文サイズ (px)</label>
                <Input
                  type="number"
                  value={theme?.font_size_body || 14}
                  onChange={(e) =>
                    handleThemeUpdate('font_size_body', parseInt(e.target.value))
                  }
                  className="h-8 text-sm mt-1"
                  disabled={updateThemeMutation.isPending}
                />
              </div>
              <div>
                <label className="label-xs">行間</label>
                <Input
                  type="number"
                  step="0.1"
                  value={theme?.line_height_body || 1.6}
                  onChange={(e) =>
                    handleThemeUpdate('line_height_body', parseFloat(e.target.value))
                  }
                  className="h-8 text-sm mt-1"
                  disabled={updateThemeMutation.isPending}
                />
              </div>
            </div>

            {/* 色設定 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs">主色</label>
                <Input
                  type="color"
                  value={theme?.primary_color || '#000000'}
                  onChange={(e) =>
                    handleThemeUpdate('primary_color', e.target.value)
                  }
                  className="h-8 text-sm mt-1"
                  disabled={updateThemeMutation.isPending}
                />
              </div>
              <div>
                <label className="label-xs">アクセント色</label>
                <Input
                  type="color"
                  value={theme?.accent_color || '#FF6B6B'}
                  onChange={(e) =>
                    handleThemeUpdate('accent_color', e.target.value)
                  }
                  className="h-8 text-sm mt-1"
                  disabled={updateThemeMutation.isPending}
                />
              </div>
            </div>

            {/* 余白 */}
            <div>
              <label className="label-xs">セクション間余白 (px)</label>
              <Input
                type="number"
                value={theme?.section_spacing || 80}
                onChange={(e) =>
                  handleThemeUpdate('section_spacing', parseInt(e.target.value))
                }
                className="h-8 text-sm mt-1"
                disabled={updateThemeMutation.isPending}
              />
            </div>

            {/* ボタンスタイル */}
            <div>
              <label className="label-xs">ボタンスタイル</label>
              <Select
                value={theme?.button_style || 'solid'}
                onValueChange={(value) =>
                  handleThemeUpdate('button_style', value)
                }
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">ソリッド</SelectItem>
                  <SelectItem value="outline">アウトライン</SelectItem>
                  <SelectItem value="ghost">ゴースト</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* テーマ非使用時の説明 */}
        {!useTheme && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
            <p>
              共通テーマを使用しない場合、このLPは独立したカスタムスタイルで表示されます。
              ホームページとの統一感が失われる可能性があります。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}