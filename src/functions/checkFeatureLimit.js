import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * checkFeatureLimit
 * 
 * 利用回数 / 数量の上限チェック
 * 
 * 入力：
 * - counter_type (site_count, lp_count, ai_generation_count等)
 * - user_id / site_id / tenant_id
 * - amount (増加させる量)
 * 
 * 出力：
 * - allowed: boolean
 * - used: 現在の使用数
 * - limit: プランの上限
 * - remaining: 残数
 */
/* global Deno */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { counter_type, user_id = user.id, site_id, tenant_id, amount = 1 } = body;

    if (!counter_type) {
      return Response.json(
        { error: 'counter_type is required' },
        { status: 400 }
      );
    }

    // ===== 1. プラン情報を取得 =====
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user_id
    });
    const subscription = subscriptions[0] || null;
    const plan_code = subscription?.plan_code || 'free';

    const plans = await base44.asServiceRole.entities.PlanMaster.filter({
      code: plan_code
    });
    const plan = plans[0] || null;

    const plan_limits = plan?.limits || {};
    const limit = plan_limits[counter_type];

    // 上限が設定されていない場合は無制限
    if (limit === undefined || limit === null || limit === -1) {
      return Response.json({
        allowed: true,
        used: 0,
        limit: null, // 無制限
        remaining: null,
        counter_type: counter_type
      });
    }

    // ===== 2. 現在の使用数をカウント =====
    let used = 0;

    if (counter_type === 'site_count') {
      // user_id がオーナーのサイト数をカウント
      const sites = await base44.asServiceRole.entities.Site.filter({
        owner_user_id: user_id,
        status: 'published'
      });
      used = sites.length;
    } else if (counter_type === 'lp_count') {
      // user_id が作成した LP 数（published）
      const lps = await base44.asServiceRole.entities.LandingPage.filter({
        user_id: user_id,
        status: 'published'
      });
      used = lps.length;
    } else if (counter_type === 'ai_generation_count') {
      // 月間 AI 生成数をカウント（UsageLimitCounter から）
      const counters = await base44.asServiceRole.entities.UsageLimitCounter.filter({
        target_type: 'user',
        target_id: user_id,
        counter_type: counter_type,
        reset_cycle: 'monthly'
      });
      if (counters.length > 0) {
        used = counters[0].used_count || 0;

        // リセット周期をチェック
        const lastReset = counters[0].last_reset_at ? new Date(counters[0].last_reset_at) : null;
        const now = new Date();
        if (lastReset && new Date(lastReset.getFullYear(), lastReset.getMonth() + 1, 1) <= now) {
          // 月が変わったのでリセット
          used = 0;
        }
      }
    } else {
      // 他の counter_type は UsageLimitCounter から直接参照
      const counters = await base44.asServiceRole.entities.UsageLimitCounter.filter({
        target_type: 'user',
        target_id: user_id,
        counter_type: counter_type
      });
      if (counters.length > 0) {
        used = counters[0].used_count || 0;
      }
    }

    // ===== 3. 上限チェック =====
    const remaining = limit - used;
    const allowed = remaining >= amount;

    return Response.json({
      allowed: allowed,
      used: used,
      limit: limit,
      remaining: remaining,
      counter_type: counter_type,
      plan_code: plan_code
    });
  } catch (error) {
    console.error('checkFeatureLimit error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});