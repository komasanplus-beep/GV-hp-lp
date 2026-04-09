import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();

    // web_search_enabled は常にfalseに強制
    const data = { ...body, web_search_enabled: false };

    const existing = await base44.asServiceRole.entities.InquiryAISetting.filter({ scope_type: 'global' });
    let setting;
    if (existing.length > 0) {
      setting = await base44.asServiceRole.entities.InquiryAISetting.update(existing[0].id, data);
    } else {
      setting = await base44.asServiceRole.entities.InquiryAISetting.create({
        scope_type: 'global',
        scope_id: 'master',
        ...data,
      });
    }

    return Response.json({ setting });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});