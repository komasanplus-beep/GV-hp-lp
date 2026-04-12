import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authUser = await base44.auth.me();

    if (!authUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id } = await req.json().catch(() => ({}));

    let user = authUser;
    if (user_id) {
      const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
      if (users?.[0]) user = users[0];
    }

    // 全データを並列取得
    const [subsResult, plansResult, sitesResult, lpsResult, inquiriesResult, bookingsResult, aiLogsResult] = await Promise.all([
      base44.asServiceRole.entities.Subscription.filter({ user_id: user.id, status: 'active' }, '-created_date', 1).catch(() => []),
      base44.asServiceRole.entities.PlanMaster.filter({ status: 'active' }, '-sort_order', 20).catch(() => []),
      base44.asServiceRole.entities.Site.filter({ user_id: user.id }, '-created_date', 100).catch(() => []),
      base44.asServiceRole.entities.LandingPage.filter({ user_id: user.id }, '-created_date', 100).catch(() => []),
      base44.asServiceRole.entities.Inquiry.filter({ user_id: user.id, is_read: false }, '-created_date', 20).catch(() => []),
      base44.asServiceRole.entities.Booking.filter({ user_id: user.id }, '-created_date', 50).catch(() => []),
      base44.asServiceRole.entities.AIUsageLog.filter({ user_id: user.id }, '-created_date', 50).catch(() => []),
    ]);

    const subscription = subsResult?.[0] || null;
    const allPlans = plansResult || [];
    const sites = sitesResult || [];
    const lps = lpsResult || [];
    const inquiries = inquiriesResult || [];
    const bookings = bookingsResult || [];
    const aiLogs = aiLogsResult || [];

    // Planをplan_codeでマッチ
    let plan = subscription?.plan_code
      ? allPlans.find(p => p.code === subscription.plan_code) || null
      : null;

    if (!plan) {
      plan = {
        code: 'free',
        name: 'Free',
        site_limit: 1,
        lp_limit: 1,
        ai_limit: 10,
        can_use_blog: false,
        can_use_ab_test: false,
        can_use_custom_domain: false,
        can_use_ai: true,
      };
    }

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const aiUsed = aiLogs.filter(a => new Date(a.created_date) >= monthStart).length;
    const siteCount = sites.length;
    const lpCount = lps.length;

    // Calculate today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.created_date);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    });

    // Wait for analytics and guests
    const analyticsResult = sites?.length > 0 ? await base44.asServiceRole.entities.SiteAnalyticsEvent.filter({ site_id: sites[0].id }, '-created_date', 500).catch(() => []) : [];
    const guestsResult = sites?.length > 0 ? await base44.asServiceRole.entities.Guest.filter({ site_id: sites[0].id }, '-created_date', 500).catch(() => []) : [];

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      subscription: {
        plan_code: subscription?.plan_code || 'free',
        status: subscription?.status || 'none',
        is_active: subscription?.status === 'active',
        trial_end: subscription?.trial_end || null,
      },
      plan: {
        code: plan.code,
        name: plan.name,
        site_limit: plan.site_limit || 1,
        lp_limit: plan.lp_limit || 1,
        ai_limit: plan.ai_limit || 10,
        can_use_blog: plan.can_use_blog || false,
        can_use_ab_test: plan.can_use_ab_test || false,
        can_use_custom_domain: plan.can_use_custom_domain || false,
        can_use_ai: plan.can_use_ai !== false,
      },
      usage: {
        site_count: siteCount,
        lp_count: lpCount,
        ai_used_count: aiUsed,
      },
      permissions: {
        can_create_site: siteCount < (plan.site_limit || 1),
        can_create_lp: lpCount < (plan.lp_limit || 1),
        can_use_ai: (plan.can_use_ai !== false) && aiUsed < (plan.ai_limit || 10),
      },
      dashboard: {
        unread_inquiries: inquiries.length,
        today_bookings: todayBookings.length,
        total_inquiries: inquiries.length,
      },
      analytics: analyticsResult || [],
      guests: guestsResult || [],
    });
  } catch (error) {
    console.error('[getUserDashboardBundle]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});