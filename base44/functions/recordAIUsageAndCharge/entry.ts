/**
 * recordAIUsageAndCharge
 * AI使用ログを記録し、Stripe usage_record を送信（従量課金）
 *
 * 入力：
 * - feature_code
 * - site_id (optional)
 * - prompt_type (optional)
 *
 * 出力：
 * - status: 'logged' | 'charged' | 'capped'
 * - cost: 今月の課金額
 * - stripe_record_id: usage_record送信結果
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
    const { feature_code, site_id, prompt_type } = body;

    const user_id = user.id;
    const now = new Date();

    // ===== 1. AIUsageLog に記録 =====
    try {
      await base44.asServiceRole.entities.AIUsageLog.create({
        user_id,
        site_id: site_id || '',
        feature_code,
        prompt_type: prompt_type || '',
        status: 'success',
      });
    } catch (e) {
      console.warn('recordAIUsageAndCharge: failed to log usage', e.message);
    }

    // ===== 2. 月間使用回数・料金を再計算 =====
    const costRes = await base44.functions.invoke('calculateAIUsageCost', {
      user_id,
      feature_code,
    });

    if (costRes.status !== 200) {
      throw new Error('Failed to calculate cost');
    }

    const { used, total_cost, billing_status, plan_code } = costRes.data;

    // ===== 3. Stripe usage_record を送信（本番環境） =====
    let stripeRecordId = null;
    const stripeApiKey = Deno.env.get('STRIPE_API_KEY');

    if (stripeApiKey && total_cost > 0 && billing_status !== 'free') {
      // Subscription を取得
      let subscriptions = [];
      try {
        subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id });
      } catch (_) {}
      const subscription = subscriptions[0];

      if (subscription?.external_subscription_id) {
        try {
          // PriceId を feature_code から解決（例：ai_post_generation → price_xxx）
          const stripeRes = await fetch('https://api.stripe.com/v1/billing/meter_events', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeApiKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              'event_name': `ai_usage_${feature_code}`,
              'timestamp': Math.floor(now.getTime() / 1000),
              'customer': subscription.external_subscription_id,
              'value': '1',
            }).toString(),
          });

          if (stripeRes.ok) {
            const stripeData = await stripeRes.json();
            stripeRecordId = stripeData.id || 'recorded';
          }
        } catch (err) {
          console.warn('recordAIUsageAndCharge: Stripe meter event failed', err.message);
        }
      }
    }

    return Response.json({
      status: billing_status === 'capped' ? 'capped' : billing_status === 'payg' ? 'charged' : 'logged',
      used,
      cost: total_cost,
      billing_status,
      stripe_record_id: stripeRecordId,
      plan_code,
    });

  } catch (error) {
    console.error('recordAIUsageAndCharge error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});