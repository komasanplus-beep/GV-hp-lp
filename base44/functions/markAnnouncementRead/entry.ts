import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { announcement_id } = await req.json();
    if (!announcement_id) return Response.json({ error: 'announcement_id required' }, { status: 400 });

    // 既読済みチェック
    const existing = await base44.asServiceRole.entities.MasterAnnouncementRead.filter({
      announcement_id,
      user_id: user.id,
    });

    if (existing.length === 0) {
      await base44.asServiceRole.entities.MasterAnnouncementRead.create({
        announcement_id,
        user_id: user.id,
        read_at: new Date().toISOString(),
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});