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
      target_audience,
      post_type,
      theme,
      reference_text,
      reference_url,
      file_urls,
      use_web_search,
      seo_enabled,
      seo_keywords,
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
      // FeatureMaster未設定などの場合はスルー（管理者が設定するまでは動作させる）
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
      news: 'お知らせ',
      blog: 'ブログ',
      staff_blog: 'スタッフブログ',
      column: 'コラム',
      campaign: 'キャンペーン',
    };

    const inputSummary = `種別:${post_type || 'blog'} 対象:${target_audience || ''} テーマ:${theme || ''}`.slice(0, 200);

    const prompt = `あなたはプロの日本語ライターです。以下の条件でブログ記事を生成してください。

## 記事条件
- 記事の種類: ${postTypeLabels[post_type] || 'ブログ'}
- 読者ターゲット: ${target_audience || '一般客'}
- テーマ・目的: ${theme || ''}
${reference_text ? `- 参考テキスト:\n${reference_text}` : ''}
${reference_url ? `- 参考URL: ${reference_url}` : ''}
${knowledgeText ? `\n## サービス情報\n${knowledgeText}` : ''}
${seo_enabled ? `\n## SEO要件\n狙いたいキーワード: ${seo_keywords || ''}` : ''}

## 出力ルール
- タイトル: 魅力的で30文字程度
- 本文: HTML形式で1000〜2000文字、h2/h3で構成
- 抜粋: 80〜120文字のプレーンテキスト
${seo_enabled ? '- SEOタイトル: 30文字以内\n- SEO説明文: 120文字以内' : ''}
- 日本語のみ、体言止めや感情的な表現を適度に使用
`;

    const responseSchema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        excerpt: { type: 'string' },
        content: { type: 'string' },
        seo_title: { type: 'string' },
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