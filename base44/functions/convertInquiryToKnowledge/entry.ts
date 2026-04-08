import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * 解決済み問い合わせ（と管理者回答）を InquiryAIKnowledge に登録
 * - source_type: "inquiry_history"
 * - source_id: inquiry_id
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST required' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { inquiry_id, title, official_reply_message_id } = await req.json();
    if (!inquiry_id || !title) {
      return Response.json({ error: 'inquiry_id, title required' }, { status: 400 });
    }

    // 問い合わせを取得
    const inquiries = await base44.asServiceRole.entities.Inquiry.filter({ id: inquiry_id });
    if (inquiries.length === 0) {
      return Response.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const inquiry = inquiries[0];

    // 正式回答メッセージを取得
    let content = inquiry.body; // デフォルトは問い合わせ本文
    if (official_reply_message_id) {
      const messages = await base44.asServiceRole.entities.InquiryMessage.filter({
        id: official_reply_message_id,
      });
      if (messages.length > 0) {
        content = `Q: ${inquiry.subject}\n\nA: ${messages[0].message}`;
      }
    }

    // InquiryAIKnowledge に登録
    const knowledge = await base44.asServiceRole.entities.InquiryAIKnowledge.create({
      title,
      category: inquiry.category || 'general',
      content,
      source_type: 'inquiry_history',
      source_id: inquiry.id,
      is_active: true,
    });

    return Response.json({
      knowledge_id: knowledge.id,
      title: knowledge.title,
      source_id: inquiry_id,
    });
  } catch (error) {
    console.error('convertInquiryToKnowledge error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});