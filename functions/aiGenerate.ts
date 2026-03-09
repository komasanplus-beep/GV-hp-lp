import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { business_type, service, target, region, features, content_type } = await req.json();

    // AISettings を取得
    const aiSettingsList = await base44.asServiceRole.entities.AISettings.filter({ user_id: user.id });
    const aiSettings = aiSettingsList[0] || {};

    // AIKnowledge を取得
    const knowledgeList = await base44.asServiceRole.entities.AIKnowledge.filter({ user_id: user.id });
    const knowledgeText = knowledgeList.map(k => `[${k.type}] ${k.title}\n${k.content}`).join('\n\n');

    const systemPrompt = aiSettings.system_prompt || `あなたはサロン・美容業界のプロのコピーライターです。
ユーザーのビジネス情報をもとに、魅力的で集客力のあるウェブコンテンツを日本語で生成してください。`;

    const businessInfo = `
業種: ${business_type || '未設定'}
サービス内容: ${service || '未設定'}
ターゲット: ${target || '未設定'}
地域: ${region || '未設定'}
特徴・強み: ${features || '未設定'}
    `.trim();

    const contentTypePrompts = {
      site_title: 'サイトタイトルを1つ生成してください（20文字以内）',
      catchcopy: 'キャッチコピーを3パターン生成してください（各30文字以内）',
      hero_text: 'ヒーローセクションのメインテキスト（タイトル・サブタイトル・ボタンテキスト）を生成してください',
      service_desc: 'サービス説明文を生成してください（100〜200文字）',
      menu_desc: 'メニュー紹介文を3〜5個生成してください（各タイトルと説明）',
      staff_intro: 'スタッフ紹介文を生成してください（名前は「スタッフA」等のプレースホルダー）',
      cta: 'CTA（行動喚起）テキストを3パターン生成してください',
      faq: 'よくある質問と回答を5件生成してください',
      seo_title: 'SEOタイトルを3パターン生成してください（30文字以内）',
      seo_description: 'SEOメタディスクリプションを2パターン生成してください（120文字以内）',
    };

    const targetPrompt = contentTypePrompts[content_type] || 'サイトコンテンツを生成してください';

    const prompt = `${systemPrompt}

## ビジネス情報
${businessInfo}

${knowledgeText ? `## 参考ナレッジ\n${knowledgeText}\n` : ''}

## タスク
${targetPrompt}

JSONで出力してください。`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          content_type: { type: 'string' },
          results: {
            type: 'array',
            items: { type: 'object' }
          },
          raw_text: { type: 'string' }
        }
      }
    });

    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});