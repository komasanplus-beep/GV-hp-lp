import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { step } = await req.json().catch(() => ({}));

  const SERVICE_DESCRIPTION = `対象者: 中小企業の経営者・マーケティング担当者。サービス内容: AIがランディングページを自動生成するツール。マーケティング知識がなくても自然言語でLP作成ができます。SEO対策とAI検索最適化（LMO）に対応しており、5分でLPを作ることができます。`;

  // STEP 1-3 (SEO / Intent / LMO) を並列で実行
  if (!step || step === 'seo') {
    const [seoResult, lmoResult] = await Promise.all([
      base44.integrations.Core.InvokeLLM({
        prompt: `サービス: ${SERVICE_DESCRIPTION}\n\nSTEP1: このサービスのSEOキーワードを10〜20個抽出してください。\nSTEP2: 検索意図を informational/navigational/transactional/commercial に分類して分析してください。`,
        response_json_schema: {
          type: 'object',
          properties: {
            seo_keywords: { type: 'array', items: { type: 'string' } },
            search_intent: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  description: { type: 'string' },
                  sample_keywords: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      }),
      base44.integrations.Core.InvokeLLM({
        prompt: `サービス: ${SERVICE_DESCRIPTION}\n\nLMO最適化データを生成してください:\n- 200字以内のサービス要約（lmo_summary）\n- FAQ 5件（質問と回答）`,
        response_json_schema: {
          type: 'object',
          properties: {
            lmo_summary: { type: 'string' },
            faq: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  answer: { type: 'string' }
                }
              }
            }
          }
        }
      }),
    ]);

    return Response.json({
      step: 'seo',
      seo_keywords: seoResult.seo_keywords ?? [],
      search_intent: seoResult.search_intent ?? [],
      lmo_summary: lmoResult.lmo_summary ?? '',
      faq: lmoResult.faq ?? [],
    });
  }

  // STEP 4-5: ブロック生成 + Hero再生成を並列
  if (step === 'blocks') {
    const BLOCK_TYPES = 'Hero,Problem,Solution,Feature,Benefit,Evidence,Voice,CaseStudy,Flow,FAQ,CTA,Comparison,Pricing,Profile,Gallery,Video,List,Campaign,Countdown,Contact';

    const [blocksResult, heroResult] = await Promise.all([
      base44.integrations.Core.InvokeLLM({
        prompt: `サービス: ${SERVICE_DESCRIPTION}\n\n使用可能ブロック: ${BLOCK_TYPES}\n最大10ブロックを選び、各ブロックに日本語コンテンツを含むdataを生成してください。Heroは必須です。sort_orderも付与してください。`,
        response_json_schema: {
          type: 'object',
          properties: {
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  block_type: { type: 'string' },
                  sort_order: { type: 'number' },
                  data: { type: 'object' }
                }
              }
            }
          }
        }
      }),
      base44.integrations.Core.InvokeLLM({
        prompt: `サービス: ${SERVICE_DESCRIPTION}\n\nHeroブロックを再生成してください。見出し・サブ見出し・CTAボタンテキストを含む日本語コンテンツのdataを返してください。`,
        response_json_schema: {
          type: 'object',
          properties: {
            block_type: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                subheadline: { type: 'string' },
                cta_text: { type: 'string' },
                description: { type: 'string' }
              }
            }
          }
        }
      }),
    ]);

    return Response.json({
      step: 'blocks',
      blocks: blocksResult.blocks ?? [],
      regenerated_block: { block_type: 'Hero', data: heroResult.data ?? {} },
    });
  }

  // STEP 6: ABテスト構造
  if (step === 'ab') {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `サービス: ${SERVICE_DESCRIPTION}\n\nABテスト用に2種類のLP構成を生成してください。\nLP-A: 課題解決フォーカス（Problem→Solution中心）\nLP-B: 実績・信頼フォーカス（Evidence→Voice中心）\n各LP: title, template_type, focus説明, 代表ブロック3件を含めてください。`,
      response_json_schema: {
        type: 'object',
        properties: {
          ab_test: {
            type: 'object',
            properties: {
              lp_a: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  template_type: { type: 'string' },
                  focus: { type: 'string' },
                  blocks: { type: 'array', items: { type: 'object' } }
                }
              },
              lp_b: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  template_type: { type: 'string' },
                  focus: { type: 'string' },
                  blocks: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        }
      }
    });

    return Response.json({ step: 'ab', ab_test: result.ab_test ?? {} });
  }

  // STEP 7-8: 品質評価 + 分析データを並列
  if (step === 'quality') {
    const SAMPLE_BLOCKS = '[{"block_type":"Hero","data":{"headline":"5分でLP作成","subheadline":"AIが自動生成"}},{"block_type":"Problem","data":{"title":"LP作成の課題"}},{"block_type":"CTA","data":{"button":"無料で試す"}}]';

    const [qualityResult, analyticsResult] = await Promise.all([
      base44.integrations.Core.InvokeLLM({
        prompt: `サービス: ${SERVICE_DESCRIPTION}\nブロック構成: ${SAMPLE_BLOCKS}\n\n以下6項目を0〜100点で評価し、各コメントを日本語で記述してください:\ncopy(コピーライティング), seo(SEO最適化), lmo(AI検索最適化), conversion(CV設計), cta(CTA明確さ), clarity(メッセージ明確さ), overall(総合)`,
        response_json_schema: {
          type: 'object',
          properties: {
            quality_score: {
              type: 'object',
              properties: {
                copy: { type: 'number' },
                seo: { type: 'number' },
                lmo: { type: 'number' },
                conversion: { type: 'number' },
                cta: { type: 'number' },
                clarity: { type: 'number' },
                overall: { type: 'number' },
                comments: { type: 'object' }
              }
            }
          }
        }
      }),
      base44.integrations.Core.InvokeLLM({
        prompt: `サービス: ${SERVICE_DESCRIPTION}\n\nこのLPの公開後30日間の現実的なアクセス分析データをシミュレーションしてください。`,
        response_json_schema: {
          type: 'object',
          properties: {
            analytics: {
              type: 'object',
              properties: {
                page_views: { type: 'number' },
                cta_clicks: { type: 'number' },
                conversions: { type: 'number' },
                conversion_rate: { type: 'number' },
                cta_click_rate: { type: 'number' },
                bounce_rate: { type: 'number' },
                avg_time_on_page: { type: 'number' }
              }
            }
          }
        }
      }),
    ]);

    return Response.json({
      step: 'quality',
      quality_score: qualityResult.quality_score ?? {},
      analytics: analyticsResult.analytics ?? { page_views: 0, cta_clicks: 0, conversions: 0 },
    });
  }

  return Response.json({ error: 'Invalid step. Use: seo | blocks | ab | quality' }, { status: 400 });
});