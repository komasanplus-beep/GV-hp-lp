import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ALLOWED_OPERATIONS = new Set([
  'generate_lp',
  'analyze_free_text',
  'regenerate_block',
  'analyze_seo',
  'analyze_insights',
]);
const LP_REQUIRED = new Set(['regenerate_block', 'analyze_seo', 'analyze_insights']);
const MAX_PROMPT_LENGTH = 60000;
const MAX_SCHEMA_LENGTH = 12000;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const DEFAULT_PLAN = { name: 'FREE', plan_code: 'free', max_lp: 1, ai_limit: 10 };

function jsonError(message, code, status, requestId) {
  return Response.json({ success: false, error: message, code, request_id: requestId }, { status });
}

function safeMessage(error) {
  const message = String(error?.message || '');
  if (/limit|quota|上限/i.test(message)) return 'AI生成の利用上限に達しています。契約プランまたは利用状況をご確認ください。';
  if (/unauthor|auth|token|login/i.test(message)) return 'ログイン情報を確認できませんでした。再ログインしてお試しください。';
  if (/timeout|timed out/i.test(message)) return 'AI生成に時間がかかっています。少し待ってからもう一度お試しください。';
  return 'AI生成中にエラーが発生しました。時間をおいて再度お試しください。';
}

async function logUsage(base44, data) {
  try {
    await base44.asServiceRole.entities.AIUsageLog.create(data);
  } catch (logError) {
    console.warn('lpAiGateway usage log failed', { request_id: data.request_id, message: logError?.message });
  }
}

async function getPlanState(base44, userId) {
  const monthYear = new Date().toISOString().slice(0, 7);
  const userPlans = await base44.asServiceRole.entities.UserPlan.filter({ user_id: userId });
  const userPlan = userPlans?.find((item) => item.status === 'active' || item.status === 'trial') || userPlans?.[0];

  let plan = null;
  if (userPlan?.plan_id) {
    const plans = await base44.asServiceRole.entities.Plan.filter({ id: userPlan.plan_id });
    plan = plans?.[0] || null;
  }
  if (!plan) {
    const freePlans = await base44.asServiceRole.entities.Plan.filter({ plan_code: 'free' });
    plan = freePlans?.[0] || DEFAULT_PLAN;
  }

  const usages = await base44.asServiceRole.entities.PlanUsage.filter({
    user_id: userId,
    month_year: monthYear,
  });
  const usage = usages?.[0] || null;
  const ownedLps = await base44.asServiceRole.entities.LandingPage.filter({ user_id: userId });
  return {
    plan,
    usage,
    monthYear,
    aiUsed: Number(usage?.ai_used || 0),
    lpCount: Math.max(Number(usage?.lp_count || 0), ownedLps?.length || 0),
  };
}

function isLimitReached(used, limit) {
  const normalizedLimit = Number(limit);
  return normalizedLimit !== -1 && used >= Math.max(0, normalizedLimit);
}

