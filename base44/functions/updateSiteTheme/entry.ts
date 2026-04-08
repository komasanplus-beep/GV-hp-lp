/**
 * updateSiteTheme
 * サイトのテーマ設定を更新
 * 
 * PUT /api/update-site-theme
 * body: { site_id, ...themeProps }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'PUT') {
    return Response.json({ error: 'PUT only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { site_id, ...updates } = body;

    if (!site_id) {
      return Response.json({ error: 'site_id required' }, { status: 400 });
    }

    // テーマ取得
    let themes = await base44.asServiceRole.entities.SiteTheme.filter({ site_id });
    
    let theme;
    if (themes && themes.length > 0) {
      // 更新
      theme = await base44.asServiceRole.entities.SiteTheme.update(themes[0].id, updates);
    } else {
      // 作成
      theme = await base44.asServiceRole.entities.SiteTheme.create({
        site_id,
        ...updates,
      });
    }

    return Response.json({ theme, updated: true });

  } catch (error) {
    console.error('updateSiteTheme error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});