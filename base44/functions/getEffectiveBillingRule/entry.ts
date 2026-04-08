/**
 * getEffectiveBillingRule
 * 対象ユーザーに適用される実効ルールを返す
 * 優先順位: CampaignMaster → BillingPlan → BillingGlobalSetting
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
    const { plan_code, user_id, campaign_code } = body;

    if (!plan_code) {
      return Response.json({ error: 'plan_code is required' }, { status: 400 });
    }

    // ===== 1. グローバル設定取得 =====
    let globalSettings = [];
    try {
      globalSettings = await base44.asServiceRole.entities.BillingGlobalSetting.list();
    } catch (_) {}
    const globalSetting = globalSettings[0] || {
      default_monthly_cycle_days: 30,
      default_trial_days: 14,
      default_yearly_access_days: 365,
      default_grace_days: 3,
    };

    // ===== 2. プラン情報取得 =====
    let plans = [];
    try {
      plans = await base44.asServiceRole.entities.BillingPlan.filter({ code: plan_code });
    } catch (_) {}
    const plan = plans[0] || null;

    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    // ===== 3. キャンペーン取得 =====
    let campaign = null;
    if (campaign_code) {
      let campaigns = [];
      try {
        campaigns = await base44.asServiceRole.entities.CampaignMaster.filter({
          code: campaign_code,
          is_active: true,
        });
        if (campaigns.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          campaign = campaigns.find(c => c.start_date <= today && c.end_date >= today);
        }
      } catch (_) {}
    }

    // ===== 4. 実効値計算（優先順位: キャンペーン → プラン → グローバル） =====
    const result = {
      plan_code,
      trial_days: campaign?.special_trial_days ?? plan?.default_trial_days ?? globalSetting.default_trial_days,
      billing_cycle_days: plan?.default_billing_cycle_days ?? globalSetting.default_monthly_cycle_days,
      yearly_access_days: campaign?.special_access_days ?? plan?.default_access_days ?? globalSetting.default_yearly_access_days,
      grace_days: campaign?.special_grace_days ?? plan?.default_grace_days ?? globalSetting.default_grace_days,
      price: campaign?.special_monthly_price ?? plan?.price ?? 0,
      ai_article_included_count: campaign?.special_ai_article_included_count ?? plan?.ai_article_included_count ?? 0,
      lp_limit: campaign?.special_lp_limit ?? plan?.lp_limit ?? 5,
      site_limit: plan?.site_limit ?? 1,
      additional_ai_price: plan?.additional_ai_price ?? 0,
      campaign_applied: campaign ? true : false,
      campaign_id: campaign?.id || null,
      plan_features: {
        has_ai_feature: plan?.has_ai_feature ?? false,
        has_blog_ai_feature: plan?.has_blog_ai_feature ?? false,
        has_customer_management: plan?.has_customer_management ?? false,
        has_sales_management: plan?.has_sales_management ?? false,
        has_reservation_management: plan?.has_reservation_management ?? false,
      },
    };

    return Response.json(result);

  } catch (error) {
    console.error('getEffectiveBillingRule error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});