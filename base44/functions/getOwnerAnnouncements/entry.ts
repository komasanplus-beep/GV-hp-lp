import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();

    // 公開中のお知らせを全件取得
    const allPublished = await base44.asServiceRole.entities.MasterAnnouncement.filter(
      { status: 'published' },
      '-publish_start_at'
    );

    // 公開期間フィルタ
    const active = allPublished.filter(a => {
      if (a.publish_start_at && a.publish_start_at > now) return false;
      if (a.publish_end_at && a.publish_end_at < now) return false;
      return true;
    });

    // 対象ユーザーフィルタ用データを並列取得
    const [userSites, userSubs, userLPs, readRecords] = await Promise.all([
      base44.asServiceRole.entities.Site.filter({ created_by: user.email }).catch(() => []),
      base44.asServiceRole.entities.UserSubscription.filter({ user_id: user.id }).catch(() => []),
      base44.asServiceRole.entities.LandingPage.filter({ user_id: user.id }, '-created_date', 1).catch(() => []),
      base44.asServiceRole.entities.MasterAnnouncementRead.filter({ user_id: user.id }).catch(() => []),
    ]);

    const hasHomepage = userSites.some(s => !s.lp_only);
    const hasLP = userSites.some(s => s.lp_only) || userLPs.length > 0;
    const siteTemplateCategories = [...new Set(userSites.map(s => s.template_category).filter(Boolean))];
    const activePlan = userSubs[0]?.current_plan_code || 'free';

    const targeted = active.filter(a => {
      if (a.target_mode === 'all') return true;
      if (a.target_mode === 'selected_users') {
        return (a.target_user_ids || []).includes(user.id);
      }
      // filter mode
      const f = a.target_filters || {};
      if (f.site_type?.length) {
        const want = f.site_type;
        if (want.includes('homepage') && !hasHomepage) return false;
        if (want.includes('lp') && !hasLP) return false;
      }
      if (f.template_categories?.length) {
        const match = f.template_categories.some(c => siteTemplateCategories.includes(c));
        if (!match) return false;
      }
      if (f.plans?.length) {
        if (!f.plans.includes(activePlan)) return false;
      }
      return true;
    });

    const readIds = new Set(readRecords.map(r => r.announcement_id));

    const result = targeted.map(a => ({
      ...a,
      is_read: readIds.has(a.id),
    }));

    const unread_count = result.filter(a => !a.is_read).length;

    return Response.json({ announcements: result, unread_count });
  } catch (error) {
    console.error('[getOwnerAnnouncements]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});