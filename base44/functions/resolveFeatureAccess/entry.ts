import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * resolveFeatureAccess
 * 機能アクセス権判定エンジン
 * 優先順位：
 * 1. 課金停止による強制ブロック
 * 2. 個別 disable grant
 * 3. 個別 enable grant
 * 4. Site.enabled_features
 * 5. PlanMaster.included_features
 * 6. FeatureMaster.default_enabled
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { feature_code, user_id = user.id, site_id, tenant_id } = body;

    if (!feature_code) {
      return Response.json({ error: 'feature_code is required' }, { status: 400 });
    }

    // ===== 1. Subscription / 課金状態を取得 =====
    let subscriptions = [];
    try {
      subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id });
    } catch (_) { subscriptions = []; }
    const subscription = subscriptions[0] || null;

    // ===== 2. PlanMaster から plan 情報を取得 =====
    const plan_code = subscription?.plan_code || 'free';
    let plans = [];
    try {
      plans = await base44.asServiceRole.entities.PlanMaster.filter({ code: plan_code });
    } catch (_) { plans = []; }
    const plan = plans[0] || null;

    // ===== 3. FeatureMaster から feature 定義を取得 =====
    let featureDefs = [];
    try {
      featureDefs = await base44.asServiceRole.entities.FeatureMaster.filter({ code: feature_code });
    } catch (_) { featureDefs = []; }
    const feature = featureDefs[0] || null;

    // ===== 4. 課金状態による強制ブロック判定 =====
    const subscription_status = subscription?.status || 'none';
    let subscription_blocks = false;
    let block_reason = null;

    if (subscription_status === 'canceled' || subscription_status === 'expired') {
      subscription_blocks = true;
      block_reason = 'subscription_terminated';
    } else if (subscription_status === 'past_due') {
      const creation_features = [
        'site_builder', 'lp_builder', 'page_management', 'service_management',
        'booking_form', 'blog_management', 'crm_guest', 'customer_management',
        'sales_management', 'ai_package', 'campaign_mail'
      ];
      if (creation_features.includes(feature_code)) {
        subscription_blocks = true;
        block_reason = 'subscription_past_due';
      }
    } else if (subscription_status === 'paused') {
      const paused_blocked = [
        'site_builder', 'lp_builder', 'page_management', 'service_management',
        'booking_form', 'blog_management', 'crm_guest', 'customer_management',
        'sales_management', 'ai_package', 'campaign_mail', 'crm_follow', 'line_integration'
      ];
      if (paused_blocked.includes(feature_code)) {
        subscription_blocks = true;
        block_reason = 'subscription_paused';
      }
    }

    if (subscription_blocks) {
      return Response.json({
        allowed: false,
        source: 'subscription_block',
        reason: block_reason,
        subscription_status,
        feature_code
      });
    }

    // ===== 5. FeatureGrant による個別 disable =====
    let disableGrants = [];
    try {
      disableGrants = await base44.asServiceRole.entities.FeatureGrant.filter({
        feature_code, grant_type: 'disable', status: 'active'
      });
    } catch (_) { disableGrants = []; }

    for (const grant of disableGrants) {
      if (grant.end_at && new Date(grant.end_at) < new Date()) continue;
      if (
        (grant.target_type === 'user' && grant.target_id === user_id) ||
        (grant.target_type === 'site' && grant.target_id === site_id) ||
        (grant.target_type === 'tenant' && grant.target_id === tenant_id)
      ) {
        return Response.json({
          allowed: false, source: 'grant_disable',
          reason: grant.reason || 'disabled by admin',
          subscription_status, feature_code
        });
      }
    }

    // ===== 6. FeatureGrant による個別 enable =====
    let enableGrants = [];
    try {
      enableGrants = await base44.asServiceRole.entities.FeatureGrant.filter({
        feature_code, grant_type: 'enable', status: 'active'
      });
    } catch (_) { enableGrants = []; }

    for (const grant of enableGrants) {
      if (grant.end_at && new Date(grant.end_at) < new Date()) continue;
      if (
        (grant.target_type === 'user' && grant.target_id === user_id) ||
        (grant.target_type === 'site' && grant.target_id === site_id) ||
        (grant.target_type === 'tenant' && grant.target_id === tenant_id)
      ) {
        return Response.json({
          allowed: true, source: 'grant_enable',
          reason: grant.reason || 'enabled by admin',
          subscription_status, feature_code
        });
      }
    }

    // ===== 7. Site.enabled_features (legacy) =====
    if (site_id) {
      let sites = [];
      try {
        sites = await base44.asServiceRole.entities.Site.filter({ id: site_id });
      } catch (_) { sites = []; }
      if (sites.length > 0) {
        const siteFeatures = sites[0].enabled_features || {};
        const feature_to_site_key = {
          'booking_form': 'booking',
          'blog_management': 'blog',
          'crm_guest': 'customer',
          'customer_management': 'customer',
          'inquiry_form': 'inquiry'
        };
        const siteKey = feature_to_site_key[feature_code];
        if (siteKey && siteKey in siteFeatures) {
          return Response.json({
            allowed: siteFeatures[siteKey] === true,
            source: 'site_override',
            subscription_status, feature_code
          });
        }
      }
    }

    // ===== 8. PlanMaster.included_features =====
    if (plan && Array.isArray(plan.included_features)) {
      if (plan.included_features.includes(feature_code)) {
        return Response.json({
          allowed: true, source: 'plan',
          subscription_status, feature_code
        });
      }
    }

    // ===== 9. FeatureMaster.default_enabled =====
    if (feature && feature.default_enabled === true) {
      return Response.json({
        allowed: true, source: 'default',
        subscription_status, feature_code
      });
    }

    // ===== デフォルト: 不許可 =====
    return Response.json({
      allowed: false, source: 'default_deny',
      reason: `Feature ${feature_code} not included in ${plan_code} plan`,
      subscription_status, feature_code
    });

  } catch (error) {
    console.error('resolveFeatureAccess error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});