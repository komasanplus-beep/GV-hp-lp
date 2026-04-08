/**
 * ensureUserSubscription.js
 * ユーザー登録時またはオンデマンドで Subscription を確保する
 *
 * 入力：user_id (オプション。指定なしは current user)
 * 出力：{ subscription_id, plan_code, status }
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
    const user_id = body.user_id || user.id;

    // ===== 既存 Subscription をチェック =====
    let subscriptions = [];
    try {
      subscriptions = await base44.asServiceRole.entities.Subscription.filter({
        user_id,
      });
    } catch (e) {
      console.warn('ensureUserSubscription: filter error', e.message);
    }

    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      return Response.json({
        subscription_id: sub.id,
        plan_code: sub.plan_code,
        status: sub.status,
        created: false,
      });
    }

    // ===== 新規作成 =====
    const now = new Date();
    let newSub;
    try {
      newSub = await base44.asServiceRole.entities.Subscription.create({
        user_id,
        plan_code: 'free',
        billing_cycle: 'monthly',
        status: 'active',
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString(),
        payment_provider: 'none',
      });
    } catch (e) {
      console.error('ensureUserSubscription: create error', e);
      return Response.json({ error: e.message }, { status: 500 });
    }

    return Response.json({
      subscription_id: newSub.id,
      plan_code: newSub.plan_code,
      status: newSub.status,
      created: true,
    });

  } catch (error) {
    console.error('ensureUserSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});