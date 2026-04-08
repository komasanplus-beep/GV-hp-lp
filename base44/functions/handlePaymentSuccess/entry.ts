/**
 * handlePaymentSuccess
 * 決済成功時：契約更新・grace中なら active に戻す
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
    const { user_subscription_id, payment_payload } = body;

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

    // ===== 2. 次の課金期間計算 =====
    const rule = await base44.functions.invoke('getEffectiveBillingRule', {
      plan_code: subscription.current_plan_code,
      user_id: subscription.user_id,
    });

    const ruleData = rule.data;
    const today = new Date();
    let nextBillingDate, endDate;

    if (subscription.subscription_type === 'monthly') {
      const cycleDays = ruleData.billing_cycle_days;
      endDate = new Date(today.getTime() + cycleDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      nextBillingDate = endDate;
    } else if (subscription.subscription_type === 'yearly') {
      const accessDays = ruleData.yearly_access_days;
      endDate = new Date(today.getTime() + accessDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      nextBillingDate = endDate;
    }

    // ===== 3. 契約更新 =====
    const wasInGrace = subscription.status === 'grace';
    await base44.asServiceRole.entities.UserSubscription.update(user_subscription_id, {
      status: 'active',
      end_date: endDate,
      next_billing_date: nextBillingDate,
      grace_start_date: null,
      grace_end_date: null,
    });

    subscription = await base44.asServiceRole.entities.UserSubscription.get(user_subscription_id);

    // ===== 4. 決済記録 =====
    const plan = (await base44.asServiceRole.entities.BillingPlan.filter({
      code: subscription.current_plan_code,
    }))[0];

    await base44.asServiceRole.entities.PaymentRecord.create({
      user_id: subscription.user_id,
      tenant_id: subscription.tenant_id,
      user_subscription_id,
      plan_code: subscription.current_plan_code,
      amount: payment_payload?.amount || 0,
      currency: plan?.currency || 'JPY',
      payment_status: 'paid',
      billing_period_start: today.toISOString().split('T')[0],
      billing_period_end: endDate,
      paid_at: new Date().toISOString(),
      payment_provider: subscription.payment_provider,
      payment_provider_payment_id: payment_payload?.payment_id,
      raw_payload: payment_payload,
    });

    // ===== 5. 履歴記録 =====
    const actionType = wasInGrace ? 'resume' : 'renew';
    await base44.asServiceRole.entities.SubscriptionHistory.create({
      user_subscription_id,
      user_id: subscription.user_id,
      action_type: actionType,
      before_status: wasInGrace ? 'grace' : 'active',
      after_status: 'active',
      action_date: new Date().toISOString(),
      raw_payload: { subscription, payment_payload },
    });

    return Response.json({ subscription });

  } catch (error) {
    console.error('handlePaymentSuccess error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});