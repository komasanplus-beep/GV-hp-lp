/**
 * calculateAIUsageCost
 * AI従量課金計算エンジン
 *
 * 入力：
 * - user_id
 * - feature_code: 'ai_generation_count' | 'ai_post_generation' | 'ai_lp_generation'
 *
 * 出力：
 * - used: 月間使用回数
 * - free_quota: 無料枠
 * - overage: 超過分
 * - unit_price: 1回あたり料金
 * - overage_cost: 超過分の料金
 * - monthly_cap: 月額上限
 * - total_cost: 実際に課金される金額
 * - billing_status: 'free' | 'payg' | 'capped'
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { user_id = user.id, feature_code = 'ai_generation_count' } = body;

    // ===== 1. サブスクリプション・プラン取得 =====
    let subscriptions = [];
    try {
      subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id });
    } catch (_) {}
    const plan_code = subscriptions[0]?.plan_code || 'free';

    let plans = [];
    try {
      plans = await base44.asServiceRole.entities.PlanMaster.filter({ code: plan_code });
    } catch (_) {}
    const plan = plans[0] || null;

    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    // ===== 2. 月間使用回数取得 =====
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let used = 0;
    let counters = [];
    try {
      counters = await base44.asServiceRole.entities.UsageLimitCounter.filter({
        target_type: 'user',
        target_id: user_id,
        counter_type: feature_code,
        reset_cycle: 'monthly',
      });
    } catch (_) {}

    if (counters.length > 0) {
      const counter = counters[0];
      const lastReset = counter.last_reset_at ? new Date(counter.last_reset_at) : null;
      const resetMonth = lastReset
        ? `${lastReset.getFullYear()}-${String(lastReset.getMonth() + 1).padStart(2, '0')}`
        : null;

      if (resetMonth && resetMonth !== monthYear) {
        used = 0;
      } else {
        used = counter.used_count || 0;
      }
    }

    // ===== 3. 従量課金設定取得 =====
    const paygConfig = plan?.payg_pricing || {};
    const paygEnabled = paygConfig.enabled !== false;
    const freeQuota = paygConfig.free_quota || 0;
    const unitPrice = paygConfig.unit_price_yen || 0;
    const monthlyCap = paygConfig.monthly_cap_yen || null;

    if (!paygEnabled || unitPrice === 0) {
      return Response.json({
        used,
        free_quota: freeQuota,
        overage: Math.max(0, used - freeQuota),
        unit_price: 0,
        overage_cost: 0,
        monthly_cap: monthlyCap,
        total_cost: 0,
        billing_status: 'free',
        plan_code,
      });
    }

    // ===== 4. 超過分と料金計算 =====
    const overage = Math.max(0, used - freeQuota);
    const overageCost = overage * unitPrice;
    const totalCost = monthlyCap !== null ? Math.min(overageCost, monthlyCap) : overageCost;
    const billingStatus = overage > 0 ? (totalCost >= monthlyCap ? 'capped' : 'payg') : 'free';

    return Response.json({
      used,
      free_quota: freeQuota,
      overage,
      unit_price: unitPrice,
      overage_cost: overageCost,
      monthly_cap: monthlyCap,
      total_cost: totalCost,
      billing_status: billingStatus,
      plan_code,
    });

  } catch (error) {
    console.error('calculateAIUsageCost error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});