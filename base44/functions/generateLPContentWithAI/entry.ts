/**
 * generateLPContentWithAI
 * テンプレートLPのコンテンツをAIで改善生成
 * 
 * POST /api/generate-lp-content-with-ai
 * body: { lp_id, site_id, blocks }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { lp_id, site_id, blocks } = await req.json();

    if (!lp_id || !blocks) {
      return Response.json({ error: 'lp_id and blocks required' }, { status: 400 });
    }

    // ━━━ LP情報取得 ━━━
    const lps = await base44.asServiceRole.entities.LandingPage.filter({ id: lp_id });
    const lp = lps?.[0];

    if (!lp) {
      return Response.json({ error: 'LP not found' }, { status: 404 });
    }

    // ━━━ サイト情報取得（コンテキスト用） ━━━
    let siteContext = '';
    if (site_id) {
      const sites = await base44.asServiceRole.entities.Site.filter({ id: site_id });
      const site = sites?.[0];
      if (site) {
        siteContext = `サイト名: ${site.site_name}, 業種: ${site.business_type || '不明'}`;
      }
    }

    // ━━━ AIでコンテンツを生成 ━━━
    const prompt = `
あなたは優秀なセールスコピーライターです。
以下のテンプレートLPのコンテンツを改善してください。

${siteContext ? `サイト情報: ${siteContext}` : ''}

LP タイトル: ${lp.title}

現在のブロック構成:
${blocks.map(b => `- ${b.block_type}: ${JSON.stringify(b.data)}`).join('\n')}

各ブロックのコンテンツを改善し、より説得力のあるコピーに変更してください。
JSON形式で以下の構成で返してください:

{
  "blocks": [
    {
      "id": "ブロックID",
      "type": "ブロック種別",
      "improved_data": {
        ... 改善されたblock.data
      }
    }
  ],
  "suggestions": [
    "提案1",
    "提案2"
  ]
}

実際のビジネス用語や具体的な数値を使用し、
より信頼性が高く、読み手の心を動かすコンテンツにしてください。
`;

    let aiResult = null;
    try {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  improved_data: { type: 'object' },
                },
              },
            },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      });

      aiResult = res.data;

      // ━━━ 改善されたコンテンツをブロックに反映 ━━━
      if (aiResult?.blocks && Array.isArray(aiResult.blocks)) {
        for (const improvedBlock of aiResult.blocks) {
          const originalBlock = blocks.find(b => b.id === improvedBlock.id);
          if (originalBlock && improvedBlock.improved_data) {
            await base44.asServiceRole.entities.LPBlock.update(improvedBlock.id, {
              data: improvedBlock.improved_data,
            });
          }
        }
      }
    } catch (aiError) {
      console.warn('AI generation failed, continuing with default content:', aiError.message);
      aiResult = { blocks: [], suggestions: ['AIコンテンツ生成は利用できませんでした'] };
    }

    return Response.json({
      generated: true,
      aiResult,
      message: '初期コンテンツが生成されました',
    });

  } catch (error) {
    console.error('generateLPContentWithAI error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});