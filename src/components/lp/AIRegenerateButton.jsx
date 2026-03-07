import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

const REGENERATABLE = ['Hero', 'Feature', 'Voice', 'FAQ', 'Problem', 'Solution', 'CTA', 'Benefit', 'Evidence'];

export default function AIRegenerateButton({ block, lpId, onSaved }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(null);

  const { data: limitsList = [] } = useQuery({
    queryKey: ['myLimits'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.UserLimits.filter({ user_id: user.id });
    },
  });
  const limits = limitsList[0];
  const canRegenerate = !limits || (limits.ai_regenerate_limit === undefined || limits.ai_regenerate_limit > 0);

  const regenMutation = useMutation({
    mutationFn: async () => {
      const prompt = `
以下のLPブロック（${block.block_type}）の内容をより魅力的に書き直してください。
現在のデータ: ${JSON.stringify(block.data)}
同じJSONキー構造を維持したまま、コンテンツのみを改善してください。
      `;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: 'object' },
      });
      return res;
    },
    onSuccess: (data) => setResult(data),
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.LPBlock.update(block.id, { data: result }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpBlocks', lpId] });
      setOpen(false);
      setResult(null);
      if (onSaved) onSaved();
    },
  });

  if (!REGENERATABLE.includes(block.block_type)) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        onClick={() => { setOpen(true); setResult(null); }}
        disabled={!canRegenerate}
        title={!canRegenerate ? 'AI再生成の上限に達しています' : 'AIで再生成'}
      >
        <Sparkles className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={open => { if (!open) { setOpen(false); setResult(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI再生成 - {block.block_type}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {!result && !regenMutation.isPending && (
              <div>
                <p className="text-sm text-slate-600 mb-4">
                  AIがこのブロックの内容を自動的に書き直します。現在の内容を改善した新しいバージョンを生成します。
                </p>
                <Button className="bg-amber-600 hover:bg-amber-700 w-full" onClick={() => regenMutation.mutate()}>
                  <Sparkles className="w-4 h-4 mr-2" />再生成する
                </Button>
              </div>
            )}

            {regenMutation.isPending && (
              <div className="flex items-center justify-center py-8 gap-3 text-slate-600">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                AIが生成中です...
              </div>
            )}

            {result && !regenMutation.isPending && (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-green-800 flex items-center gap-1 mb-2">
                    <CheckCircle2 className="w-4 h-4" />生成完了
                  </p>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap overflow-auto max-h-40">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setResult(null); regenMutation.mutate(); }}>
                    再度生成
                  </Button>
                  <Button className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={saveMutation.isPending}
                    onClick={() => saveMutation.mutate()}>
                    {saveMutation.isPending ? '保存中...' : '保存して適用'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}