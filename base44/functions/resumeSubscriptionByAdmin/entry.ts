/**
 * resumeSubscriptionByAdmin
 * 管理者が手動で suspended / grace → active に復旧
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
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

    // ===== 2. 復旧処理 =====
    const beforeStatus = subscription.status;
    await base44.asServiceRole.entities.UserSubscription.update(user_subscription_id, {
      status: 'active',
      grace_start_date: null,
      grace_end_date: null,
      suspended_at: null,
      manual_override_by: user.id,
      manual_override_reason: reason || 'Admin resumption',
    });

    subscription = await base44.asServiceRole.entities.UserSubscription.get(user_subscription_id);

    // ===== 3. 履歴記録 =====
    await base44.asServiceRole.entities.SubscriptionHistory.create({
      user_subscription_id,
      user_id: subscription.user_id,
      action_type: 'resume',
      before_status: beforeStatus,
      after_status: 'active',
      action_date: new Date().toISOString(),
      note: reason,
      operator_user_id: user.id,
      raw_payload: { subscription },
    });

    return Response.json({ subscription });

  } catch (error) {
    console.error('resumeSubscriptionByAdmin error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});