/**
 * aiGuard.js
 * AI機能実行前の共通ガード関数
 *
 * invoke方法:
 * base44.functions.invoke('aiGuard', { feature_code, site_id })
 *
 * 返り値:
 * { allowed: true, source, remaining, used, limit }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized', allowed: false }, { status: 401 });
    }

    const body = await req.json();
    const { feature_code, site_id } = body;

    if (!feature_code) {
      return Response.json({ error: 'feature_code is required', allowed: false }, { status: 400 });
    }

    const user_id = user.id;

    // ===== 1. FeatureGrant による強制 disable チェック =====
    let disableGrants = [];
    try {
      disableGrants = await base44.asServiceRole.entities.FeatureGrant.filter({
        feature_code,
        grant_type: 'disable',
        status: 'active',
      });
    } catch (e) {
      console.warn('aiGuard: FeatureGrant filter error:', e.message);
      disableGrants = [];
    }

    for (const grant of disableGrants) {
      if (grant.end_at && new Date(grant.end_at) < new Date()) continue;
      if (
        (grant.target_type === 'user' && grant.target_id === user_id) ||
        (grant.target_type === 'site' && grant.target_id === site_id)
      ) {
        await logAIUsage(base44, { user_id, site_id, feature_code, status: 'blocked', error_message: grant.reason || 'disabled by admin' });
        return Response.json({
          allowed: false,
          source: 'grant_disable',
          reason: grant.reason || 'この機能は管理者によって無効化されています',
        }, { status: 403 });
      }
    }

    // ===== 2. Subscription / Plan チェック =====
    let subscriptions = [];
    try {
      subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id });
    } catch (_) { subscriptions = []; }
    const plan_code = subscriptions[0]?.plan_code || 'free';

    let plans = [];
    try {
      plans = await base44.asServiceRole.entities.PlanMaster.filter({ code: plan_code });
    } catch (_) { plans = []; }
    const plan = plans[0] || null;

    // FeatureGrant の enable で個別許可されているか確認
    let enableGrants = [];
    try {
      enableGrants = await base44.asServiceRole.entities.FeatureGrant.filter({
        feature_code,
        grant_type: 'enable',
        status: 'active',
      });
    } catch (e) {
      console.warn('aiGuard: FeatureGrant enable filter error:', e.message);
      enableGrants = [];
    }

    const hasEnableGrant = enableGrants.some(g => {
      if (g.end_at && new Date(g.end_at) < new Date()) return false;
      return (
        (g.target_type === 'user' && g.target_id === user_id) ||
        (g.target_type === 'site' && g.target_id === site_id)
      );
    });

    // プランに含まれているか OR 個別付与で許可されているか
    const planAllows = plan?.included_features?.includes(feature_code) ?? false;

    if (!planAllows && !hasEnableGrant) {
      await logAIUsage(base44, { user_id, site_id, feature_code, status: 'blocked', error_message: `feature not in plan: ${plan_code}` });
      return Response.json({
        allowed: false,
        source: 'plan_deny',
        reason: `現在のプラン（${plan_code}）ではこのAI機能は利用できません`,
      }, { status: 403 });
    }

    // ===== 3. 月間利用回数チェック =====
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // counter_type は常に 'ai_generation_count' で統一
    let counters = [];
    try {
      counters = await base44.asServiceRole.entities.UsageLimitCounter.filter({
        target_type: 'user',
        target_id: user_id,
        counter_type: 'ai_generation_count',
        reset_cycle: 'monthly',
      });
    } catch (_) { counters = []; }

    let counter = counters[0] || null;
    let used = 0;

    if (counter) {
      const lastReset = counter.last_reset_at ? new Date(counter.last_reset_at) : null;
      const resetMonth = lastReset
        ? `${lastReset.getFullYear()}-${String(lastReset.getMonth() + 1).padStart(2, '0')}`
        : null;

      if (resetMonth && resetMonth !== monthYear) {
        // 月が変わったのでリセット
        try {
          await base44.asServiceRole.entities.UsageLimitCounter.update(counter.id, {
            used_count: 0,
            last_reset_at: now.toISOString(),
          });
        } catch (_) {}
        used = 0;
      } else {
        used = counter.used_count || 0;
      }
    }

    // プランの上限を確認（ai_generation_count で統一）
    // -1 または undefined/null = 無制限
    const rawLimit = plan?.limits?.['ai_generation_count'];
    const limit = (rawLimit === undefined || rawLimit === null) ? null : rawLimit;

    if (limit !== null && limit !== -1 && used >= limit) {
      await logAIUsage(base44, { user_id, site_id, feature_code, status: 'limit_exceeded', error_message: `limit: ${limit}, used: ${used}` });
      return Response.json({
        allowed: false,
        source: 'limit_exceeded',
        reason: `月間利用回数の上限（${limit}回）に達しました。次月以降にご利用ください。`,
        used,
        limit,
        remaining: 0,
      }, { status: 429 });
    }

    // ===== 4. 利用回数カウントアップ =====
    if (counter) {
      try {
        await base44.asServiceRole.entities.UsageLimitCounter.update(counter.id, {
          used_count: used + 1,
        });
      } catch (_) {}
    } else {
      try {
        await base44.asServiceRole.entities.UsageLimitCounter.create({
          target_type: 'user',
          target_id: user_id,
          counter_type: 'ai_generation_count',
          reset_cycle: 'monthly',
          used_count: 1,
          last_reset_at: now.toISOString(),
        });
      } catch (_) {}
    }

    const remaining = (limit === null || limit === -1) ? null : limit - used - 1;

    return Response.json({
      allowed: true,
      source: 'ok',
      used: used + 1,
      limit,
      remaining,
      plan_code,
    });

  } catch (error) {
    console.error('aiGuard error:', error);
    return Response.json({ error: error.message, allowed: false }, { status: 500 });
  }
});

async function logAIUsage(base44, { user_id, site_id, feature_code, status, error_message }) {
  try {
    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id,
      site_id: site_id || '',
      feature_code,
      status,
      error_message: error_message || '',
    });
  } catch (e) {
    console.warn('aiGuard: failed to log usage', e.message);
  }
}