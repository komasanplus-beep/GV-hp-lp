/**
 * getLandingPageWithTheme
 * LP+ブロック+テーマを一括取得
 * 
 * GET /api/get-lp-with-theme?lp_id=xxx&site_id=xxx
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'GET only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const lpId = url.searchParams.get('lp_id');
    const siteId = url.searchParams.get('site_id');

    if (!lpId || !siteId) {
      return Response.json({ error: 'lp_id and site_id required' }, { status: 400 });
    }

    // ━━━ LP取得 ━━━
    const lps = await base44.asServiceRole.entities.LandingPage.filter({ id: lpId });
    if (!lps || lps.length === 0) {
      return Response.json({ error: 'LP not found' }, { status: 404 });
    }
    const lp = lps[0];

    // ━━━ ブロック取得 ━━━
    const blocks = await base44.asServiceRole.entities.LPBlock.filter(
      { lp_id: lpId },
      'sort_order'
    );

    // ━━━ テーマ取得 ━━━
    let themes = await base44.asServiceRole.entities.SiteTheme.filter({ site_id: siteId });
    let theme = themes && themes.length > 0 ? themes[0] : null;

    // テーマがなければデフォルト作成
    if (!theme) {
      theme = await base44.asServiceRole.entities.SiteTheme.create({
        site_id: siteId,
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

    return Response.json({
      lp,
      blocks: blocks || [],
      theme,
      useTheme: lp.use_site_theme && theme.apply_to_lp,
    });

  } catch (error) {
    console.error('getLandingPageWithTheme error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});