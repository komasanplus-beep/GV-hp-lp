/**
 * getLandingPageWithTheme
 * LP+ブロック+テーマを一括取得
 *
 * 引数（いずれか必須）:
 *   lp_id                : LP直接指定
 *   domain               : 独自ドメイン指定
 *   subdomain            : サブドメイン指定
 *   site_id + lp_slug    : site_path指定
 *   site_id              : テーマ取得用（lp_id指定時も任意で渡せる）
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'GET only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const lpId = url.searchParams.get('lp_id');
    const domain = url.searchParams.get('domain');
    const subdomain = url.searchParams.get('subdomain');
    const siteId = url.searchParams.get('site_id');
    const lpSlug = url.searchParams.get('lp_slug');

    // ━━━ LP解決 ━━━
    let lp = null;

    if (lpId) {
      // 1. lp_id 直接指定
      const lps = await base44.asServiceRole.entities.LandingPage.filter({ id: lpId });
      lp = lps?.[0] || null;
    } else if (domain) {
      // 2. 独自ドメイン
      const mappings = await base44.asServiceRole.entities.DomainMapping.filter({ domain, domain_type: 'custom_domain' });
      const mapping = mappings?.[0];
      if (mapping?.landing_page_id) {
        const lps = await base44.asServiceRole.entities.LandingPage.filter({ id: mapping.landing_page_id });
        lp = lps?.[0] || null;
      }
    } else if (subdomain) {
      // 3. サブドメイン
      const mappings = await base44.asServiceRole.entities.DomainMapping.filter({ subdomain, domain_type: 'subdomain' });
      const mapping = mappings?.[0];
      if (mapping?.landing_page_id) {
        const lps = await base44.asServiceRole.entities.LandingPage.filter({ id: mapping.landing_page_id });
        lp = lps?.[0] || null;
      }
    } else if (siteId && lpSlug) {
      // 4. site_path: site_idに紐づくDomainMappingからlanding_page_idを取得し、slugで照合
      const mappings = await base44.asServiceRole.entities.DomainMapping.filter({ site_id: siteId, domain_type: 'site_path' });
      if (mappings && mappings.length > 0) {
        const lpIds = mappings.map(m => m.landing_page_id).filter(Boolean);
        for (const id of lpIds) {
          const lps = await base44.asServiceRole.entities.LandingPage.filter({ id, slug: lpSlug });
          if (lps?.[0]) { lp = lps[0]; break; }
        }
      }
    } else {
      return Response.json({ error: 'lp_id, domain, subdomain, or site_id+lp_slug required' }, { status: 400 });
    }

    if (!lp) {
      return Response.json({ error: 'LP not found' }, { status: 404 });
    }

    // ━━━ ブロック取得 ━━━
    const blocks = await base44.asServiceRole.entities.LPBlock.filter(
      { lp_id: lp.id },
      'sort_order'
    );

    // ━━━ テーマ取得 ━━━
    const resolvedSiteId = siteId || null;
    let theme = null;
    if (resolvedSiteId) {
      const themes = await base44.asServiceRole.entities.SiteTheme.filter({ site_id: resolvedSiteId });
      theme = themes && themes.length > 0 ? themes[0] : null;

      if (!theme) {
        theme = await base44.asServiceRole.entities.SiteTheme.create({
          site_id: resolvedSiteId,
          font_family_heading: 'sans-serif',
          font_family_body: 'sans-serif',
          font_size_h1: 32,
          font_size_h2: 24,
          font_size_h3: 18,
          font_size_body: 14,
          line_height_body: 1.6,
          section_spacing: 80,
          container_width: 1200,
          primary_color: '#000000',
          accent_color: '#FF6B6B',
          background_color: '#FFFFFF',
          card_radius: 8,
          button_style: 'solid',
          icon_style: 'circle',
          apply_to_lp: true,
        });
      }
    }

    return Response.json({
      lp,
      blocks: blocks || [],
      theme,
      useTheme: lp.use_site_theme && theme?.apply_to_lp,
    });

  } catch (error) {
    console.error('getLandingPageWithTheme error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});