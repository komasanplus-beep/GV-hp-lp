/**
 * cancelSubscription
 * 解約処理
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
    const { user_subscription_id, reason } = body;

    if (!user_subscription_id) {
      return Response.json({ error: 'user_subscription_id is required' }, { status: 400 });
    }

    // ===== 1. 契約取得 =====
    let subscription = null;
    try {
      subscription = await base44.asServiceRole.entities.UserSubscription.get(user_subscription_id);
    } catch (_) {}

    if (!subscription) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // ===== 2. 解約処理 =====
    // 現在期限までは有効のまま canceled に遷移
    await base44.asServiceRole.entities.UserSubscription.update(user_subscription_id, {
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    });

    subscription = await base44.asServiceRole.entities.UserSubscription.get(user_subscription_id);

    // ===== 3. 履歴記録 =====
    await base44.asServiceRole.entities.SubscriptionHistory.create({
      user_subscription_id,
      user_id: subscription.user_id,
      action_type: 'cancel',
      before_status: subscription.status,
      after_status: 'canceled',
      action_date: new Date().toISOString(),
      note: reason,
      raw_payload: { subscription },
    });

    return Response.json({ subscription });

  } catch (error) {
    console.error('cancelSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});