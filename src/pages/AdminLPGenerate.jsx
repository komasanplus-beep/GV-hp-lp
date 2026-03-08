import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import UserLayout from '@/components/user/UserLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Search, Zap, ChevronRight, CheckCircle2, Loader2, Code2, ClipboardCopy } from 'lucide-react';

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
  const [mode, setMode] = useState('wizard'); // 'wizard' | 'freetext'
  const [freeText, setFreeText] = useState('');
  const [freeTextResult, setFreeTextResult] = useState(null);
  const [copied, setCopied] = useState(false);
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
        'STEP1: ターゲット分析中...',
        'STEP2: WEB検索でSEOキーワードを抽出中...',
        'STEP3: 検索意図を分析中...',
        'STEP4: LMO（AI検索最適化）構造を生成中...',
        'STEP5: キャッチコピーを生成中...',
        'STEP6: LP構成を最適化中...',
        'STEP7: 各ブロックの文章を生成中...',
      ];
      for (const s of steps) {
        await new Promise(r => setTimeout(r, 400));
        setAiProgress(p => [...p, s]);
      }

      // AIKnowledgeを取得してプロンプトに注入
      let knowledgeContext = '';
      try {
        const knowledge = await base44.entities.AIKnowledge.list('type', 30);
        if (knowledge.length > 0) {
          const copyKnowledge = knowledge.filter(k => k.type === 'copy').map(k => `【${k.title}】\n${k.content}`).join('\n');
          const ctaKnowledge = knowledge.filter(k => k.type === 'cta').map(k => `【${k.title}】\n${k.content}`).join('\n');
          const structureKnowledge = knowledge.filter(k => k.type === 'structure').map(k => `【${k.title}】\n${k.content}`).join('\n');
          if (copyKnowledge) knowledgeContext += `\n=== 登録済みキャッチコピーナレッジ（優先使用）===\n${copyKnowledge}\n`;
          if (ctaKnowledge) knowledgeContext += `\n=== 登録済みCTAナレッジ（優先使用）===\n${ctaKnowledge}\n`;
          if (structureKnowledge) knowledgeContext += `\n=== 登録済み構成ナレッジ（優先使用）===\n${structureKnowledge}\n`;
        }
      } catch (e) { /* ignore */ }

      const prompt = `
あなたはプロのLPマーケターです。SEOとLMO（AI検索最適化）の両方を考慮して、以下の7ステップで効果的なランディングページを構築してください。
${knowledgeContext}

【入力情報】
- 対象者: ${form.target}
- サービス内容: ${form.service}
- 価格帯: ${form.price}
- 主な特徴・機能: ${form.features}
- 競合との差別化: ${form.differentiators}

■ STEP1 ターゲット分析
入力された対象者を分析し、年齢層・職業・課題・検索意図を推測する。

■ STEP2 SEOキーワード抽出
WEB検索を行い、SEOに重要な日本語検索キーワードを重要度順に10〜20個抽出する。
検索意図が明確なキーワードを優先すること。

■ STEP3 検索意図分析
SEOキーワードから「知りたい情報」「比較したい内容」「購入動機」を分析する。

■ STEP4 LMO最適化
AI検索（ChatGPT / Gemini等）が引用しやすい構造を作成：
- 200文字の要約
- FAQ（質問と回答）
- 定義説明
- データ根拠

■ STEP5 キャッチコピー生成
SEOキーワードと検索意図を元に以下を作成：
- メインキャッチコピー（インパクト重視、20文字以内）
- サブコピー（ベネフィット訴求、40文字以内）
- CTAコピー（行動喚起、10文字以内）
${knowledgeContext ? '※ 上記のナレッジに登録されたキャッチコピー・CTAを優先的に参考にすること。' : ''}

■ STEP6 LP構成生成
以下のブロックタイプから最適な構成を最大10ブロックで作成：
Hero, Problem, Solution, Feature, Benefit, Evidence, Voice, CaseStudy, Flow, FAQ, CTA, Comparison, Pricing, Profile, Gallery, Video, List, Campaign, Countdown, Contact

■ STEP7 LP文章生成
各ブロックに見出し・本文・CTAを作成。読みやすい日本語・マーケティングコピー・短い段落・箇条書きを使用。

各ブロックのデータ形式：
- Hero: { headline, subheadline, cta_text, cta_url, bg_image_url }
- Problem: { title, description, problems (array of strings) }
- Solution: { title, description, points (array of strings) }
- Feature: { title, description, features (array of {icon, title, description}) }
- Benefit: { title, description, benefits (array of {title, description}) }
- Evidence: { title, description, stats (array of {number, label, description}) }
- Voice: { title, voices (array of {name, comment, role, rating}) }
- CaseStudy: { title, cases (array of {name, before, after, result, period}) }
- Flow: { title, description, steps (array of {step, title, description}) }
- FAQ: { title, faqs (array of {question, answer}) }
- CTA: { headline, subheadline, cta_text, cta_url, subtext, urgency_text }
- Comparison: { title, description, items (array of {label, ours, theirs}) }
- Pricing: { title, description, plans (array of {name, price, unit, features, is_recommended}) }
- Profile: { title, name, role, bio, image_url, achievements (array of strings) }
- List: { title, description, items (array of {title, description}) }
- Campaign: { title, description, cta_text, cta_url, end_date }
- Contact: { title, description, cta_text, email, phone }

必ずJSON形式のみで返してください：
{
  "blocks": [{"block_type": "Hero", "data": {...}}, ...],
  "seo": {
    "seo_keywords": ["キーワード1", ...],
    "search_intent": { "informational": [], "navigational": [], "transactional": [] },
    "lmo_summary": "200文字程度のAI検索向けサマリー",
    "faq_data": [{"question": "...", "answer": "..."}, ...]
  }
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

  const freeTextMutation = useMutation({
    mutationFn: async () => {
      const prompt = `
