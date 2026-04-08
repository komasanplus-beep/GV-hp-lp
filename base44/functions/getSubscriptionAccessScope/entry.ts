/**
 * getSubscriptionAccessScope
 * 現在の契約状態に基づき使用可能機能を返す
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
    const { user_id = user.id } = body;

    // ===== 1. 契約取得 =====
    let subscriptions = [];
    try {
      subscriptions = await base44.asServiceRole.entities.UserSubscription.filter({
        user_id,
      });
    } catch (_) {}

    if (subscriptions.length === 0) {
      return Response.json({
        user_id,
        subscription_status: 'none',
        can_access_admin: false,
        can_edit_site: false,
        can_generate_ai: false,
        can_create_lp: false,
        can_manage_customer: false,
        can_manage_sales: false,
        can_manage_reservation: false,
        public_site_visible: false,
      });
    }

    const subscription = subscriptions[0];

    // ===== 2. プラン情報取得 =====
    let plans = [];
    try {
      plans = await base44.asServiceRole.entities.BillingPlan.filter({
        code: subscription.current_plan_code,
      });
    } catch (_) {}
    const plan = plans[0] || {};

    // ===== 3. アクセス権限計算 =====
    const isActive = ['trialing', 'active'].includes(subscription.status);
    const isGrace = subscription.status === 'grace';
    const isSuspended = subscription.status === 'suspended';

    const canAccessAdmin = isActive;
    const canEditSite = isActive || (isGrace && subscription.grace_end_date);
    const canGenerateAi = (isActive || isGrace) && plan.has_ai_feature;
    const canCreateLp = isActive;
    const canManageCustomer = isActive && plan.has_customer_management;
    const canManageSales = isActive && plan.has_sales_management;
    const canManageReservation = isActive && plan.has_reservation_management;

    // ===== 4. 公開サイト可視性 =====
    let publicSiteVisible = subscription.public_site_visible ?? true;
    if (isSuspended) {
      // グローバル設定チェック
      let globalSettings = [];
      try {
        globalSettings = await base44.asServiceRole.entities.BillingGlobalSetting.list();
      } catch (_) {}
      const globalSetting = globalSettings[0] || { suspend_public_site_on_unpaid: true };
      publicSiteVisible = !globalSetting.suspend_public_site_on_unpaid;
    }

    // ===== 5. 利用状況スナップショット =====
    const today = new Date().toISOString().split('T')[0];
    let snapshots = [];
    try {
      snapshots = await base44.asServiceRole.entities.SubscriptionUsageSnapshot.filter({
        user_id,
        snapshot_date: today,
      });
    } catch (_) {}

    const snapshot = snapshots[0] || {
      ai_article_used_count: 0,
      ai_article_limit_count: plan.ai_article_included_count || 0,
      lp_used_count: 0,
      lp_limit_count: plan.lp_limit || 5,
      site_used_count: 0,
      site_limit_count: plan.site_limit || 1,
    };

    // ===== 6. 残り日数計算 =====
    let remainingDays = null;
    if (subscription.status === 'trialing' && subscription.trial_end_date) {
      const endDate = new Date(subscription.trial_end_date);
      const now = new Date();
      remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else if (subscription.status === 'active' && subscription.end_date) {
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return Response.json({
      user_id,
      subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_plan_code: subscription.current_plan_code,
      can_access_admin: canAccessAdmin,
      can_edit_site: canEditSite,
      can_generate_ai: canGenerateAi,
      can_create_lp: canCreateLp,
      can_manage_customer: canManageCustomer,
      can_manage_sales: canManageSales,
      can_manage_reservation: canManageReservation,
      public_site_visible: publicSiteVisible,
      ai_article_limit_count: snapshot.ai_article_limit_count,
      ai_article_used_count: snapshot.ai_article_used_count,
      lp_limit_count: snapshot.lp_limit_count,
      lp_used_count: snapshot.lp_used_count,
      site_limit_count: snapshot.site_limit_count,
      site_used_count: snapshot.site_used_count,
      remaining_days: remainingDays,
      grace_end_date: subscription.grace_end_date,
      trial_end_date: subscription.trial_end_date,
      end_date: subscription.end_date,
    });

  } catch (error) {
    console.error('getSubscriptionAccessScope error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});