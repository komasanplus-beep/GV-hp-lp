import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { site_id, preview } = await req.json();

    if (!site_id) {
      return Response.json({ error: 'site_id required' }, { status: 400 });
    }

    // Site取得
    const sites = await base44.asServiceRole.entities.Site.filter({ id: site_id });
    if (sites.length === 0) {
      return Response.json({ error: 'Site not found' }, { status: 404 });
    }

    const site = sites[0];

    // 公開状態チェック
    if (site.status !== 'published' && !preview) {
      const user = await base44.auth.me();
      if (!user || (user.id !== site.user_id && user.role !== 'admin')) {
        return Response.json({ error: 'Site not published' }, { status: 403 });
      }
    }

    // ホームページ取得
    const homePages = await base44.asServiceRole.entities.SitePage.filter({
      site_id,
      page_type: 'home',
      status: 'published',
    });
    const homePage = homePages[0] || null;

    // ブロック取得（ホームページがある場合）
    let blocks = [];
    if (homePage) {
      blocks = await base44.asServiceRole.entities.SiteBlock.filter(
        { page_id: homePage.id },
        'sort_order'
      );
    }

    // すべてのページを取得（メニュー構築用）
    const all_pages = await base44.asServiceRole.entities.SitePage.filter(
      { site_id },
      'sort_order'
    );

    // SEO情報取得
    const seo = site.seo_config || {};

    return Response.json({
      site,
      homePage,
      blocks,
      all_pages,
      seo,
    });
  } catch (error) {
    console.error('getSiteViewData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});