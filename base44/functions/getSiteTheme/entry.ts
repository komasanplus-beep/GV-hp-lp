/**
 * getSiteTheme
 * サイトのテーマ設定を取得（なければデフォルト作成）
 * 
 * GET /api/get-site-theme?site_id=xxx
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'GET only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const siteId = url.searchParams.get('site_id');

    if (!siteId) {
      return Response.json({ error: 'site_id required' }, { status: 400 });
    }

    // テーマ取得
    let themes = await base44.asServiceRole.entities.SiteTheme.filter({ site_id: siteId });
    
    if (themes && themes.length > 0) {
      return Response.json({ theme: themes[0] });
    }

    // なければデフォルト作成
    const defaultTheme = await base44.asServiceRole.entities.SiteTheme.create({
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

    return Response.json({ theme: defaultTheme, created: true });

  } catch (error) {
    console.error('getSiteTheme error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});