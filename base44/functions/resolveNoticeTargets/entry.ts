import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * お知らせの配信対象ユーザーを判定・解決する
 * - 配信対象ルール（NoticeTargetRule）から実際のユーザーIDリストを生成
 * - NoticeRecipient に保存
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

    const { notice_id } = await req.json();
    if (!notice_id) {
      return Response.json({ error: 'notice_id required' }, { status: 400 });
    }

    // 配信対象ルールを取得
    const rules = await base44.entities.NoticeTargetRule.filter({ notice_id });
    
    // ルールから対象ユーザーを解決
    const targetUserIds = new Set();

    for (const rule of rules) {
      let users = [];

      if (rule.target_type === 'all') {
        // 全ユーザー
        users = await base44.asServiceRole.entities.User.list();
      } else if (rule.target_type === 'site_user') {
        // サイト利用者
        const sites = await base44.asServiceRole.entities.Site.list();
        const siteOwners = new Set(sites.map(s => s.created_by));
        const allUsers = await base44.asServiceRole.entities.User.list();
        users = allUsers.filter(u => siteOwners.has(u.id));
      } else if (rule.target_type === 'lp_user') {
        // LP利用者
        const lps = await base44.asServiceRole.entities.LandingPage.list();
        const lpOwners = new Set(lps.map(lp => lp.created_by));
        const allUsers = await base44.asServiceRole.entities.User.list();
        users = allUsers.filter(u => lpOwners.has(u.id));
      } else if (rule.target_type === 'both_user') {
        // サイト・LP両方利用者
        const sites = await base44.asServiceRole.entities.Site.list();
        const lps = await base44.asServiceRole.entities.LandingPage.list();
        const siteOwners = new Set(sites.map(s => s.created_by));
        const lpOwners = new Set(lps.map(lp => lp.created_by));
        const allUsers = await base44.asServiceRole.entities.User.list();
        users = allUsers.filter(u => siteOwners.has(u.id) && lpOwners.has(u.id));
      } else if (rule.target_type === 'plan') {
        // 特定プラン利用者
        const subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({ current_plan_code: rule.target_value });
        users = subscriptions.map(s => ({ id: s.user_id }));
      } else if (rule.target_type === 'specific_user') {
        // 個別選択ユーザー (target_value = comma-separated user IDs)
        const userIds = rule.target_value.split(',').map(id => id.trim());
        users = userIds.map(id => ({ id }));
      }

      users.forEach(u => targetUserIds.add(u.id));
    }

    // NoticeRecipient を一括作成
    const recipientData = Array.from(targetUserIds).map(user_id => ({
      notice_id,
      user_id,
      is_read: false,
    }));

    if (recipientData.length > 0) {
      await base44.asServiceRole.entities.NoticeRecipient.bulkCreate(recipientData);
    }

    return Response.json({
      notice_id,
      target_count: targetUserIds.size,
      recipients_created: recipientData.length,
    });
  } catch (error) {
    console.error('resolveNoticeTargets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});