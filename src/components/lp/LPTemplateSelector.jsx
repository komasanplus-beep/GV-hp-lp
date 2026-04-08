/**
 * LPTemplateSelector
 * LP作成時のテンプレート選択画面
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { listTemplates } from '@/lib/lpTemplates';

export default function LPTemplateSelector({ open, onOpenChange, siteId, onCreated }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [lpTitle, setLpTitle] = useState('');
  const [generateContent, setGenerateContent] = useState(true);
  const templates = listTemplates();

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!lpTitle || !selectedTemplate) {
        throw new Error('タイトルとテンプレートを選択してください');
      }

      const slug = lpTitle
        .toLowerCase()
        .replace(/[\s\u3000]+/g, '-')
        .replace(/[^\w\-]/g, '')
        .replace(/--+/g, '-');

      const result = await base44.functions.invoke('createLPFromTemplate', {
        title: lpTitle,
        slug,
        site_id: siteId,
        template_id: selectedTemplate.id,
        generate_content: generateContent,
      });

      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`「${data.lp.title}」を作成しました`);
      setLpTitle('');
      setSelectedTemplate(null);
      onOpenChange(false);
      onCreated?.(data.lp);
    },
    onError: (err) => {
      toast.error('作成に失敗しました: ' + err.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>新しいLPを作成</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* タイトル入力 */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              LPタイトル
            </Label>
            <Input
              placeholder="例: 新サービス紹介LP"
              value={lpTitle}
              onChange={(e) => setLpTitle(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          {/* テンプレート選択 */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">
              テンプレートを選択
            </Label>
            <div className="grid grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  disabled={createMutation.isPending}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTemplate?.id === template.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`h-20 rounded-md mb-3 bg-gradient-to-br ${template.preview_color}`}
                  />
                  <p className="font-semibold text-sm text-slate-800">
                    {template.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* AI生成オプション */}
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <label className="flex-1 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateContent}
                onChange={(e) => setGenerateContent(e.target.checked)}
                disabled={createMutation.isPending}
                className="w-4 h-4"
              />
              <span className="text-sm text-blue-900">
                AIで初期コンテンツを生成（推奨）
              </span>
            </label>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => createMutation.mutate()}
              disabled={!lpTitle || !selectedTemplate || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                'LPを作成'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}