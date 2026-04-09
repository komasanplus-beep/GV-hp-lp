import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { inquiry_id, title, source_type = 'qa_pair' } = await req.json();
    if (!inquiry_id) return Response.json({ error: 'inquiry_id required' }, { status: 400 });

    const inquiry = await base44.asServiceRole.entities.Inquiry.filter({ id: inquiry_id });
    if (!inquiry.length) return Response.json({ error: 'Inquiry not found' }, { status: 404 });

    const inq = inquiry[0];
    const messages = await base44.asServiceRole.entities.InquiryMessage.filter({ inquiry_id }, 'created_date');

    // Q&Aペアとしてナレッジを構築
    const questionPart = `【質問】\n${inq.subject || ''}\n${inq.body || ''}`;
    const adminMsg = messages.filter(m => m.sender_type === 'admin' && m.is_official_reply);
    const answerPart = adminMsg.length
      ? `\n\n【回答】\n${adminMsg.map(m => m.message).join('\n')}`
      : '';

    const content = questionPart + answerPart;
    const knowledgeTitle = title || inq.subject || '無題のナレッジ';

    const knowledge = await base44.asServiceRole.entities.InquiryAIKnowledge.create({
      title: knowledgeTitle,
      content,
      source_type,
      source_inquiry_id: inquiry_id,
      is_active: true,
      tags: inq.category ? [inq.category] : [],
    });

    // Inquiryのナレッジ化フラグを更新（フィールドが存在すれば）
    await base44.asServiceRole.entities.Inquiry.update(inquiry_id, {
      knowledge_candidate_created: true,
    }).catch(() => {});

    return Response.json({ knowledge });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});