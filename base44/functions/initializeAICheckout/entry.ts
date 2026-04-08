/**
 * initializeAICheckout.js
 * AI追加・アップグレード時の Stripe Checkout URL 生成
 * 
 * invoke方法:
 * base44.functions.invoke('initializeAICheckout', {
 *   option_type: 'plan_upgrade' | 'ai_addon',
 *   addon_type: 'upgrade' | 'addon_50' | 'addon_100',
 *   current_plan: 'free' | 'starter' | 'business' ...
 * })
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
    const { option_type, addon_type, current_plan } = body;

    if (!option_type || !addon_type) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // ===== Stripe Price ID のマッピング =====
    const priceIdMap = {
      // プランアップグレード: free → starter
      'upgrade': 'price_starter_monthly', // 実際のStripe price_id に置き換え

      // AI追加パック
      'addon_50': 'price_ai_addon_50',      // ¥500 相当
      'addon_100': 'price_ai_addon_100',    // ¥900 相当
    };

    const priceId = priceIdMap[addon_type];
    if (!priceId) {
      return Response.json({ error: 'Invalid addon type' }, { status: 400 });
    }

    // ===== Stripe Checkout Session 作成（実装想定） =====
    // 注: 実際には Stripe API を直接呼ぶか、backend webhook を使用
    // ここでは簡略版：チェックアウトURL をシミュレート

    const checkoutUrl = `${Deno.env.get('APP_URL') || 'https://app.example.com'}/stripe-checkout?priceId=${priceId}&userId=${user.id}`;

    // ===== ログ記録 =====
    try {
      await base44.asServiceRole.entities.AIUsageLog.create({
        user_id: user.id,
        feature_code: option_type === 'plan_upgrade' ? 'plan_upgrade' : 'ai_addon',
        status: 'checkout_initiated',
        error_message: `${addon_type} checkout initiated`,
      });
    } catch (_) {}

    return Response.json({
      success: true,
      checkout_url: checkoutUrl,
      price_id: priceId,
      option_type,
      addon_type,
    });

  } catch (error) {
    console.error('initializeAICheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});