あなたはSEOとAI検索（LMO）分析の専門AIです。
ユーザーが入力したサービス内容を元にWEB検索を行い、SEOとAI検索に最適なキーワードを分析してください。

【サービス・対象者情報】
${freeText}

■ STEP1 SEOキーワード抽出
WEB検索を行い、日本語・購買意図明確なキーワードを重要度順に10〜20個抽出。

■ STEP2 検索意図分析
・悩み・比較対象・導入目的・検討段階を分析

■ STEP3 LMO最適化
AI検索（ChatGPT/Gemini/Perplexity）が引用しやすい情報：
・200文字の要約・サービス定義・FAQ（3〜5個）・数値や根拠

■ STEP4 LP構成生成
以下のブロックタイプから最大10ブロックの最適なLP構成を生成（日本語で各ブロックの文章を作成）：
Hero, Problem, Solution, Feature, Benefit, Evidence, Voice, CaseStudy, Flow, FAQ, CTA, Comparison, Pricing, Profile, List, Contact

各ブロックのデータ形式：
- Hero: { headline, subheadline, cta_text }
- Problem: { title, description, problems (array of strings) }
- Solution: { title, description, points (array of strings) }
- Feature: { title, features (array of {title, description}) }
- Benefit: { title, benefits (array of {title, description}) }
- Evidence: { title, stats (array of {number, label}) }
- Voice: { title, voices (array of {name, comment, role}) }
- FAQ: { title, faqs (array of {question, answer}) }
- CTA: { headline, subheadline, cta_text, subtext }
- Comparison: { title, items (array of {label, ours, theirs}) }
- Pricing: { title, plans (array of {name, price, unit, features}) }
- Contact: { title, description, cta_text }

