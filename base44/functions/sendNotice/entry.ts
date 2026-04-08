import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * お知らせを配信状態に変更
 * - 配信対象を確定（resolveNoticeTargets を呼び出し）
 * - Notice の status を "sent", sent_at を現在時刻に更新
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

    const { notice_id, scheduled_at } = await req.json();
    if (!notice_id) {
      return Response.json({ error: 'notice_id required' }, { status: 400 });
    }

    // 配信対象を解決
    await base44.functions.invoke('resolveNoticeTargets', { notice_id });

    // Notice を更新
    const updateData = {
      status: scheduled_at ? 'scheduled' : 'sent',
      sent_at: scheduled_at ? null : new Date().toISOString(),
      scheduled_at: scheduled_at || null,
    };

    await base44.asServiceRole.entities.Notice.update(notice_id, updateData);

    return Response.json({
      notice_id,
      status: updateData.status,
      sent_at: updateData.sent_at,
    });
  } catch (error) {
    console.error('sendNotice error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});