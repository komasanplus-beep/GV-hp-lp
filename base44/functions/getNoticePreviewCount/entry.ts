import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * お知らせの配信対象人数をプレビュー
 * NoticeTargetRule から実際の対象人数を計算（未配信の場合）
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST required' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { rules } = await req.json();
    if (!Array.isArray(rules)) {
      return Response.json({ error: 'rules array required' }, { status: 400 });
    }

    const targetUserIds = new Set();

    for (const rule of rules) {
      let users = [];

      if (rule.target_type === 'all') {
        users = await base44.asServiceRole.entities.User.list();
      } else if (rule.target_type === 'site_user') {
        const sites = await base44.asServiceRole.entities.Site.list();
        const siteOwners = new Set(sites.map(s => s.created_by));
        const allUsers = await base44.asServiceRole.entities.User.list();
        users = allUsers.filter(u => siteOwners.has(u.id));
      } else if (rule.target_type === 'lp_user') {
        const lps = await base44.asServiceRole.entities.LandingPage.list();
        const lpOwners = new Set(lps.map(lp => lp.created_by));
        const allUsers = await base44.asServiceRole.entities.User.list();
        users = allUsers.filter(u => lpOwners.has(u.id));
      } else if (rule.target_type === 'plan') {
        const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({ current_plan_code: rule.target_value });
        users = subscriptions.map(s => ({ id: s.user_id }));
      } else if (rule.target_type === 'specific_user') {
        const userIds = rule.target_value.split(',').map(id => id.trim());
        users = userIds.map(id => ({ id }));
      }

      users.forEach(u => targetUserIds.add(u.id));
    }

    return Response.json({
      preview_count: targetUserIds.size,
      unique_targets: Array.from(targetUserIds),
    });
  } catch (error) {
    console.error('getNoticePreviewCount error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});