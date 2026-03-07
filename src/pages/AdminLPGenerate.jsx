import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Search, Zap, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = ['対象者', 'サービス内容', 'AI生成'];

const LP_BLOCK_TYPES = ['Hero','Problem','Solution','Feature','Benefit','Evidence','Voice','CaseStudy','Flow','FAQ','CTA','Comparison','Pricing','Profile','Gallery','Video','List','Campaign','Countdown','Contact'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${i === current ? 'bg-amber-600 text-white' : i < current ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
            {i < current ? <CheckCircle2 className="w-4 h-4" /> : <span>{i + 1}</span>}
            {s}
          </div>
          {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function AdminLPGenerate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    target: '', service: '', price: '', features: '', differentiators: '',
    lp_title: '', lp_slug: '',
  });
  const [aiProgress, setAiProgress] = useState([]);
  const [generated, setGenerated] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      setAiProgress([]);
      const steps = [
        'WEB検索でトレンド分析中...',
        'SEOキーワードを抽出中...',
        '検索意図を分析中...',
        'LMO最適化中...',
        'LPブロックを生成中...',
      ];
      for (const s of steps) {
        await new Promise(r => setTimeout(r, 400));
        setAiProgress(p => [...p, s]);
      }

      const prompt = `
あなたはLP（ランディングページ）のプロのコピーライターです。
以下の情報をもとに、高コンバージョンのLPコンテンツをJSON形式で生成してください。

【対象者】${form.target}
【サービス内容】${form.service}
【価格帯】${form.price}
【主な特徴】${form.features}
【競合との差別化】${form.differentiators}

以下のブロックタイプの中から最適なものを選び、各ブロックのデータを生成してください：
Hero, Problem, Solution, Feature, Benefit, Evidence, Voice, CaseStudy, Flow, FAQ, CTA

各ブロックのデータ形式：
- Hero: { headline, subheadline, cta_text, cta_url }
- Problem: { title, problems (array of strings) }
- Solution: { title, description, points (array of strings) }
- Feature: { title, features (array of {icon, title, description}) }
- Benefit: { title, benefits (array of {title, description}) }
- Evidence: { title, stats (array of {number, label}) }
- Voice: { title, voices (array of {name, comment, role}) }
- CaseStudy: { title, cases (array of {name, before, after, result}) }
- Flow: { title, steps (array of {step, title, description}) }
- FAQ: { title, faqs (array of {question, answer}) }
- CTA: { headline, cta_text, cta_url, subtext }

またSEOデータも生成してください：
- seo_keywords: 10個のSEOキーワード配列
- search_intent: { informational: [], navigational: [], transactional: [] }
- lmo_summary: AI検索向けの200文字程度のサマリー
- faq_data: よくある質問5個

必ずJSON形式で返してください。
{
  "blocks": [{"block_type": "Hero", "data": {...}}, ...],
  "seo": {"seo_keywords": [...], "search_intent": {...}, "lmo_summary": "...", "faq_data": [...]}
}
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            blocks: { type: 'array', items: { type: 'object' } },
            seo: { type: 'object' },
          },
        },
      });
      return result;
    },
    onSuccess: (data) => setGenerated(data),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const lp = await base44.entities.LandingPage.create({
        title: form.lp_title,
        slug: form.lp_slug,
        template_type: 'new_service',
        status: 'draft',
      });

      await Promise.all(
        (generated.blocks || []).map((b, i) =>
          base44.entities.LPBlock.create({ lp_id: lp.id, block_type: b.block_type, sort_order: i, data: b.data || {} })
        )
      );

      if (generated.seo) {
        await base44.entities.LPSeoData.create({ lp_id: lp.id, ...generated.seo });
      }

      return lp;
    },
    onSuccess: (lp) => {
      queryClient.invalidateQueries({ queryKey: ['landingPages'] });
      navigate(createPageUrl(`AdminLPEditor?id=${lp.id}`));
    },
  });

  return (
    <ProtectedRoute>
      <AdminLayout title="LP AI生成">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">LP AI生成</h2>
              <p className="text-sm text-slate-500">AIがWEB検索してSEO最適化されたLPを自動生成します</p>
            </div>
          </div>

          <StepIndicator current={step} />

          {/* Step 0: 対象者 */}
          {step === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-semibold text-slate-800">ターゲット顧客を教えてください</h3>
              <div>
                <Label className="text-xs text-slate-500">ターゲット（どんな人に届けたいか）</Label>
                <Textarea
                  rows={3}
                  value={form.target}
                  onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                  placeholder="例: 30〜50代の美容に関心の高い女性で、忙しくてサロンに通えない方"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end">
                <Button className="bg-amber-600 hover:bg-amber-700" disabled={!form.target} onClick={() => setStep(1)}>
                  次へ <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: サービス内容 */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-semibold text-slate-800">サービス内容を入力してください</h3>
              <div>
                <Label className="text-xs text-slate-500">サービス内容</Label>
                <Textarea rows={3} value={form.service}
                  onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                  placeholder="例: 自宅でできるオーダーメイド美容液の定期便。肌診断AIで最適処方を提案"
                  className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">価格帯</Label>
                <Input value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="例: 月額3,980円〜" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">主な特徴・機能</Label>
                <Textarea rows={2} value={form.features}
                  onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                  placeholder="例: AIによる肌診断、完全オーダーメイド処方、送料無料" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">競合との差別化ポイント</Label>
                <Textarea rows={2} value={form.differentiators}
                  onChange={e => setForm(f => ({ ...f, differentiators: e.target.value }))}
                  placeholder="例: 業界初のAI処方、30日間返金保証付き" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">LPタイトル</Label>
                  <Input value={form.lp_title}
                    onChange={e => setForm(f => ({ ...f, lp_title: e.target.value }))}
                    placeholder="例: AI美容液キャンペーン" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">スラッグ（URL）</Label>
                  <Input value={form.lp_slug}
                    onChange={e => setForm(f => ({ ...f, lp_slug: e.target.value.replace(/\s/g, '-').toLowerCase() }))}
                    placeholder="ai-beauty-campaign" className="mt-1" />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)}>戻る</Button>
                <Button className="bg-amber-600 hover:bg-amber-700"
                  disabled={!form.service || !form.lp_title || !form.lp_slug}
                  onClick={() => { setStep(2); generateMutation.mutate(); }}>
                  <Sparkles className="w-4 h-4 mr-1" /> AI生成開始
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: AI生成 */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">AI生成中...</h3>
              <div className="space-y-2 mb-6">
                {aiProgress.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {p}
                  </div>
                ))}
                {generateMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    処理中...
                  </div>
                )}
              </div>

              {generated && !generateMutation.isPending && (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-green-800 mb-2">✓ 生成完了！</p>
                    <div className="flex flex-wrap gap-2">
                      {(generated.blocks || []).map((b, i) => (
                        <Badge key={i} className="bg-green-100 text-green-700 text-xs">{b.block_type}</Badge>
                      ))}
                    </div>
                    {generated.seo?.seo_keywords && (
                      <div className="mt-3">
                        <p className="text-xs text-green-700 font-medium mb-1">SEOキーワード</p>
                        <div className="flex flex-wrap gap-1">
                          {generated.seo.seo_keywords.slice(0, 6).map((kw, i) => (
                            <span key={i} className="bg-white text-green-700 text-xs px-2 py-0.5 rounded border border-green-200">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {generated.seo?.lmo_summary && (
                      <div className="mt-3">
                        <p className="text-xs text-green-700 font-medium mb-1">LMOサマリー</p>
                        <p className="text-xs text-slate-600">{generated.seo.lmo_summary}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 w-full"
                    disabled={saveMutation.isPending}
                    onClick={() => saveMutation.mutate()}
                  >
                    {saveMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" />LPを保存してエディタへ</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}