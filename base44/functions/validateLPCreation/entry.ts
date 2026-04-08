/**
 * validateLPCreation
 * LP作成時の制限チェック＆カウンター更新
 * - プラン制限確認
 * - 月度ユーザビリティカウンター更新
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json(); // 'check' | 'increment'

    // ユーザープラン取得
    const userPlans = await base44.entities.UserPlan.filter({ user_id: user.id });
    if (!userPlans || userPlans.length === 0) {
      return Response.json(
        { error: 'No plan found', canCreate: false },
        { status: 400 }
      );
    }

    const userPlan = userPlans[0];
    const plan = await base44.entities.Plan.filter({ id: userPlan.plan_id }).then(r => r[0]);
    if (!plan) {
      return Response.json(
        { error: 'Plan details not found', canCreate: false },
        { status: 400 }
      );
    }

    // 月度使用統計
    const currentMonth = new Date().toISOString().slice(0, 7);
    let usage = await base44.entities.PlanUsage.filter({
      user_id: user.id,
      month_year: currentMonth,
    }).then(r => r[0]);

    if (!usage && action === 'check') {
      // 初回の月は 0 から開始
      usage = {
        user_id: user.id,
        month_year: currentMonth,
        lp_count: 0,
        site_count: 0,
        ai_used: 0,
        storage_used: 0,
      };
    }

    // チェック
    if (action === 'check') {
      const canCreate = plan.max_lp === -1 || (usage.lp_count < plan.max_lp);
      return Response.json({
        canCreate,
        current: usage.lp_count,
        limit: plan.max_lp,
        planName: plan.name,
      });
    }

    // インクリメント
    if (action === 'increment') {
      const canCreate = plan.max_lp === -1 || (usage.lp_count < plan.max_lp);
      if (!canCreate) {
        return Response.json(
          { error: 'LP_LIMIT_EXCEEDED', canCreate: false },
          { status: 403 }
        );
      }

      // PlanUsage 新規作成 or 更新
      if (!usage.id) {
        const newUsage = await base44.entities.PlanUsage.create({
          user_id: user.id,
          month_year: currentMonth,
          lp_count: 1,
        });
        return Response.json({ success: true, updated: newUsage });
      } else {
        const updated = await base44.entities.PlanUsage.update(usage.id, {
          lp_count: (usage.lp_count || 0) + 1,
        });
        return Response.json({ success: true, updated });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});