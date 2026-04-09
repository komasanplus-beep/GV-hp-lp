import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * ユーザーが問い合わせを送信
 * 1. Inquiry を作成
 * 2. InquiryMessage を作成（user sender）
 * 3. AI有効 & 対象カテゴリなら AI回答を生成
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST required' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Auth required' }, { status: 401 });
    }

    const { subject, category, body } = await req.json();
    if (!subject || !body) {
      return Response.json({ error: 'subject, body required' }, { status: 400 });
    }

    // Inquiry を作成（serviceRole で書き込み権限を確保）
    const inquiry = await base44.asServiceRole.entities.Inquiry.create({
      user_id: user.id,
      subject,
      category: category || 'general',
      body,
      status: 'new',
    });

    // InquiryMessage を作成（ユーザー初期メッセージ）
    const message = await base44.asServiceRole.entities.InquiryMessage.create({
      inquiry_id: inquiry.id,
      sender_type: 'user',
      sender_id: user.id,
      message: body,
    });

    // AI設定を確認（エンティティ未設定でもクラッシュしない）
    let setting = null;
    try {
      const aiSettings = await base44.asServiceRole.entities.InquiryAISetting.list();
      setting = aiSettings[0] || null;
    } catch (_) { /* InquiryAISetting未設定時はスキップ */ }

    let aiResponse = null;

    if (setting?.is_enabled && (!setting.allowed_categories || setting.allowed_categories.includes(category))) {
      // AI回答を生成
      try {
        const aiResult = await base44.functions.invoke('generateInquiryAIResponse', {
          inquiry_id: inquiry.id,
          message_id: message.id,
          subject,
          body,
          category,
          setting_id: setting.id,
        });
        
        if (aiResult.data?.ai_message_id) {
          aiResponse = aiResult.data;
        }
      } catch (aiErr) {
        console.warn('AI response generation failed:', aiErr.message);
        // AI失敗時も問い合わせは進む
      }
    }

    return Response.json({
      inquiry_id: inquiry.id,
      message_id: message.id,
      status: inquiry.status,
      ai_response: aiResponse || null,
    });
  } catch (error) {
    console.error('submitInquiry error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});