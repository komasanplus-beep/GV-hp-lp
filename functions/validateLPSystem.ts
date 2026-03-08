import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SERVICE_DESCRIPTION = `
対象者: 中小企業の経営者・マーケティング担当者
サービス内容: AIがランディングページを自動生成するツール。マーケティング知識がなくても自然言語でLP作成ができます。SEO対策とAI検索最適化（LMO）に対応しており、5分でLPを作ることができます。
`;

const BLOCK_TYPES = 'Hero,Problem,Solution,Feature,Benefit,Evidence,Voice,CaseStudy,Flow,FAQ,CTA,Comparison,Pricing,Profile,Gallery,Video,List,Campaign,Countdown,Contact';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // STEP1-3 と STEP4-5 と STEP6 を並列実行
  const [seoLmoResult, blocksResult, abResult] = await Promise.all([

    // STEP1 + STEP2 + STEP3
    base44.integrations.Core.InvokeLLM({
      prompt: `サービス情報:\n${SERVICE_DESCRIPTION}\n\n以下3つを実行し、必ずJSONで返してください。\n\nSTEP1: SEOキーワードを10〜20個抽出（seo_keywords）\nSTEP2: 検索意図を informational/navigational/transactional/commercial に分類して分析（search_intent: type, description, sample_keywords[]）\nSTEP3: LMO最適化データ生成 - 200字以内のサービス要約（lmo_summary）と FAQ 5件（faq: question, answer）`,
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
    }),

    // STEP4 + STEP5
    base44.integrations.Core.InvokeLLM({
      prompt: `サービス情報:\n${SERVICE_DESCRIPTION}\n\n使用可能なブロックタイプ: ${BLOCK_TYPES}\n\nSTEP4: 最大10ブロックを選び、各ブロックに日本語の具体的なコンテンツデータ（data）を付与してください。Heroブロックは必須。sort_orderも付与。\nSTEP5: Heroブロックのみ再生成（regenerated_block）: headline, subheadline, cta_text, description を含むdataを生成。\n\n必ずJSONで返してください。`,
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
          },
          regenerated_block: {
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
        }
      }
    }),

    // STEP6
    base44.integrations.Core.InvokeLLM({
      prompt: `サービス情報:\n${SERVICE_DESCRIPTION}\n\nABテスト用に2種類のLP構成をJSONで生成してください。\nLP-A: 課題解決フォーカス型（Problem→Solution中心）\nLP-B: 実績・信頼フォーカス型（Evidence→Voice中心）\n各LP: title, template_type（new_service or proven_service）, focus（特徴説明）, 代表ブロック3件（block_type, data）を含めてください。`,
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
    }),

  ]);

  // blocksResult から blocks を取得（STEP7 の入力に使う）
  const blocks = blocksResult.blocks ?? [];
  const blocksJson = JSON.stringify(blocks).slice(0, 1500);

  // STEP7 + STEP8 を並列実行
  const [qualityResult, analyticsResult] = await Promise.all([

    // STEP7
    base44.integrations.Core.InvokeLLM({
      prompt: `サービス情報:\n${SERVICE_DESCRIPTION}\nLPブロック構成:\n${blocksJson}\n\n以下の7項目をそれぞれ0〜100点で評価してください。各スコアとコメント（comments）を日本語でJSONで返してください。\n- copy: コピーライティングの質・訴求力\n- seo: SEO最適化度\n- lmo: AI検索最適化（LMO）対応度\n- conversion: コンバージョン設計\n- cta: CTAの明確さ\n- clarity: メッセージの明確さ\n- overall: 総合スコア`,
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
              comments: {
                type: 'object',
                properties: {
                  copy: { type: 'string' },
                  seo: { type: 'string' },
                  lmo: { type: 'string' },
                  conversion: { type: 'string' },
                  cta: { type: 'string' },
                  clarity: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }),

    // STEP8
    base44.integrations.Core.InvokeLLM({
      prompt: `サービス情報:\n${SERVICE_DESCRIPTION}\n\nこのLPを公開後30日間の現実的なアクセス・CV分析データをシミュレーションしてJSONで返してください。\n項目: page_views, cta_clicks, conversions, conversion_rate（%）, cta_click_rate（%）, bounce_rate（%）, avg_time_on_page（秒）`,
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

  // 全結果を統合して指定フォーマットで返す
  const result = {
    seo_keywords: seoLmoResult.seo_keywords ?? [],
    search_intent: seoLmoResult.search_intent ?? [],
    lmo_summary: seoLmoResult.lmo_summary ?? '',
    faq: seoLmoResult.faq ?? [],
    blocks: blocks,
    regenerated_block: blocksResult.regenerated_block ?? {},
    ab_test: {
      lp_a: abResult.ab_test?.lp_a ?? {},
      lp_b: abResult.ab_test?.lp_b ?? {}
    },
    quality_score: qualityResult.quality_score ?? {},
    analytics: {
      page_views: analyticsResult.analytics?.page_views ?? 0,
      cta_clicks: analyticsResult.analytics?.cta_clicks ?? 0,
      conversions: analyticsResult.analytics?.conversions ?? 0,
      conversion_rate: analyticsResult.analytics?.conversion_rate ?? 0,
      cta_click_rate: analyticsResult.analytics?.cta_click_rate ?? 0,
      bounce_rate: analyticsResult.analytics?.bounce_rate ?? 0,
      avg_time_on_page: analyticsResult.analytics?.avg_time_on_page ?? 0
    }
  };

  return Response.json(result);
});