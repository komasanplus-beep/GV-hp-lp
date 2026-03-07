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
      // AIKnowledge・LPのSEOデータを並行取得
      let knowledgeContext = '';
      let seoContext = '';
      try {
        const [knowledge, seoList] = await Promise.all([
          base44.entities.AIKnowledge.list('type', 30),
          base44.entities.LPSeoData.filter({ lp_id: lpId }),
        ]);
        if (knowledge.length > 0) {
          const copyK = knowledge.filter(k => k.type === 'copy').map(k => `【${k.title}】${k.content}`).join('\n');
          const ctaK = knowledge.filter(k => k.type === 'cta').map(k => `【${k.title}】${k.content}`).join('\n');
          const structK = knowledge.filter(k => k.type === 'structure').map(k => `【${k.title}】${k.content}`).join('\n');
          if (copyK) knowledgeContext += `\n=== キャッチコピーナレッジ（優先使用）===\n${copyK}\n`;
          if (ctaK) knowledgeContext += `\n=== CTAナレッジ（優先使用）===\n${ctaK}\n`;
          if (structK) knowledgeContext += `\n=== 構成ナレッジ（優先使用）===\n${structK}\n`;
        }
        if (seoList.length > 0) {
          const seo = seoList[0];
          if (seo.seo_keywords?.length) seoContext += `\nSEOキーワード: ${seo.seo_keywords.join(', ')}`;
          if (seo.lmo_summary) seoContext += `\nLMOサマリー: ${seo.lmo_summary}`;
          if (seo.search_intent) seoContext += `\n検索意図: ${JSON.stringify(seo.search_intent)}`;
        }
      } catch (e) { /* ignore */ }

      const prompt = `
あなたはプロのLPコピーライターです。
既存のランディングページの指定ブロックのみを再生成してください。
${knowledgeContext}
${seoContext}

■ 再生成対象ブロック
block_type: ${block.block_type}
現在のデータ: ${JSON.stringify(block.data)}

■ 再生成ルール
・指定された block_type のみ生成する
・SEOキーワードを自然に文章に織り込む
・文章は読みやすく短い段落にする
・箇条書きを積極的に使用する
・マーケティングコピーを意識する
・現在のJSONキー構造を必ず維持する（キーを追加してもよいが削除しない）
${knowledgeContext ? '・上記のナレッジに登録されたキャッチコピー・CTAを優先的に参考にする' : ''}

■ LMO最適化
・AI検索（ChatGPT/Gemini等）で引用されやすい簡潔な文章にする
・定義説明や要約を意識する
・FAQ形式のブロックは特に簡潔・明快に

■ 出力形式
JSONのみで返してください（説明文不要）:
{
  "block_type": "${block.block_type}",
  "data": { ...改善されたデータ }
}
      `;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            block_type: { type: 'string' },
            data: { type: 'object' },
          },
        },
      });
      return res?.data || res;
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