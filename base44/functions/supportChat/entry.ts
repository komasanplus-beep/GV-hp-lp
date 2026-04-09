import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  // セッション開始
  if (action === 'start_session') {
    const session = await base44.asServiceRole.entities.SupportChatSession.create({
      user_id: user.id,
      status: 'active',
      last_message_at: new Date().toISOString(),
      title: body.initial_question ? body.initial_question.slice(0, 50) : 'Q&Aセッション',
    });
    return Response.json({ session });
  }

  // メッセージ送信 + AI回答生成
  if (action === 'send_message') {
    const { session_id, message, attachment_urls = [] } = body;

    // ユーザーメッセージを保存
    const userMsg = await base44.asServiceRole.entities.SupportChatMessage.create({
      session_id,
      sender_type: 'user',
      message,
      attachment_urls,
    });

    // セッション最終更新
    await base44.asServiceRole.entities.SupportChatSession.update(session_id, {
      last_message_at: new Date().toISOString(),
    });

    // AI設定を取得（管理者マスター設定を参照）
    let aiSetting = null;
    try {
      const settings = await base44.asServiceRole.entities.InquiryAISetting.filter({ scope_type: 'global' });
      aiSetting = settings[0] || null;
    } catch (_) { /* ignore */ }

    // AI無効の場合はデフォルト応答
    if (aiSetting && !aiSetting.is_enabled) {
      const disabledMsg = await base44.asServiceRole.entities.SupportChatMessage.create({
        session_id,
        sender_type: 'ai',
        message: 'ただいまAIサポートは無効になっています。管理者までお問い合わせください。',
      });
      return Response.json({ user_message: userMsg, ai_message: disabledMsg });
    }

    // AIナレッジ取得（管理者登録ナレッジを参照）
    let knowledgeContext = '';
    let knowledgeRefs = [];
    if (!aiSetting || aiSetting.knowledge_enabled !== false) {
      try {
        const knowledgeList = await base44.asServiceRole.entities.InquiryAIKnowledge.filter({ is_active: true }, '-created_date', 20);
        if (knowledgeList.length > 0) {
          knowledgeContext = knowledgeList
            .map(k => `【${k.title}】\n${k.content}`)
            .join('\n\n');
          knowledgeRefs = knowledgeList.slice(0, 5).map(k => k.id);
        }
      } catch (_) { /* ignore */ }
    }

    // システムプロンプト（管理者設定を優先）
    const toneMap = { formal: '丁寧かつフォーマルな', friendly: '親切で分かりやすい', casual: 'フレンドリーな' };
    const tone = toneMap[aiSetting?.response_tone] || '親切で分かりやすい';
    const systemPrompt = aiSetting?.system_prompt ||
      `あなたはサービスサポート担当AIです。${tone}日本語でユーザーの質問に答えてください。解決策が分からない場合は「担当者に確認が必要です」と伝えてください。`;
    const maxLen = aiSetting?.max_answer_length || 1000;

    const prompt = `${systemPrompt}
${knowledgeContext ? `\n以下のナレッジを参考にしてください:\n${knowledgeContext}\n` : ''}
ユーザーの質問: ${message}

回答は${maxLen}文字以内で簡潔にまとめてください。`;

    const modelName = aiSetting?.model_name || 'gpt_5_mini';
    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: modelName,
      add_context_from_internet: false,
    });
    const aiText = typeof aiResult === 'string' ? aiResult : (aiResult?.response || '申し訳ありません。回答を生成できませんでした。');

    // AI回答を保存
    const aiMsg = await base44.asServiceRole.entities.SupportChatMessage.create({
      session_id,
      sender_type: 'ai',
      message: aiText,
      ai_knowledge_refs: knowledgeRefs,
    });

    return Response.json({ user_message: userMsg, ai_message: aiMsg });
  }

  // セッション一覧取得（本人のみ）
  if (action === 'get_sessions') {
    const sessions = await base44.asServiceRole.entities.SupportChatSession.filter(
      { user_id: user.id }, '-last_message_at', 20
    );
    return Response.json({ sessions });
  }

  // メッセージ一覧取得
  if (action === 'get_messages') {
    const { session_id } = body;
    // セッション所有者チェック
    const sessions = await base44.asServiceRole.entities.SupportChatSession.filter({ user_id: user.id });
    const isOwner = sessions.some(s => s.id === session_id);
    const isAdmin = user.role === 'admin' || user.role === 'master';
    if (!isOwner && !isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const messages = await base44.asServiceRole.entities.SupportChatMessage.filter(
      { session_id }, 'created_date'
    );
    return Response.json({ messages });
  }

  // エスカレーション（管理者問合せ化）
  if (action === 'escalate') {
    const { session_id, subject, body: inquiryBody, priority = 'normal', attachment_urls = [] } = body;

    const inquiry = await base44.asServiceRole.entities.Inquiry.create({
      user_id: user.id,
      subject,
      body: inquiryBody,
      category: 'system_support',
      status: 'new',
      priority,
      session_id,
      attachment_urls,
    });

    await base44.asServiceRole.entities.SupportChatSession.update(session_id, {
      status: 'escalated',
    });

    // エスカレーションメッセージを保存
    await base44.asServiceRole.entities.SupportChatMessage.create({
      session_id,
      sender_type: 'system',
      message: `管理者へ問い合わせを送信しました（チケットID: ${inquiry.id}）`,
      is_escalate_trigger: true,
    });

    return Response.json({ inquiry });
  }

  // 解決マーク
  if (action === 'resolve') {
    const { session_id } = body;
    await base44.asServiceRole.entities.SupportChatSession.update(session_id, {
      status: 'resolved',
    });
    await base44.asServiceRole.entities.SupportChatMessage.create({
      session_id,
      sender_type: 'system',
      message: 'この質問は解決済みとしてマークされました。',
      is_resolved_trigger: true,
    });
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
});