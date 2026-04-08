/**
 * manualUpdateSubscription
 * 管理者が手動で契約情報を更新
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
    const {
      user_subscription_id,
      trial_end_date,
      end_date,
      grace_end_date,
      status,
      current_plan_code,
      admin_memo,
      reason,
    } = body;

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

    // ===== 2. 更新データ構築 =====
    const updateData = {};
    if (trial_end_date !== undefined) updateData.trial_end_date = trial_end_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (grace_end_date !== undefined) updateData.grace_end_date = grace_end_date;
    if (status !== undefined) updateData.status = status;
    if (current_plan_code !== undefined) updateData.current_plan_code = current_plan_code;
    if (admin_memo !== undefined) updateData.admin_memo = admin_memo;

    updateData.manual_override_by = user.id;
    updateData.manual_override_reason = reason || '';

    // ===== 3. 契約更新 =====
    await base44.asServiceRole.entities.UserSubscription.update(user_subscription_id, updateData);
    subscription = await base44.asServiceRole.entities.UserSubscription.get(user_subscription_id);

    // ===== 4. 履歴記録 =====
    await base44.asServiceRole.entities.SubscriptionHistory.create({
      user_subscription_id,
      user_id: subscription.user_id,
      action_type: 'manual_update',
      before_status: subscription.status,
      after_status: status || subscription.status,
      before_plan_code: subscription.current_plan_code,
      after_plan_code: current_plan_code || subscription.current_plan_code,
      action_date: new Date().toISOString(),
      note: reason,
      operator_user_id: user.id,
      raw_payload: { before: subscription, updates: updateData },
    });

    return Response.json({ subscription });

  } catch (error) {
    console.error('manualUpdateSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});