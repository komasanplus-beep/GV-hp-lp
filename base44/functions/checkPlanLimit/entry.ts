/**
 * checkPlanLimit
 * プラン制限をサーバー側で検証
 * フロント側の制限を回避されないよう、必ずここで検証してからリソース作成を許可する
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource_type } = await req.json();

    // 現在のユーザープラン取得
    const userPlans = await base44.entities.UserPlan.filter({ user_id: user.id });
    if (!userPlans || userPlans.length === 0) {
      return Response.json({ error: 'No plan assigned', allowed: false }, { status: 400 });
    }

    const userPlan = userPlans[0];
    const planId = userPlan.plan_id;

    // プラン情報取得
    const plan = await base44.entities.Plan.filter({ id: planId }).then(r => r[0]);
    if (!plan) {
      return Response.json({ error: 'Plan not found', allowed: false }, { status: 400 });
    }

    // 月度利用統計取得
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await base44.entities.PlanUsage.filter({
      user_id: user.id,
      month_year: currentMonth,
    }).then(r => r[0]);

    const used = usage || {
      lp_count: 0,
      site_count: 0,
      ai_used: 0,
      storage_used: 0,
    };

    // リソースごとの制限チェック
    let allowed = false;
    let limit = 0;

    if (resource_type === 'lp') {
      allowed = plan.max_lp === -1 || (used.lp_count < plan.max_lp);
      limit = plan.max_lp;
    } else if (resource_type === 'site') {
      allowed = plan.max_sites === -1 || (used.site_count < plan.max_sites);
      limit = plan.max_sites;
    } else if (resource_type === 'ai') {
      allowed = plan.ai_limit === -1 || (used.ai_used < plan.ai_limit);
      limit = plan.ai_limit;
    }

    return Response.json({
      allowed,
      plan: {
        name: plan.name,
        code: plan.code,
        max_lp: plan.max_lp,
        max_sites: plan.max_sites,
        ai_limit: plan.ai_limit,
      },
      usage: {
        lp_count: used.lp_count,
        site_count: used.site_count,
        ai_used: used.ai_used,
      },
      limit,
    });
  } catch (error) {
    return Response.json({ error: error.message, allowed: false }, { status: 500 });
  }
});