import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  try {
    console.log('[getUserDashboardBundle] Request start - no logging calls inside this function');
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Subscription取得
    let subscription = null;
    try {
      const subs = await base44.entities.Subscription.filter(
        { user_id: user.id, status: 'active' },
        '-created_date',
        1
      );
      subscription = subs?.[0] || null;
      await delay(100);
    } catch (e) {
      console.warn('Subscription fetch error:', e.message);
    }

    // 2. Plan定義取得
    let plan = null;
    if (subscription?.plan_code) {
      try {
        const plans = await base44.entities.PlanMaster.filter(
          { code: subscription.plan_code, status: 'active' },
          '-sort_order',
          1
        );
        plan = plans?.[0] || null;
        await delay(100);
      } catch (e) {
        console.warn('Plan fetch error:', e.message);
      }
    }

    // Default to free plan if no subscription
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

    // 3. Usage集計
    let sites = [];
    let lps = [];
    let aiUsed = 0;
    
    try {
      sites = await base44.entities.Site.filter(
        { user_id: user.id },
        '-created_date',
        100
      );
      await delay(100);
    } catch (e) {
      console.warn('Sites fetch error:', e.message);
    }

    try {
      lps = await base44.entities.LandingPage.filter(
        { user_id: user.id },
        '-created_date',
        100
      );
      await delay(100);
    } catch (e) {
      console.warn('LPs fetch error:', e.message);
    }

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    try {
      const aiLogs = await base44.entities.AIUsageLog.filter(
        { user_id: user.id },
        '-created_date',
        200
      );
      aiUsed = (aiLogs || []).filter(
        a => new Date(a.created_date) >= monthStart
      ).length;
      await delay(100);
    } catch (e) {
      console.warn('AI usage fetch error:', e.message);
    }

    // 4. Permission判定
    const siteCount = sites.length;
    const lpCount = lps.length;
    const canCreateSite = siteCount < (plan.site_limit || 1);
    const canCreateLp = lpCount < (plan.lp_limit || 1);
    const canUseAi = (plan.can_use_ai !== false) && aiUsed < (plan.ai_limit || 10);

    console.log('[getUserDashboardBundle] Bundle prepared - returning response');
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
        can_create_site: canCreateSite,
        can_create_lp: canCreateLp,
        can_use_ai: canUseAi,
      },
    });
  } catch (error) {
    console.error('[getUserDashboardBundle] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});