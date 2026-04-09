import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { announcement_id } = await req.json();
    if (!announcement_id) return Response.json({ error: 'announcement_id required' }, { status: 400 });

    const reads = await base44.asServiceRole.entities.MasterAnnouncementRead.filter({ announcement_id });

    return Response.json({ read_count: reads.length, reads });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});