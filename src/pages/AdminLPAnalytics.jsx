import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye, MousePointerClick, Target, Percent,
  Sparkles, RefreshCw, Loader2, BarChart3, FlaskConical, ChevronDown, ChevronUp
} from 'lucide-react';
import KPICard from '@/components/analytics/KPICard';
import ScoreGauge from '@/components/analytics/ScoreGauge';
import ABComparisonTable from '@/components/analytics/ABComparisonTable';

export default function AdminLPAnalytics() {
  const [selectedLpId, setSelectedLpId] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [expandedAB, setExpandedAB] = useState(null);
  const queryClient = useQueryClient();

  // --- Data Fetching ---
  const { data: lps = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date'),
  });

  const { data: allAnalytics = [] } = useQuery({
    queryKey: ['lpAnalytics'],
    queryFn: () => base44.entities.LPAnalytics.list(),
  });

  const { data: allInsights = [] } = useQuery({
    queryKey: ['lpInsights'],
    queryFn: () => base44.entities.LPInsights.list(),
  });

  const { data: experiments = [] } = useQuery({
    queryKey: ['lpExperiments'],
    queryFn: () => base44.entities.LPExperiments.list(),
  });

  const { data: allBlocks = [] } = useQuery({
    queryKey: ['lpBlocks'],
    queryFn: () => base44.entities.LPBlock.list(),
    enabled: !!selectedLpId,
  });

  // --- Helpers ---
  const getAnalytics = (lpId) => allAnalytics.find(a => a.lp_id === lpId);
  const getInsights = (lpId) => allInsights.find(i => i.lp_id === lpId);
  const cvRate = (a) => a && a.page_views > 0 ? ((a.conversions / a.page_views) * 100).toFixed(1) : '0.0';

  const selectedLP = lps.find(lp => lp.id === selectedLpId) || lps[0];
  const selectedAnalytics = getAnalytics(selectedLP?.id);
  const selectedInsights = getInsights(selectedLP?.id);

  // --- AI Analysis Mutation ---
  const analyzeInsightsMutation = useMutation({
    mutationFn: async (lp) => {
      setAnalyzingId(lp.id);
      const blocks = allBlocks.filter(b => b.lp_id === lp.id);
      const blockSummary = blocks.map(b => `[${b.block_type}]: ${JSON.stringify(b.data).slice(0, 200)}`).join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `以下はランディングページ「${lp.title}」のブロック構成です。\n\n${blockSummary}\n\nこのLPについて以下4つの観点で0〜100点で評価し、改善提案を3〜5件JSON形式で出力してください。\n- copy_score: コピーライティングの質（訴求力・感情喚起）\n- seo_score: SEO最適化度（キーワード使用、見出し構造）\n- lmo_score: LMO対応度（AI検索最適化、簡潔な説明）\n- cta_score: CTA効果（アクション誘導の明確さ）\n- ai_score: 総合スコア（上記の平均）\n- suggestions: 具体的な改善提案の文字列配列（日本語）`,
        response_json_schema: {
          type: 'object',
          properties: {
            copy_score: { type: 'number' },
            seo_score: { type: 'number' },
            lmo_score: { type: 'number' },
            cta_score: { type: 'number' },
            ai_score: { type: 'number' },
            suggestions: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      const existing = allInsights.find(i => i.lp_id === lp.id);
      if (existing) {
        await base44.entities.LPInsights.update(existing.id, { ...result, lp_id: lp.id });
      } else {
        await base44.entities.LPInsights.create({ ...result, lp_id: lp.id });
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpInsights'] });
      setAnalyzingId(null);
    },
    onError: () => setAnalyzingId(null),
  });

  // Analytics inline edit mutation (demo: manual input)
  const upsertAnalyticsMutation = useMutation({
    mutationFn: async ({ lpId, data }) => {
      const existing = allAnalytics.find(a => a.lp_id === lpId);
      if (existing) {
        return base44.entities.LPAnalytics.update(existing.id, data);
      } else {
        return base44.entities.LPAnalytics.create({ lp_id: lpId, ...data });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lpAnalytics'] }),
  });

  const activeLp = selectedLP;

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="LP分析">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* LP selector tabs */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">LP分析ダッシュボード</h2>
            {lps.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>LPがまだありません</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-6">
                {lps.map(lp => (
                  <button
                    key={lp.id}
                    onClick={() => setSelectedLpId(lp.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      (selectedLpId ?? lps[0]?.id) === lp.id
                        ? 'bg-amber-600 text-white border-amber-600 shadow'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {lp.title}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${lp.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {lp.status === 'published' ? '公開' : '下書き'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeLp && (
            <>
              {/* KPI Cards */}
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">KPI サマリー</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard title="ページビュー" value={(selectedAnalytics?.page_views ?? 0).toLocaleString()} icon={Eye} color="blue" />
                  <KPICard title="CTAクリック" value={(selectedAnalytics?.cta_clicks ?? 0).toLocaleString()} icon={MousePointerClick} color="amber" />
                  <KPICard title="コンバージョン" value={(selectedAnalytics?.conversions ?? 0).toLocaleString()} icon={Target} color="green" />
                  <KPICard title="CV率" value={cvRate(selectedAnalytics)} unit="%" icon={Percent} color="purple" />
                </div>
              </section>

              {/* Manual analytics input */}
              <section className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  計測データ入力
                </h3>
                <AnalyticsForm
                  initialData={selectedAnalytics}
                  onSave={(data) => upsertAnalyticsMutation.mutate({ lpId: activeLp.id, data })}
                  isSaving={upsertAnalyticsMutation.isPending}
                />
              </section>

              {/* AI Insights */}
              <section className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    AI分析スコア
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => analyzeInsightsMutation.mutate(activeLp)}
                    disabled={analyzingId === activeLp.id}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    {analyzingId === activeLp.id ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />分析中...</>
                    ) : (
                      <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />AI分析を実行</>
                    )}
                  </Button>
                </div>

                {selectedInsights ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">総合スコア</span>
                        <span className={`text-2xl font-bold ${selectedInsights.ai_score >= 80 ? 'text-green-600' : selectedInsights.ai_score >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                          {selectedInsights.ai_score}
                        </span>
                      </div>
                      <ScoreGauge label="コピー" score={selectedInsights.copy_score} />
                      <ScoreGauge label="SEO" score={selectedInsights.seo_score} />
                      <ScoreGauge label="LMO" score={selectedInsights.lmo_score} />
                      <ScoreGauge label="CTA" score={selectedInsights.cta_score} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-3">改善提案</p>
                      <ul className="space-y-2">
                        {(selectedInsights.suggestions ?? []).map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                            <span className="text-amber-500 font-bold mt-0.5">→</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">「AI分析を実行」でLP内容を分析します</p>
                  </div>
                )}
              </section>
            </>
          )}

          {/* AB Test Section */}
          {experiments.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                ABテスト比較
              </h3>
              <div className="space-y-4">
                {experiments.map((exp) => {
                  const lpA = lps.find(l => l.id === exp.lp_a_id);
                  const lpB = lps.find(l => l.id === exp.lp_b_id);
                  const anaA = getAnalytics(exp.lp_a_id);
                  const anaB = getAnalytics(exp.lp_b_id);
                  const isOpen = expandedAB === exp.id;
                  return (
                    <div key={exp.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedAB(isOpen ? null : exp.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-700">
                            {lpA?.title ?? exp.lp_a_id} vs {lpB?.title ?? exp.lp_b_id}
                          </span>
                          <Badge className={
                            exp.status === 'running' ? 'bg-green-100 text-green-700 border-green-200' :
                            exp.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }>
                            {exp.status === 'running' ? '実施中' : exp.status === 'completed' ? '完了' : exp.status}
                          </Badge>
                          <span className="text-xs text-slate-400">A: {exp.traffic_split}% / B: {100 - exp.traffic_split}%</span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5">
                          <ABComparisonTable
                            experiment={exp}
                            lpA={lpA}
                            lpB={lpB}
                            analyticsA={anaA}
                            analyticsB={anaB}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}

// --- インライン計測データ入力フォーム ---
function AnalyticsForm({ initialData, onSave, isSaving }) {
  const [form, setForm] = React.useState({
    page_views: initialData?.page_views ?? 0,
    cta_clicks: initialData?.cta_clicks ?? 0,
    conversions: initialData?.conversions ?? 0,
  });

  useEffect(() => {
    setForm({
      page_views: initialData?.page_views ?? 0,
      cta_clicks: initialData?.cta_clicks ?? 0,
      conversions: initialData?.conversions ?? 0,
    });
  }, [initialData?.lp_id]);

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {[
        { key: 'page_views', label: 'PV' },
        { key: 'cta_clicks', label: 'CTA クリック' },
        { key: 'conversions', label: 'CV数' },
      ].map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs text-slate-500 font-medium">{label}</label>
          <input
            type="number"
            min={0}
            value={form[key]}
            onChange={e => setForm(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
            className="h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
          />
        </div>
      ))}
      <Button
        size="sm"
        onClick={() => onSave(form)}
        disabled={isSaving}
        className="bg-amber-600 hover:bg-amber-700"
      >
        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '保存'}
      </Button>
    </div>
  );
}