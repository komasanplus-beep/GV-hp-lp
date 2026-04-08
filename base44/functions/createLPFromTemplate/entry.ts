/**
 * createLPFromTemplate
 * テンプレートからLPを作成し、自動でブロックを生成
 * 
 * POST /api/create-lp-from-template
 * body: { title, slug, site_id, template_id, generate_content }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LP_TEMPLATES = {
  minimal: {
    blocks: [
      { block_type: 'Hero', sort_order: 0, data: { headline: 'あなたのビジネスを次のステップへ', subheadline: '洗練されたデザインで信頼を構築', cta_text: 'はじめる', cta_url: '#contact' } },
      { block_type: 'Problem', sort_order: 1, data: { headline: '現在の課題', items: [{ icon: '💡', title: '課題1', description: '説明を入力' }, { icon: '⚡', title: '課題2', description: '説明を入力' }, { icon: '🎯', title: '課題3', description: '説明を入力' }] } },
      { block_type: 'Solution', sort_order: 2, data: { headline: 'ソリューション', key_benefits: ['高速導入', '継続サポート', 'カスタマイズ対応'] } },
      { block_type: 'Evidence', sort_order: 3, data: { headline: '実績', stats: [{ label: '導入企業', value: '500+' }, { label: '満足度', value: '98%' }, { label: '継続率', value: '95%' }] } },
      { block_type: 'CTA', sort_order: 4, data: { headline: 'さあ、始めましょう', cta_text: 'お問い合わせ', cta_url: '#contact' } },
    ],
  },
  story: {
    blocks: [
      { block_type: 'Hero', sort_order: 0, data: { headline: 'ある日、人生が変わった', subheadline: 'お客様のストーリー', cta_text: '詳しく見る' } },
      { block_type: 'Voice', sort_order: 1, data: { headline: 'お客様の声', testimonials: [{ text: '使用する前と後で大きく変わりました', author: '○○さん', role: '企業経営者' }] } },
      { block_type: 'Feature', sort_order: 2, data: { headline: 'こんな特徴があります', features: [{ title: '特徴1', description: '説明を入力' }, { title: '特徴2', description: '説明を入力' }] } },
      { block_type: 'Flow', sort_order: 3, data: { headline: '3ステップで完了', steps: [{ number: 1, title: 'ステップ1', description: '説明を入力' }, { number: 2, title: 'ステップ2', description: '説明を入力' }, { number: 3, title: 'ステップ3', description: '説明を入力' }] } },
      { block_type: 'CTA', sort_order: 4, data: { headline: 'あなたも始めてみませんか', cta_text: '無料で始める', cta_url: '#contact' } },
    ],
  },
  card: {
    blocks: [
      { block_type: 'Hero', sort_order: 0, data: { headline: 'あなたに合わせた3つの選択肢', subheadline: 'ニーズに応じたプランをご用意', cta_text: 'プランを比較' } },
      { block_type: 'Feature', sort_order: 1, data: { headline: '3つのプラン', layout: 'card' } },
      { block_type: 'Comparison', sort_order: 2, data: { headline: 'vs 競合他社' } },
      { block_type: 'FAQ', sort_order: 3, data: { headline: 'よくある質問' } },
      { block_type: 'CTA', sort_order: 4, data: { headline: 'あなたに合ったプランを選ぼう', cta_text: 'はじめる', cta_url: '#signup' } },
    ],
  },
};

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

    const { title, slug, site_id, template_id, generate_content } = await req.json();

    if (!title || !slug || !template_id) {
      return Response.json({ error: 'title, slug, template_id required' }, { status: 400 });
    }

    // ━━━ 1. LPを作成 ━━━
    const lp = await base44.asServiceRole.entities.LandingPage.create({
      title,
      slug,
      site_id,
      status: 'draft',
      source_type: 'template',
      template_type: template_id,
      use_site_theme: true,
    });

    // ━━━ 2. テンプレートブロックを取得 ━━━
    const template = LP_TEMPLATES[template_id];
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // ━━━ 3. ブロックを一括作成 ━━━
    const blocks = [];
    for (const blockData of template.blocks) {
      const block = await base44.asServiceRole.entities.LPBlock.create({
        lp_id: lp.id,
        block_type: blockData.block_type,
        sort_order: blockData.sort_order,
        data: blockData.data || {},
        use_site_theme: true,
      });
      blocks.push(block);
    }

    // ━━━ 4. AI生成が有効ならコンテンツを生成（オプション） ━━━
    let aiGeneratedContent = null;
    if (generate_content && generate_content !== false) {
      try {
        // AIで各ブロックのコンテンツを改善
        const aiResult = await base44.asServiceRole.functions.invoke(
          'generateLPContentWithAI',
          {
            lp_id: lp.id,
            site_id,
            blocks,
          }
        );
        aiGeneratedContent = aiResult.data;
      } catch (aiError) {
        console.warn('AI generation skipped:', aiError.message);
      }
    }

    return Response.json({
      lp,
      blocks,
      aiGeneratedContent,
    });

  } catch (error) {
    console.error('createLPFromTemplate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});