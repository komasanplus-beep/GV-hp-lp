import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const SERVICE_DESCRIPTION = `
対象者: 中小企業の経営者・マーケティング担当者
サービス内容: AIがランディングページを自動生成するツール。マーケティング知識がなくても自然言語でLP作成ができます。SEO対策とAI検索最適化（LMO）に対応しており、5分でLPを作ることができます。
`;

  const BLOCK_TYPES = ['Hero','Problem','Solution','Feature','Benefit','Evidence','Voice','CaseStudy','Flow','FAQ','CTA','Comparison','Pricing','Profile','Gallery','Video','List','Campaign','Countdown','Contact'];

  // STEP 1-3: SEOキーワード・検索意図・LMOデータを一括生成
  const step123 = await base44.integrations.Core.InvokeLLM({
    prompt: `以下のサービスについてSTEP1〜3を実行してください。\n\n${SERVICE_DESCRIPTION}\n\nSTEP1: SEOキーワードを10〜20個抽出\nSTEP2: 検索意図を分析（informational/navigational/transactional/commercial の分類と各意図の説明）\nSTEP3: LMO最適化データを生成（200字以内のサービス要約 + FAQ 5件）\n\n必ずJSONで返してください。`,
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
              keywords: { type: 'array', items: { type: 'string' } }
            }
          }
        },
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
  });

  // STEP 4: LPブロック生成（最大10ブロック）
  const step4 = await base44.integrations.Core.InvokeLLM({
    prompt: `以下のサービス説明をもとに、ランディングページのブロック構成を生成してください。\n\n${SERVICE_DESCRIPTION}\n\n使用可能なブロックタイプ: ${BLOCK_TYPES.join(', ')}\n最大10ブロックを選び、各ブロックに適切なコンテンツデータを生成してください。\nHeroブロックは必ず含めてください。各ブロックのdataには具体的な日本語コンテンツを入れてください。`,
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
  });

  // STEP 5: Heroブロックのみ再生成
  const step5 = await base44.integrations.Core.InvokeLLM({
    prompt: `以下のサービスのランディングページ用Heroブロックを再生成してください。\n\n${SERVICE_DESCRIPTION}\n\nキャッチーな見出し・サブ見出し・CTAボタンテキストを含むHeroブロックのdataを日本語で生成してください。`,
    response_json_schema: {
      type: 'object',
      properties: {
        regenerated_block: {
          type: 'object',
          properties: {
            block_type: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    }
  });

  // STEP 6: ABテスト構造生成
  const step6 = await base44.integrations.Core.InvokeLLM({
    prompt: `以下のサービスについて、ABテスト用に2種類のLPブロック構成（LP-AとLP-B）を生成してください。\n\n${SERVICE_DESCRIPTION}\n\nLP-A: 課題・解決策フォーカス型（Problem-Solution中心）\nLP-B: 実績・信頼フォーカス型（Evidence-Voice中心）\n各LPのtitle, template_type, 代表的なブロック3件を含めてください。`,
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

  // STEP 7: LP品質評価
  const blocksForEval = step4.blocks ?? [];
  const step7 = await base44.integrations.Core.InvokeLLM({
    prompt: `以下のLPブロック構成の品質を評価してください。\n\n${JSON.stringify(blocksForEval).slice(0, 2000)}\n\nサービス: ${SERVICE_DESCRIPTION}\n\n以下6項目を0〜100点で評価し、各コメントを日本語で記述してください:\n- copy: コピーライティングの質（訴求力・感情喚起）\n- seo: SEO最適化度\n- lmo: LMO対応度（AI検索最適化）\n- conversion: コンバージョン設計\n- cta: CTAの明確さ\n- clarity: メッセージの明確さ\n- overall: 総合スコア（上記平均）`,
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
  });

  // STEP 8: LP分析データ生成（シミュレーション）
  const step8 = await base44.integrations.Core.InvokeLLM({
    prompt: `以下のLPに対して、現実的なLP分析データをシミュレーションしてください。\n\nサービス: ${SERVICE_DESCRIPTION}\n品質スコア: ${JSON.stringify(step7.quality_score ?? {})}\n\n以下のデータを生成してください:\n- page_views: 公開後30日間のPV数（現実的な数値）\n- cta_clicks: CTAクリック数\n- conversions: コンバージョン数（リード獲得）\n- conversion_rate: CV率（%）\n- cta_click_rate: CTAクリック率（%）\n- bounce_rate: 直帰率（%）\n- avg_time_on_page: 平均滞在時間（秒）`,
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
  });

  // 全ステップの結果を統合して返す
  const result = {
    seo_keywords: step123.seo_keywords ?? [],
    search_intent: step123.search_intent ?? [],
    lmo_summary: step123.lmo_summary ?? '',
    faq: step123.faq ?? [],
    blocks: step4.blocks ?? [],
    regenerated_block: step5.regenerated_block ?? {},
    ab_test: step6.ab_test ?? {},
    quality_score: step7.quality_score ?? {},
    analytics: step8.analytics ?? { page_views: 0, cta_clicks: 0, conversions: 0 },
    meta: {
      tested_at: new Date().toISOString(),
      user_id: user.id,
      steps_completed: 8
    }
  };

  return Response.json(result);
});