/**
 * generatePostWithAI.js
 * AI記事生成バックエンド関数
 * feature_code: ai_post_generation
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/* global Deno */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      site_id,
      post_type,
      target_audience,
      content_instruction,  // ② 内容指示（メイン）
      theme,                 // 旧パラメータ互換
      tone,                  // トーン
      length,                // 文章量
      reference_text,
      reference_url,
      file_urls,
      use_web_search,
      seo_enabled,
      seo_keywords,
      seo_optimize_title,
    } = body;

    // ===== AI ガードチェック =====
    let guardAllowed = true;
    let guardReason = '';
    try {
      const guardRes = await base44.functions.invoke('aiGuard', {
        feature_code: 'ai_post_generation',
        site_id: site_id || null,
      });
      if (guardRes.data?.allowed === false) {
        guardAllowed = false;
        guardReason = guardRes.data?.reason || 'AI記事生成機能が利用できません';
      }
    } catch (guardErr) {
      console.warn('aiGuard skipped:', guardErr.message);
    }
    if (!guardAllowed) {
      return Response.json({ error: guardReason, blocked: true }, { status: 403 });
    }

    // AISettings / AIKnowledge 取得
    const aiSettingsList = await base44.asServiceRole.entities.AISettings.filter({ user_id: user.id }).catch(() => []);
    const aiSettings = aiSettingsList[0] || {};
    const knowledgeList = await base44.asServiceRole.entities.AIKnowledge.filter({ user_id: user.id }).catch(() => []);
    const knowledgeText = knowledgeList.map(k => `[${k.type}] ${k.title}\n${k.content}`).join('\n\n');

    const postTypeLabels = {
      news: 'お知らせ', blog: 'ブログ', staff_blog: 'スタッフブログ',
      column: 'コラム', campaign: 'キャンペーン',
    };

    const toneLabels = {
      polite: '丁寧・敬語ベース', casual: 'カジュアル・親近感',
      luxury: '高級感・格調', friendly: '親しみやすい・ポップ',
    };

    const lengthTargets = {
      short: '600〜800文字', medium: '1000〜1500文字', long: '1800〜2500文字',
    };

    const mainInstruction = content_instruction || theme || '';
    const inputSummary = `種別:${post_type || 'blog'} 対象:${target_audience || ''} 内容:${mainInstruction}`.slice(0, 200);

    const prompt = `あなたはプロの日本語ライターです。以下の条件で記事を生成してください。

## 記事条件
- 記事タイプ: ${postTypeLabels[post_type] || 'ブログ'}
- 読者ターゲット: ${target_audience || '一般客'}
- 記事の内容・目的: ${mainInstruction}
- 文体・トーン: ${toneLabels[tone] || '親しみやすい'}
- 文章量の目安: ${lengthTargets[length] || '1000〜1500文字'}
${reference_text ? `- 参考テキスト:\n${reference_text}` : ''}
${reference_url ? `- 参考URL: ${reference_url}` : ''}
${knowledgeText ? `\n## サービス・ブランド情報\n${knowledgeText}` : ''}
${seo_enabled ? `\n## SEO要件\n- 狙いたいキーワード: ${seo_keywords || ''}${seo_optimize_title ? '\n- タイトルはSEO最適化（キーワードを自然に含める）' : ''}` : ''}

## 出力ルール
- タイトル: 魅力的で${seo_optimize_title ? 'キーワードを含む' : ''}30〜40文字
- 本文: HTML形式（<h2>/<h3>/<p>/<ul>を使用）、指定の文章量
- 抜粋: 80〜120文字のプレーンテキスト
${seo_enabled ? '- SEOタイトル: キーワードを含む30文字以内\n- SEO説明文: キーワードを含む120文字以内' : ''}
- 日本語のみ。体言止めや感情的な共感表現を適度に使用
- 読者が行動したくなるCTAを本文末尾に入れる
`;

    const responseSchema = {
      type: 'object',
      properties: {
        title:           { type: 'string' },
        excerpt:         { type: 'string' },
        content:         { type: 'string' },
        seo_title:       { type: 'string' },
        seo_description: { type: 'string' },
      },
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: file_urls && file_urls.length > 0 ? file_urls : undefined,
      add_context_from_internet: use_web_search === true,
      response_json_schema: responseSchema,
    });

    // AIUsageLog 保存
    try {
      await base44.asServiceRole.entities.AIUsageLog.create({
        user_id: user.id,
        site_id: site_id || '',
        feature_code: 'ai_post_generation',
        prompt_type: 'post_generation',
        input_summary: inputSummary,
        output_summary: (result?.title || '').slice(0, 100),
        status: 'success',
      });
    } catch (e) {
      console.warn('log error:', e.message);
    }

    return Response.json({
      success: true,
      used_web_search: use_web_search === true,
      data: result,
    });

  } catch (error) {
    console.error('generatePostWithAI error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});