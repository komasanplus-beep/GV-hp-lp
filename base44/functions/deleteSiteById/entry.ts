import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST required' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admin or master users to delete sites via this function
    if (user?.role !== 'admin' && user?.role !== 'master') {
      return Response.json({ error: 'Forbidden: Admin or Master access required' }, { status: 403 });
    }

    const body = await req.json();
    const { siteId } = body;

    if (!siteId) {
      return Response.json({ success: false, error: 'siteId is required' }, { status: 400 });
    }

    // Check if user is the site owner or has admin/master role
    const site = await base44.asServiceRole.entities.Site.get(siteId).catch(() => null);
    const isOwner = site && site.user_id === user.id;
    const isAdmin = user?.role === 'admin' || user?.role === 'master';
    
    if (!isOwner && !isAdmin) {
      return Response.json({ error: 'Forbidden: You can only delete your own sites' }, { status: 403 });
    }

    console.log(`[deleteSiteById] User ${user.id} (owner=${isOwner}, admin=${isAdmin}) attempting to delete site ${siteId}`);

    // Delete associated SitePage and SiteBlock entities first
    const pages = await base44.asServiceRole.entities.SitePage.filter({ site_id: siteId }).catch(() => []);
    for (const p of pages) {
      const blocks = await base44.asServiceRole.entities.SiteBlock.filter({ page_id: p.id }).catch(() => []);
      for (const b of blocks) {
        await base44.asServiceRole.entities.SiteBlock.delete(b.id).catch(() => {});
      }
      await base44.asServiceRole.entities.SitePage.delete(p.id).catch(() => {});
    }

    // Delete the Site entity itself
    await base44.asServiceRole.entities.Site.delete(siteId);

    console.log(`[deleteSiteById] Site ${siteId} and associated data deleted successfully.`);

    return Response.json({ success: true, message: `Site ${siteId} deleted.` });
  } catch (error) {
    console.error('[deleteSiteById] error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});