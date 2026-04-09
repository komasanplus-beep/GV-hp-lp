import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * getAdminSiteList
 * ログインユーザーが所有するサイト一覧を取得
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST required' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーが所有するサイト一覧を取得
    const sites = await base44.asServiceRole.entities.Site.filter(
      { user_id: user.id },
      '-created_date',
      100
    );

    console.log(`[getAdminSiteList] user=${user.id} count=${sites.length}`);

    return Response.json({
      ok: true,
      items: sites.map(s => ({
        id: s.id,
        site_name: s.site_name,
        business_type: s.business_type,
        status: s.status,
        enabled_features: s.enabled_features,
        created_date: s.created_date,
        updated_date: s.updated_date,
      })),
    });
  } catch (error) {
    console.error('[getAdminSiteList] error:', error.message);
    return Response.json({
      ok: false,
      error: error.message,
    }, { status: 500 });
  }
});