必ずJSON形式のみで返してください：
{
  "seo_keywords": ["キーワード1", "キーワード2", ...],
  "search_intent": {
    "悩み": ["..."],
    "比較対象": ["..."],
    "導入目的": ["..."],
    "検討段階": ["..."]
  },
  "lmo_summary": "200文字程度",
  "faq": [{"question": "...", "answer": "..."}, ...],
  "blocks": [{"block_type": "Hero", "data": {...}}, ...]
}
      `;
      return await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            seo_keywords: { type: 'array', items: { type: 'string' } },
            search_intent: { type: 'object' },
            lmo_summary: { type: 'string' },
            faq: { type: 'array', items: { type: 'object' } },
            blocks: { type: 'array', items: { type: 'object' } },
          },
        },
      });
    },
    onSuccess: (data) => setFreeTextResult(data),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(freeTextResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="LP AI生成">
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

          {/* モード切替 */}
          <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('wizard')}
              className={`flex-1 flex items-center justify-center gap-2 text-sm py-2 rounded-md font-medium transition-colors ${mode === 'wizard' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Sparkles className="w-4 h-4" /> ウィザード生成
            </button>
            <button
              onClick={() => setMode('freetext')}
              className={`flex-1 flex items-center justify-center gap-2 text-sm py-2 rounded-md font-medium transition-colors ${mode === 'freetext' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Code2 className="w-4 h-4" /> テキスト貼り付け分析
            </button>
          </div>

          {/* フリーテキストモード */}
          {mode === 'freetext' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">サービス内容を貼り付けて一括分析</h3>
                  <p className="text-xs text-slate-400 mb-3">対象者・サービス内容をそのままテキストで貼り付けてください。SEO/LMO分析とLP構成をJSON形式で出力します。</p>
                  <Textarea
                    rows={10}
                    value={freeText}
                    onChange={e => setFreeText(e.target.value)}
                    placeholder={`例:\n対象者: 中小企業の経営者\n\nサービス内容:\nAIがランディングページを自動生成するツールです。\n自然言語で指示するだけでLPを作成できます。`}
                    className="text-sm font-mono"
                  />
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={!freeText || freeTextMutation.isPending}
                  onClick={() => { setFreeTextResult(null); freeTextMutation.mutate(); }}
                >
                  {freeTextMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />WEB検索・分析中...</>
                  ) : (
                    <><Search className="w-4 h-4 mr-2" />SEO/LMO分析 + LP構成を生成</>
                  )}
                </Button>
              </div>

              {freeTextResult && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-slate-800">分析完了</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <ClipboardCopy className="w-4 h-4 mr-1" />
                      {copied ? 'コピー済！' : 'JSONをコピー'}
                    </Button>
                  </div>

                  {/* SEOキーワード */}
                  {freeTextResult.seo_keywords?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">SEOキーワード（{freeTextResult.seo_keywords.length}件）</p>
                      <div className="flex flex-wrap gap-1">
                        {freeTextResult.seo_keywords.map((kw, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded border ${i < 5 ? 'bg-amber-50 border-amber-200 text-amber-800 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {i < 5 && '★ '}{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 検索意図 */}
                  {freeTextResult.search_intent && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">検索意図分析</p>
                      <div className="space-y-1">
                        {Object.entries(freeTextResult.search_intent).map(([key, vals]) => (
                          Array.isArray(vals) && vals.length > 0 && (
                            <div key={key} className="text-xs">
                              <span className="text-blue-600 font-medium">{key} ▶ </span>
                              <span className="text-slate-600">{vals.slice(0, 3).join('、')}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LMOサマリー */}
                  {freeTextResult.lmo_summary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">LMOサマリー（AI検索向け）</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{freeTextResult.lmo_summary}</p>
                    </div>
                  )}

                  {/* FAQ */}
                  {freeTextResult.faq?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">FAQ（{freeTextResult.faq.length}件）</p>
                      <div className="space-y-1.5">
                        {freeTextResult.faq.map((f, i) => (
                          <div key={i} className="bg-slate-50 rounded p-2">
                            <p className="text-xs font-medium text-slate-700">Q. {f.question}</p>
                            <p className="text-xs text-slate-500 mt-0.5">A. {f.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LP構成 */}
                  {freeTextResult.blocks?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">LP構成（{freeTextResult.blocks.length}ブロック）</p>
                      <div className="flex flex-wrap gap-1">
                        {freeTextResult.blocks.map((b, i) => (
                          <span key={i} className="text-xs bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded">
                            {i + 1}. {b.block_type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw JSON */}
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1.5">JSON出力</p>
                    <pre className="bg-slate-900 text-green-400 text-xs p-3 rounded-lg overflow-auto max-h-64 leading-relaxed">
                      {JSON.stringify(freeTextResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ウィザードモード */}
          {mode === 'wizard' && <StepIndicator current={step} />}

          {/* Step 0: 対象者 */}
          {mode === 'wizard' && step === 0 && (
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
          {mode === 'wizard' && step === 1 && (
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
          {mode === 'wizard' && step === 2 && (
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
      </UserLayout>
    </ProtectedRoute>
  );
}