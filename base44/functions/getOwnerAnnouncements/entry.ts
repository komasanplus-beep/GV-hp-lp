import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();

    // 公開中のお知らせ + 既読レコードを並列取得
    const [allPublished, readRecords] = await Promise.all([
      base44.asServiceRole.entities.MasterAnnouncement.filter(
        { status: 'published' },
        '-publish_start_at'
      ).catch(() => []),
      base44.asServiceRole.entities.MasterAnnouncementRead.filter(
        { user_id: user.id }
      ).catch(() => []),
    ]);

    // 公開期間フィルタ
    const active = allPublished.filter(a => {
      if (a.publish_start_at && a.publish_start_at > now) return false;
      if (a.publish_end_at && a.publish_end_at < now) return false;
      return true;
    });

    const readIds = new Set(readRecords.map(r => r.announcement_id));

    const announcements = active.map(a => ({
      ...a,
      is_read: readIds.has(a.id),
    }));

    const unread_count = announcements.filter(a => !a.is_read).length;

    return Response.json({ announcements, unread_count });
  } catch (error) {
    console.error('[getOwnerAnnouncements]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});