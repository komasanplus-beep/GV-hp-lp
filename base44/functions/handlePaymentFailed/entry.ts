/**
 * handlePaymentFailed
 * 支払い失敗時：status を grace に変更
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
    const { user_subscription_id, payment_payload, error_message } = body;

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

    // ===== 2. グローバル設定から grace_days 取得 =====
    let globalSettings = [];
    try {
      globalSettings = await base44.asServiceRole.entities.BillingGlobalSetting.list();
    } catch (_) {}
    const globalSetting = globalSettings[0] || { default_grace_days: 3 };

    // ===== 3. grace期間計算 =====
    const today = new Date();
    const graceStartDate = today.toISOString().split('T')[0];
    const graceDays = subscription.grace_days || globalSetting.default_grace_days || 3;
    const graceEndDate = new Date(today.getTime() + graceDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // ===== 4. 契約更新 =====
    await base44.asServiceRole.entities.UserSubscription.update(user_subscription_id, {
      status: 'grace',
      grace_start_date: graceStartDate,
      grace_end_date: graceEndDate,
    });

    subscription = await base44.asServiceRole.entities.UserSubscription.get(user_subscription_id);

    // ===== 5. 決済失敗記録 =====
    await base44.asServiceRole.entities.PaymentRecord.create({
      user_id: subscription.user_id,
      tenant_id: subscription.tenant_id,
      user_subscription_id,
      plan_code: subscription.current_plan_code,
      amount: payment_payload?.amount || 0,
      currency: 'JPY',
      payment_status: 'failed',
      failed_at: new Date().toISOString(),
      payment_provider: subscription.payment_provider,
      error_message,
      raw_payload: payment_payload,
    });

    // ===== 6. 履歴記録 =====
    await base44.asServiceRole.entities.SubscriptionHistory.create({
      user_subscription_id,
      user_id: subscription.user_id,
      action_type: 'payment_failed',
      before_status: 'active',
      after_status: 'grace',
      action_date: new Date().toISOString(),
      note: error_message,
      raw_payload: { subscription, payment_payload },
    });

    return Response.json({ subscription });

  } catch (error) {
    console.error('handlePaymentFailed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});