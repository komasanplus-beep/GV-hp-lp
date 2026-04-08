/**
 * startTrialSubscription
 * 無料体験を開始
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
    const { plan_code, campaign_code, tenant_id } = body;

    if (!plan_code) {
      return Response.json({ error: 'plan_code is required' }, { status: 400 });
    }

    // ===== 1. 実効ルール取得 =====
    const ruleRes = await base44.functions.invoke('getEffectiveBillingRule', {
      plan_code,
      user_id: user.id,
      campaign_code,
    });

    if (ruleRes.status !== 200) {
      throw new Error('Failed to get billing rule');
    }

    const rule = ruleRes.data;

    // ===== 2. 既存契約チェック =====
    let existingSubs = [];
    try {
      existingSubs = await base44.asServiceRole.entities.UserSubscription.filter({
        user_id: user.id,
      });
    } catch (_) {}

    if (existingSubs.length > 0) {
      const existing = existingSubs[0];
      if (['trialing', 'active'].includes(existing.status)) {
        return Response.json(
          { error: 'Active subscription already exists' },
          { status: 409 }
        );
      }
    }

    // ===== 3. 無料体験開始日時計算 =====
    const today = new Date();
    const trialStartDate = today.toISOString().split('T')[0];
    const trialEndDate = new Date(today.getTime() + rule.trial_days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // ===== 4. 契約レコード作成 =====
    let subscription = await base44.asServiceRole.entities.UserSubscription.create({
      user_id: user.id,
      tenant_id: tenant_id || '',
      current_plan_code: plan_code,
      subscription_type: 'trial',
      status: 'trialing',
      trial_start_date: trialStartDate,
      trial_end_date: trialEndDate,
      campaign_id: rule.campaign_id,
      public_site_visible: true,
    });

    // ===== 5. 履歴記録 =====
    await base44.asServiceRole.entities.SubscriptionHistory.create({
      user_subscription_id: subscription.id,
      user_id: user.id,
      action_type: 'trial_start',
      after_status: 'trialing',
      after_plan_code: plan_code,
      action_date: new Date().toISOString(),
      raw_payload: { rule, subscription },
    });

    return Response.json({
      subscription,
      rule,
    });

  } catch (error) {
    console.error('startTrialSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});