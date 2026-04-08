/**
 * activatePaidSubscription
 * 有料契約開始
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
    const {
      plan_code,
      campaign_code,
      subscription_type,
      payment_provider,
      payment_provider_customer_id,
      payment_provider_subscription_id,
      payment_payload,
      tenant_id,
    } = body;

    if (!plan_code || !subscription_type) {
      return Response.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // ===== 1. 実効ルール取得 =====
    const ruleRes = await base44.functions.invoke('getEffectiveBillingRule', {
      plan_code,
      user_id: user.id,
      campaign_code,
    });

    if (ruleRes.status !== 200) throw new Error('Failed to get billing rule');
    const rule = ruleRes.data;

    // ===== 2. 契約日付計算 =====
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];

    let endDate, nextBillingDate;
    if (subscription_type === 'monthly') {
      const cycleDays = rule.billing_cycle_days;
      endDate = new Date(today.getTime() + cycleDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      nextBillingDate = endDate;
    } else if (subscription_type === 'yearly') {
      const accessDays = rule.yearly_access_days;
      endDate = new Date(today.getTime() + accessDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      nextBillingDate = endDate;
    }

    // ===== 3. 既存契約の更新または作成 =====
    let subscription;
    let existingSubs = [];
    try {
      existingSubs = await base44.asServiceRole.entities.UserSubscription.filter({
        user_id: user.id,
      });
    } catch (_) {}

    if (existingSubs.length > 0) {
      subscription = existingSubs[0];
      await base44.asServiceRole.entities.UserSubscription.update(subscription.id, {
        current_plan_code: plan_code,
        subscription_type,
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        next_billing_date: nextBillingDate,
        trial_start_date: null,
        trial_end_date: null,
        grace_start_date: null,
        grace_end_date: null,
        campaign_id: rule.campaign_id,
        payment_provider: payment_provider || 'manual',
        payment_provider_customer_id,
        payment_provider_subscription_id,
        public_site_visible: true,
      });
      subscription = await base44.asServiceRole.entities.UserSubscription.get(subscription.id);
    } else {
      subscription = await base44.asServiceRole.entities.UserSubscription.create({
        user_id: user.id,
        tenant_id: tenant_id || '',
        current_plan_code: plan_code,
        subscription_type,
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        next_billing_date: nextBillingDate,
        campaign_id: rule.campaign_id,
        payment_provider: payment_provider || 'manual',
        payment_provider_customer_id,
        payment_provider_subscription_id,
        public_site_visible: true,
      });
    }

    // ===== 4. 決済記録 =====
    const plan = (await base44.asServiceRole.entities.BillingPlan.filter({ code: plan_code }))[0];
    if (payment_payload?.amount !== undefined) {
      await base44.asServiceRole.entities.PaymentRecord.create({
        user_id: user.id,
        tenant_id: tenant_id || '',
        user_subscription_id: subscription.id,
        plan_code,
        amount: payment_payload.amount,
        currency: plan?.currency || 'JPY',
        payment_status: 'paid',
        billing_period_start: startDate,
        billing_period_end: endDate,
        paid_at: new Date().toISOString(),
        payment_provider: payment_provider || 'manual',
        payment_provider_payment_id: payment_payload.payment_id,
        raw_payload: payment_payload,
      });
    }

    // ===== 5. 履歴記録 =====
    await base44.asServiceRole.entities.SubscriptionHistory.create({
      user_subscription_id: subscription.id,
      user_id: user.id,
      action_type: 'activate',
      after_status: 'active',
      after_plan_code: plan_code,
      action_date: new Date().toISOString(),
      raw_payload: { rule, subscription, payment_payload },
    });

    return Response.json({ subscription, rule });

  } catch (error) {
    console.error('activatePaidSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});