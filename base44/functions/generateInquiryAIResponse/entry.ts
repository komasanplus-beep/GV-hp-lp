import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * 問い合わせに対する AI 一次回答を生成
 * 1. InquiryAISetting と InquiryAIKnowledge を取得
 * 2. LLM で回答を生成
 * 3. InquiryMessage (AI sender) と InquiryAIResponseLog を保存
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST required' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    const { inquiry_id, message_id, subject, body, category, setting_id } = await req.json();
    if (!inquiry_id || !body) {
      return Response.json({ error: 'inquiry_id, body required' }, { status: 400 });
    }

    // AI設定を取得
    const settings = await base44.asServiceRole.entities.InquiryAISetting.list();
    const setting = settings[0];

    if (!setting?.is_enabled) {
      return Response.json({ error: 'AI not enabled' }, { status: 400 });
    }

    // 関連ナレッジを検索（カテゴリマッチ + 検索キーワード）
    const knowledgeList = await base44.asServiceRole.entities.InquiryAIKnowledge.filter({
      is_active: true,
      category: category || 'general',
    }, '-usage_count', 5);

    const knowledgeContext = knowledgeList
      .map(k => `【${k.title}】\n${k.content}`)
      .join('\n\n');

    // LLM に送信
    const systemPrompt = setting.system_prompt || 
      '問い合わせに対して親切で簡潔に答えてください。不確実な場合は正直に不明を伝えてください。';

    const prompt = `
【問い合わせ内容】
件名: ${subject}
カテゴリ: ${category}
本文: ${body}

【参考ナレッジ】
${knowledgeContext || '（該当するナレッジなし）'}

【指示】
${systemPrompt}

回答は${setting.max_answer_length || 1000}文字以内で、簡潔にお願いします。
`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    });

    // AI メッセージを作成
    const aiMessage = await base44.entities.InquiryMessage.create({
      inquiry_id,
      sender_type: 'ai',
      sender_id: 'system-ai',
      message: aiResult,
      is_official_reply: false,
    });

    // ログを記録
    await base44.asServiceRole.entities.InquiryAIResponseLog.create({
      inquiry_id,
      message_id: aiMessage.id,
      prompt_snapshot: prompt,
      knowledge_refs: knowledgeList.map(k => k.id),
      response_text: aiResult,
    });

    // Inquiry の状態を "ai_answered" に更新
    await base44.asServiceRole.entities.Inquiry.update(inquiry_id, {
      status: 'ai_answered',
    });

    return Response.json({
      ai_message_id: aiMessage.id,
      ai_response: aiResult,
      knowledge_used: knowledgeList.length,
    });
  } catch (error) {
    console.error('generateInquiryAIResponse error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});