async function incrementAIUsage(base44, userId, state) {
  const nextAIUsed = state.aiUsed + 1;
  if (state.usage?.id) {
    await base44.asServiceRole.entities.PlanUsage.update(state.usage.id, { ai_used: nextAIUsed });
  } else {
    await base44.asServiceRole.entities.PlanUsage.create({
      user_id: userId,
      month_year: state.monthYear,
      ai_used: nextAIUsed,
      lp_count: 0,
      site_count: 0,
      storage_used: 0,
    });
  }
  return nextAIUsed;
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  let base44 = null;
  let user = null;
  let operation = 'unknown';
  let siteId = '';

  if (req.method !== 'POST') return jsonError('この操作には対応していません。', 'METHOD_NOT_ALLOWED', 405, requestId);

  try {
    base44 = createClientFromRequest(req);
    user = await base44.auth.me();

    if (!user) return jsonError('ログインが必要です。', 'UNAUTHORIZED', 401, requestId);
    if (user.role !== 'admin') return jsonError('このAI機能を利用する権限がありません。', 'FORBIDDEN', 403, requestId);

    const body = await req.json();
    operation = String(body?.operation || '');
    const prompt = String(body?.prompt || '');
    const responseSchema = body?.response_json_schema;
    const lpId = body?.lp_id ? String(body.lp_id) : '';
    const blockId = body?.block_id ? String(body.block_id) : '';

    if (!ALLOWED_OPERATIONS.has(operation)) return jsonError('AI処理の種類が正しくありません。', 'INVALID_OPERATION', 400, requestId);
    if (!prompt.trim() || prompt.length > MAX_PROMPT_LENGTH) return jsonError('入力内容が空、または長すぎます。', 'INVALID_PROMPT', 400, requestId);
    if (!responseSchema || typeof responseSchema !== 'object') return jsonError('AI出力形式が正しくありません。', 'INVALID_SCHEMA', 400, requestId);
    if (JSON.stringify(responseSchema).length > MAX_SCHEMA_LENGTH) return jsonError('AI出力形式が大きすぎます。', 'INVALID_SCHEMA', 400, requestId);

    if (LP_REQUIRED.has(operation)) {
      if (!ID_PATTERN.test(lpId)) return jsonError('LP IDが正しくありません。', 'INVALID_LP_ID', 400, requestId);
      const lps = await base44.asServiceRole.entities.LandingPage.filter({ id: lpId });
      const lp = lps?.[0] || null;
      if (!lp) return jsonError('対象のLPが見つかりません。', 'LP_NOT_FOUND', 404, requestId);
      if (lp.user_id && lp.user_id !== user.id) return jsonError('このLPを操作する権限がありません。', 'LP_FORBIDDEN', 403, requestId);
      siteId = lp.site_id || '';

      if (operation === 'regenerate_block') {
        if (!ID_PATTERN.test(blockId)) return jsonError('ブロックIDが正しくありません。', 'INVALID_BLOCK_ID', 400, requestId);
        const blocks = await base44.asServiceRole.entities.LPBlock.filter({ id: blockId });
        const block = blocks?.[0] || null;
        if (!block || block.lp_id !== lpId) return jsonError('対象のLPブロックが見つかりません。', 'BLOCK_NOT_FOUND', 404, requestId);
      }
    }

    const planState = await getPlanState(base44, user.id);
    if (isLimitReached(planState.aiUsed, planState.plan.ai_limit)) {
      return jsonError('今月のAI生成回数の上限に達しています。', 'AI_LIMIT_REACHED', 403, requestId);
    }
    if (operation === 'generate_lp' && isLimitReached(planState.lpCount, planState.plan.max_lp)) {
      return jsonError('LP作成数の上限に達しています。既存LPまたは契約プランをご確認ください。', 'LP_LIMIT_REACHED', 403, requestId);
    }

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: body?.add_context_from_internet === true,
      response_json_schema: responseSchema,
    });
    const result = aiResponse?.data ?? aiResponse;
    const nextAIUsed = await incrementAIUsage(base44, user.id, planState);
    const aiLimit = Number(planState.plan.ai_limit);
    const remaining = aiLimit === -1 ? null : Math.max(0, aiLimit - nextAIUsed);

    await logUsage(base44, {
      user_id: user.id,
      site_id: siteId,
      feature_code: 'ai_lp_generation',
      prompt_type: operation,
      input_summary: prompt.slice(0, 500),
      output_summary: JSON.stringify(result).slice(0, 500),
      status: 'success',
      error_message: '',
    });

    return Response.json({ success: true, data: result, request_id: requestId, remaining });
  } catch (error) {
    console.error('lpAiGateway failed', {
      request_id: requestId,
      operation,
      user_id: user?.id || null,
      message: error?.message,
      stack: error?.stack,
    });

    if (base44 && user) {
      await logUsage(base44, {
        user_id: user.id,
        site_id: siteId,
        feature_code: 'ai_lp_generation',
        prompt_type: operation,
        input_summary: '',
        output_summary: '',
        status: 'error',
        error_message: `request_id=${requestId} ${String(error?.message || 'unknown').slice(0, 800)}`,
      });
    }
    return jsonError(safeMessage(error), 'AI_GENERATION_FAILED', 500, requestId);
  }
});

