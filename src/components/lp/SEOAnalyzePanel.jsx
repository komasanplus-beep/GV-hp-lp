import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export default function SEOAnalyzePanel({ lpId }) {
  const queryClient = useQueryClient();
  const [serviceDesc, setServiceDesc] = useState('');
  const [expanded, setExpanded] = useState(false);

  const { data: seoList = [] } = useQuery({
    queryKey: ['lpSeo', lpId],
    queryFn: () => base44.entities.LPSeoData.filter({ lp_id: lpId }),
    enabled: !!lpId,
  });
  const seo = seoList[0];

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const prompt = `
あなたはSEOとAI検索（LMO）分析の専門AIです。
ユーザーが入力したサービス内容を元にWEB検索を行い、SEOとAI検索に最適なキーワードを分析してください。

【サービス内容】
${serviceDesc}

■ STEP1 SEOキーワード抽出
WEB検索を行い、以下の条件でキーワードを抽出：
・日本語検索、検索意図が明確、購買または導入意図あり
・10〜20個、重要度順

■ STEP2 検索意図分析
抽出したSEOキーワードから：
・悩み・比較対象・導入目的・検討段階を分析

■ STEP3 LMO最適化
AI検索（ChatGPT / Gemini / Perplexity）が引用しやすい情報を生成：
・200文字の要約
・サービス定義
・FAQ（3〜5個）
・数値や根拠

必ずJSON形式のみで返してください：
{
  "seo_keywords": ["キーワード1", "キーワード2", ...],
  "search_intent": {
    "informational": ["知りたい情報キーワード..."],
    "navigational": ["指名検索キーワード..."],
    "transactional": ["購買意図キーワード..."]
  },
  "lmo_summary": "200文字程度のAI検索向けサービス要約",
  "faq_data": [
    {"question": "よくある質問1", "answer": "回答1"},
    {"question": "よくある質問2", "answer": "回答2"}
  ]
}
      `;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            seo_keywords: { type: 'array', items: { type: 'string' } },
            search_intent: { type: 'object' },
            lmo_summary: { type: 'string' },
            faq_data: { type: 'array', items: { type: 'object' } },
          },
        },
      });

      // 既存データがあれば更新、なければ作成
      if (seo?.id) {
        await base44.entities.LPSeoData.update(seo.id, {
          seo_keywords: res.seo_keywords,
          search_intent: res.search_intent,
          lmo_summary: res.lmo_summary,
          faq_data: res.faq_data,
        });
      } else {
        await base44.entities.LPSeoData.create({
          lp_id: lpId,
          seo_keywords: res.seo_keywords,
          search_intent: res.search_intent,
          lmo_summary: res.lmo_summary,
          faq_data: res.faq_data,
        });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpSeo', lpId] });
      setExpanded(true);
    },
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-slate-700">SEO / LMO分析</span>
          {seo && <Badge className="text-xs bg-blue-100 text-blue-700 border-0">分析済</Badge>}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3">
          {/* 入力 */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">サービス内容を入力してWEB検索分析</label>
            <Textarea
              rows={3}
              value={serviceDesc}
              onChange={e => setServiceDesc(e.target.value)}
              placeholder="例: 中小企業向けのクラウド会計ソフト。月額2,980円から。AIが自動で帳簿を作成。"
              className="text-sm"
            />
            <Button
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-sm"
              disabled={!serviceDesc || analyzeMutation.isPending}
              onClick={() => analyzeMutation.mutate()}
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />WEB検索・分析中...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" />{seo ? '再分析する' : 'SEO・LMO分析を実行'}</>
              )}
            </Button>
          </div>

          {/* 結果表示 */}
          {seo && (
            <div className="space-y-3">
              {/* SEOキーワード */}
              {seo.seo_keywords?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />SEOキーワード（{seo.seo_keywords.length}件）
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {seo.seo_keywords.map((kw, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded border ${i < 5 ? 'bg-amber-50 border-amber-200 text-amber-800 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        {i < 5 && '★ '}{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 検索意図 */}
              {seo.search_intent && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">検索意図分析</p>
                  <div className="space-y-1.5">
                    {seo.search_intent.transactional?.length > 0 && (
                      <div>
                        <span className="text-xs text-green-600 font-medium">購買意図 ▶ </span>
                        <span className="text-xs text-slate-600">{seo.search_intent.transactional.slice(0, 3).join('、')}</span>
                      </div>
                    )}
                    {seo.search_intent.informational?.length > 0 && (
                      <div>
                        <span className="text-xs text-blue-600 font-medium">情報収集 ▶ </span>
                        <span className="text-xs text-slate-600">{seo.search_intent.informational.slice(0, 3).join('、')}</span>
                      </div>
                    )}
                    {seo.search_intent.navigational?.length > 0 && (
                      <div>
                        <span className="text-xs text-purple-600 font-medium">指名検索 ▶ </span>
                        <span className="text-xs text-slate-600">{seo.search_intent.navigational.slice(0, 3).join('、')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LMOサマリー */}
              {seo.lmo_summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700 mb-1">LMOサマリー（AI検索向け）</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{seo.lmo_summary}</p>
                </div>
              )}

              {/* FAQ */}
              {seo.faq_data?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">FAQ（{seo.faq_data.length}件）</p>
                  <div className="space-y-1.5">
                    {seo.faq_data.map((f, i) => (
                      <div key={i} className="bg-slate-50 rounded p-2">
                        <p className="text-xs font-medium text-slate-700">Q. {f.question}</p>
                        <p className="text-xs text-slate-500 mt-0.5">A. {f.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}