/**
 * migrateExistingLPToTheme
 * 既存LPすべてに use_site_theme=true を付与（互換対応）
 * 
 * POST /api/migrate-lp-to-theme?site_id=xxx
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const url = new URL(req.url);
    const siteId = url.searchParams.get('site_id');

    if (!siteId) {
      return Response.json({ error: 'site_id required' }, { status: 400 });
    }

    // 該当サイトのLP取得
    const lps = await base44.asServiceRole.entities.LandingPage.filter({ site_id: siteId });
    
    let migratedCount = 0;
    for (const lp of lps || []) {
      // use_site_themeがまだなければ設定
      if (lp.use_site_theme !== false) {
        await base44.asServiceRole.entities.LandingPage.update(lp.id, {
          use_site_theme: true,
        });
        migratedCount++;
      }
    }

    return Response.json({ migratedCount });

  } catch (error) {
    console.error('migrateExistingLPToTheme error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});