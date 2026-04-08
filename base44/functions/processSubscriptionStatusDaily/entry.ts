/**
 * processSubscriptionStatusDaily
 * 日次バッチ：期限切れ判定・ステータス更新・通知対象抽出
 * 管理画面から手動実行、またはスケジュール実行想定
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { dry_run = false } = body;

    const today = new Date().toISOString().split('T')[0];
    const changes = [];

    // ===== 1. trialing 期限切れ処理 =====
    let trialingList = [];
    try {
      trialingList = await base44.asServiceRole.entities.UserSubscription.filter({
        status: 'trialing',
      });
    } catch (_) {}

    for (const sub of trialingList) {
      if (sub.trial_end_date && sub.trial_end_date < today) {
        if (!dry_run) {
          await base44.asServiceRole.entities.UserSubscription.update(sub.id, {
            status: 'expired',
          });

          await base44.asServiceRole.entities.SubscriptionHistory.create({
            user_subscription_id: sub.id,
            user_id: sub.user_id,
            action_type: 'trial_end',
            before_status: 'trialing',
            after_status: 'expired',
            action_date: new Date().toISOString(),
          });
        }

        changes.push({
          user_id: sub.user_id,
          subscription_id: sub.id,
          action: 'trial_expired',
          old_status: 'trialing',
          new_status: 'expired',
        });
      }
    }

    // ===== 2. grace 期限切れ処理 =====
    let graceList = [];
    try {
      graceList = await base44.asServiceRole.entities.UserSubscription.filter({
        status: 'grace',
      });
    } catch (_) {}

    for (const sub of graceList) {
      if (sub.grace_end_date && sub.grace_end_date < today) {
        if (!dry_run) {
          await base44.asServiceRole.entities.UserSubscription.update(sub.id, {
            status: 'suspended',
            suspended_at: new Date().toISOString(),
          });

          await base44.asServiceRole.entities.SubscriptionHistory.create({
            user_subscription_id: sub.id,
            user_id: sub.user_id,
            action_type: 'suspend',
            before_status: 'grace',
            after_status: 'suspended',
            action_date: new Date().toISOString(),
          });
        }

        changes.push({
          user_id: sub.user_id,
          subscription_id: sub.id,
          action: 'grace_expired_suspended',
          old_status: 'grace',
          new_status: 'suspended',
        });
      }
    }

    // ===== 3. active 期限切れ処理 =====
    let activeList = [];
    try {
      activeList = await base44.asServiceRole.entities.UserSubscription.filter({
        status: 'active',
      });
    } catch (_) {}

    for (const sub of activeList) {
      if (sub.end_date && sub.end_date < today) {
        if (!dry_run) {
          await base44.asServiceRole.entities.UserSubscription.update(sub.id, {
            status: 'expired',
          });

          await base44.asServiceRole.entities.SubscriptionHistory.create({
            user_subscription_id: sub.id,
            user_id: sub.user_id,
            action_type: 'expire',
            before_status: 'active',
            after_status: 'expired',
            action_date: new Date().toISOString(),
          });
        }

        changes.push({
          user_id: sub.user_id,
          subscription_id: sub.id,
          action: 'period_expired',
          old_status: 'active',
          new_status: 'expired',
        });
      }
    }

    return Response.json({
      dry_run,
      process_date: today,
      changes_count: changes.length,
      changes,
    });

  } catch (error) {
    console.error('processSubscriptionStatusDaily error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});