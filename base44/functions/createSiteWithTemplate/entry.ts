import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { site_name, business_type, template, navigation_config } = body;

    if (!site_name?.trim()) {
      return Response.json({ error: 'site_name is required', code: 'MISSING_FIELD' }, { status: 400 });
    }

    // プラン上限チェック
    const existingSites = await base44.asServiceRole.entities.Site.filter({ user_id: user.id });
    const currentCount = existingSites.length;

    // UserSubscription からプランを取得
    const subs = await base44.asServiceRole.entities.UserSubscription.filter({ user_id: user.id }).catch(() => []);
    const planCode = subs[0]?.current_plan_code || 'free';

    // PlanMaster から上限取得
    const planMasters = await base44.asServiceRole.entities.PlanMaster.filter({ code: planCode }).catch(() => []);
    const siteLimit = planMasters[0]?.limits?.site_count ?? 1;

    if (siteLimit !== -1 && currentCount >= siteLimit) {
      return Response.json({
        error: `サイト作成上限（${siteLimit}件）に達しています。プランをアップグレードしてください。`,
        code: 'PLAN_LIMIT_EXCEEDED',
        current_count: currentCount,
        limit: siteLimit,
      }, { status: 403 });
    }

    // Site作成（サービスロール経由）
    const site = await base44.asServiceRole.entities.Site.create({
      site_name: site_name.trim(),
      business_type: business_type || 'other',
      user_id: user.id,
      status: 'draft',
      enabled_features: template?.enabled_features || { booking: false, blog: false, inquiry: true, customer: false },
      navigation_config: navigation_config || {},
    });

    // ページ作成
    const pageMap = {};
    for (const pageDef of (template?.default_pages || [])) {
      const page = await base44.asServiceRole.entities.SitePage.create({
        site_id: site.id,
        title: pageDef.title,
        slug: pageDef.slug,
        page_type: pageDef.page_type,
        sort_order: pageDef.sort_order ?? 0,
        status: 'draft',
      });
      pageMap[pageDef.slug] = page.id;
    }

    // ブロック作成
    for (const blockDef of (template?.default_blocks || [])) {
      const pageId = pageMap[blockDef.page_slug];
      if (!pageId) continue;
      await base44.asServiceRole.entities.SiteBlock.create({
        site_id: site.id,
        page_id: pageId,
        block_type: blockDef.block_type,
        sort_order: blockDef.sort_order ?? 0,
        data: blockDef.data || {},
        user_id: user.id,
        animation_type: blockDef.animation_type || 'fade-up',
        animation_trigger: blockDef.animation_trigger || 'on-scroll',
        animation_delay: blockDef.animation_delay ?? 0,
        animation_duration: blockDef.animation_duration ?? 600,
        animation_once: blockDef.animation_once ?? true,
      });
    }

    // 初期サービス
    const initialData = template?.initial_data || {};
    const features = template?.enabled_features || {};
    if (initialData.services?.length > 0) {
      for (const service of initialData.services) {
        await base44.asServiceRole.entities.Service.create({ ...service, site_id: site.id }).catch(() => {});
      }
    }

    // 初期ブログ
    if (features.blog && initialData.blog_posts?.length > 0) {
      for (const post of initialData.blog_posts) {
        await base44.asServiceRole.entities.Post.create({
          site_id: site.id, user_id: user.id, status: 'published', ...post,
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      site_id: site.id,
      site,
      message: `「${site.site_name}」を作成しました`,
    });

  } catch (error) {
    console.error('createSiteWithTemplate error:', error);
    return Response.json({ error: error.message, code: 'SERVER_ERROR' }, { status: 500 });
  }
});