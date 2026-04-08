import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req, { allowAnonymous: true });
    
    const siteId = new URL(req.url).searchParams.get('site_id');
    if (!siteId) {
      return Response.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Get manual navigation links
    const navLinks = await base44.asServiceRole.entities.NavigationLink.filter(
      { site_id: siteId, is_active: true },
      'sort_order'
    );

    // Get site with page menu config
    const site = await base44.asServiceRole.entities.Site.filter({ id: siteId }).then(r => r[0]);
    if (!site) {
      return Response.json({ error: 'Site not found' }, { status: 404 });
    }

    const navConfig = site.navigation_config || {};

    // Get site pages for auto menu
    const pages = await base44.asServiceRole.entities.SitePage.filter(
      { site_id: siteId, status: 'published' },
      'sort_order'
    );

    // Build auto menu pages
    const autoMenuPages = (navConfig.auto_menu_pages || [])
      .map(m => pages.find(p => p.id === m.page_id))
      .filter(Boolean)
      .sort((a, b) => {
        const aIdx = navConfig.auto_menu_pages.findIndex(m => m.page_id === a.id);
        const bIdx = navConfig.auto_menu_pages.findIndex(m => m.page_id === b.id);
        return aIdx - bIdx;
      });

    // Merge and organize by placement
    const headerItems = [
      ...autoMenuPages.map((p, i) => ({
        type: 'page',
        label: p.title,
        url: `/${p.slug}`,
        target: '_self',
        placement: 'header',
        sort_order: i,
      })),
      ...navLinks.filter(l => l.placement === 'header' || l.placement === 'both')
        .map((l, i) => ({
          type: 'manual',
          label: l.label,
          url: l.url,
          target: l.target,
          placement: 'header',
          sort_order: (autoMenuPages.length) + i,
        })),
    ].sort((a, b) => a.sort_order - b.sort_order);

    const footerItems = navLinks
      .filter(l => l.placement === 'footer' || l.placement === 'both')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(l => ({
        type: 'manual',
        label: l.label,
        url: l.url,
        target: l.target,
        placement: 'footer',
      }));

    return Response.json({
      header: headerItems,
      footer: footerItems,
      config: {
        booking_button_text: navConfig.booking_button_text || 'ご予約',
        booking_button_url: navConfig.booking_button_url || '#booking',
        show_admin_link: navConfig.show_admin_link || false,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});