import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 全データを並列取得
    const [subsResult, plansResult, sitesResult, lpsResult, aiLogsResult] = await Promise.all([
      base44.entities.Subscription.filter({ user_id: user.id, status: 'active' }, '-created_date', 1).catch(() => []),
      base44.entities.PlanMaster.filter({ status: 'active' }, '-sort_order', 20).catch(() => []),
      base44.entities.Site.filter({ user_id: user.id }, '-created_date', 100).catch(() => []),
      base44.entities.LandingPage.filter({ user_id: user.id }, '-created_date', 100).catch(() => []),
      base44.entities.AIUsageLog.filter({ user_id: user.id }, '-created_date', 200).catch(() => []),
    ]);

    const subscription = subsResult?.[0] || null;
    const allPlans = plansResult || [];
    const sites = sitesResult || [];
    const lps = lpsResult || [];
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
    });
  } catch (error) {
    console.error('[getUserDashboardBundle] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});