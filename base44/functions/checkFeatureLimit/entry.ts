import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * checkFeatureLimit
 * 利用回数 / 数量の上限チェック
 *
 * 入力：
 * - counter_type: 'site_count' | 'lp_count' | 'ai_generation_count' | etc.
 * - user_id / site_id / tenant_id
 * - amount (増加させる量, default: 1)
 *
 * 出力：
 * - allowed: boolean
 * - used: 現在の使用数
 * - limit: プランの上限 (null = 無制限)
 * - remaining: 残数
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { counter_type, user_id = user.id, site_id, amount = 1 } = body;

    if (!counter_type) {
      return Response.json({ error: 'counter_type is required' }, { status: 400 });
    }

    // ===== 1. プラン情報を取得 =====
    let subscriptions = [];
    try {
      subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id });
    } catch (e) {
      console.warn('checkFeatureLimit: Subscription filter error:', e.message);
      subscriptions = [];
    }
    const subscription = subscriptions[0] || null;
    const plan_code = subscription?.plan_code || 'free';

    let plans = [];
    try {
      plans = await base44.asServiceRole.entities.PlanMaster.filter({ code: plan_code });
    } catch (e) {
      console.warn('checkFeatureLimit: PlanMaster filter error:', e.message);
      plans = [];
    }
    const plan = plans[0] || null;

    const plan_limits = plan?.limits || {};
    const limit = plan_limits[counter_type];

    // 上限が設定されていない場合は無制限
    if (limit === undefined || limit === null || limit === -1) {
      return Response.json({
        allowed: true, used: 0, limit: null, remaining: null,
        counter_type, plan_code
      });
    }

    // ===== 2. 現在の使用数をカウント =====
    let used = 0;

    if (counter_type === 'site_count') {
      let sites = [];
      try {
        sites = await base44.asServiceRole.entities.Site.filter({ user_id });
      } catch (e) {
        console.warn('checkFeatureLimit: Site filter error:', e.message);
        sites = [];
      }
      used = sites.length;

    } else if (counter_type === 'lp_count') {
      let lps = [];
      try {
        lps = await base44.asServiceRole.entities.LandingPage.filter({ user_id });
      } catch (e) {
        console.warn('checkFeatureLimit: LandingPage filter error:', e.message);
        lps = [];
      }
      used = lps.length;

    } else if (counter_type === 'ai_generation_count' || counter_type === 'ai_post_generation' || counter_type === 'ai_lp_generation') {
      // 月間 AI 生成数 (UsageLimitCounter から)
      let counters = [];
      try {
        counters = await base44.asServiceRole.entities.UsageLimitCounter.filter({
          target_type: 'user',
          target_id: user_id,
          counter_type,
          reset_cycle: 'monthly'
        });
      } catch (e) {
        console.warn(`checkFeatureLimit: UsageLimitCounter filter error (${counter_type}):`, e.message);
        counters = [];
      }

      if (counters.length > 0) {
        const lastReset = counters[0].last_reset_at ? new Date(counters[0].last_reset_at) : null;
        const now = new Date();
        const isNewMonth = lastReset &&
          new Date(lastReset.getFullYear(), lastReset.getMonth() + 1, 1) <= now;
        used = isNewMonth ? 0 : (counters[0].used_count || 0);
      }

    } else {
      let counters = [];
      try {
        counters = await base44.asServiceRole.entities.UsageLimitCounter.filter({
          target_type: 'user', target_id: user_id, counter_type
        });
      } catch (e) {
        console.warn(`checkFeatureLimit: UsageLimitCounter filter error (${counter_type}):`, e.message);
        counters = [];
      }
      used = counters[0]?.used_count || 0;
    }

    // ===== 3. 上限チェック =====
    const remaining = limit - used;
    const allowed = remaining >= amount;

    return Response.json({
      allowed, used, limit, remaining, counter_type, plan_code
    });

  } catch (error) {
    console.error('checkFeatureLimit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});