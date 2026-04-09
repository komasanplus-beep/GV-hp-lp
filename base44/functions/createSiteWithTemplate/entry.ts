import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * createSiteWithTemplate
 * サイト・ページ・ブロックをすべてサービスロールで作成。
 * フロントから SitePage/SiteBlock を直接作成させない。
 * 失敗時はロールバック（作成済みサイトを削除）する。
 *
 * プラン体系: UserPlan → Plan (フロントの usePlan と同じ正規体系)
 */

// デフォルトテンプレート（サロン向け）
const DEFAULT_TEMPLATE = {
  enabled_features: { booking: false, blog: false, inquiry: true, customer: false },
  navigation_config: {},
  default_pages: [
    { title: 'ホーム',        slug: '/',        page_type: 'home',    sort_order: 0 },
    { title: 'メニュー',      slug: '/menu',    page_type: 'menu',    sort_order: 1 },
    { title: 'スタッフ',      slug: '/staff',   page_type: 'staff',   sort_order: 2 },
    { title: 'ギャラリー',    slug: '/gallery', page_type: 'gallery', sort_order: 3 },
    { title: 'アクセス',      slug: '/access',  page_type: 'access',  sort_order: 4 },
    { title: 'お問い合わせ',  slug: '/contact', page_type: 'contact', sort_order: 5 },
  ],
  default_blocks: [
    { page_slug: '/',        block_type: 'Hero',    sort_order: 0, data: { headline: 'サイト名を入力してください', subheadline: 'ようこそ', cta_text: 'お問い合わせ', cta_url: '#contact' } },
    { page_slug: '/',        block_type: 'About',   sort_order: 1, data: { title: 'サロンについて', body: 'こちらにサロンの説明を入力してください。' } },
    { page_slug: '/',        block_type: 'Service', sort_order: 2, data: { title: 'メニュー・サービス' } },
    { page_slug: '/',        block_type: 'Voice',   sort_order: 3, data: { title: 'お客様の声' } },
    { page_slug: '/',        block_type: 'FAQ',     sort_order: 4, data: { title: 'よくあるご質問' } },
    { page_slug: '/',        block_type: 'Contact', sort_order: 5, data: { title: 'お問い合わせ', button_text: '送信する' } },
    { page_slug: '/menu',    block_type: 'Service', sort_order: 0, data: { title: 'メニュー一覧' } },
    { page_slug: '/staff',   block_type: 'Staff',   sort_order: 0, data: { title: 'スタッフ紹介' } },
    { page_slug: '/gallery', block_type: 'Gallery', sort_order: 0, data: { title: 'ギャラリー' } },
    { page_slug: '/access',  block_type: 'Access',  sort_order: 0, data: { title: 'アクセス' } },
    { page_slug: '/contact', block_type: 'Contact', sort_order: 0, data: { title: 'お問い合わせ', button_text: '送信する' } },
  ],
  initial_data: { services: [] },
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST required' }, { status: 405 });
  }

  let createdSiteId = null;
  let currentStep = 'init';

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, step: 'auth', error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { site_name, business_type, template: templateInput, navigation_config } = body;

    if (!site_name?.trim()) {
      return Response.json({ success: false, step: 'validation', error: 'site_name is required', code: 'MISSING_FIELD' }, { status: 400 });
    }

    // --- プラン上限チェック (UserPlan → Plan 正規体系) ---
    currentStep = 'plan_check';
    console.log(`[createSiteWithTemplate] step=${currentStep} user=${user.id}`);

    const existingSites = await base44.asServiceRole.entities.Site.filter({ user_id: user.id }).catch(() => []);
    const currentCount = existingSites.length;

    // UserPlan → Plan の正規体系でプランを取得 (usePlan フックと同じ)
    let siteLimit = -1; // デフォルトは無制限（プランが取れない場合は通す）
    try {
      const userPlans = await base44.asServiceRole.entities.UserPlan.filter({ user_id: user.id });
      const userPlan = userPlans[0];
      if (userPlan?.plan_id) {
        const plans = await base44.asServiceRole.entities.Plan.filter({ id: userPlan.plan_id });
        const plan = plans[0];
        if (plan) {
          siteLimit = plan.max_sites ?? 1;
          console.log(`[createSiteWithTemplate] plan=${plan.name || plan.plan_code} max_sites=${siteLimit}`);
        }
      } else {
        // UserPlanがない = 未設定 → 制限なしで通す（管理者が直接使うケースを考慮）
        console.log('[createSiteWithTemplate] no UserPlan found, skipping site limit check');
        siteLimit = -1;
      }
    } catch (planErr) {
      console.warn('[createSiteWithTemplate] plan check failed, skipping:', planErr.message);
      siteLimit = -1;
    }

    if (siteLimit !== -1 && currentCount >= siteLimit) {
      return Response.json({
        success: false,
        step: 'plan_check',
        error: `サイト作成上限（${siteLimit}件）に達しています。プランをアップグレードしてください。`,
        code: 'PLAN_LIMIT_EXCEEDED',
        current_count: currentCount,
        limit: siteLimit,
      }, { status: 403 });
    }

    // --- テンプレート解決 ---
    currentStep = 'template_resolve';
    console.log(`[createSiteWithTemplate] step=${currentStep}`);

    // フロントから渡されたテンプレートがある場合はそれを使う。nullなら DB → デフォルトの順で解決。
    let template = templateInput;
    if (!template || !template.default_pages?.length) {
      try {
        const dbTemplates = await base44.asServiceRole.entities.SiteTemplate.filter({ is_active: true });
        if (dbTemplates.length > 0) {
          template = {
            enabled_features: dbTemplates[0].enabled_features || DEFAULT_TEMPLATE.enabled_features,
            navigation_config: dbTemplates[0].navigation_config || {},
            default_pages: dbTemplates[0].default_pages || DEFAULT_TEMPLATE.default_pages,
            default_blocks: dbTemplates[0].default_blocks || DEFAULT_TEMPLATE.default_blocks,
            initial_data: dbTemplates[0].initial_data || DEFAULT_TEMPLATE.initial_data,
          };
        } else {
          template = DEFAULT_TEMPLATE;
        }
      } catch (_e) {
        console.warn('[createSiteWithTemplate] SiteTemplate fetch failed, using default');
        template = DEFAULT_TEMPLATE;
      }
    }

    const defaultPages = template.default_pages || DEFAULT_TEMPLATE.default_pages;
    const defaultBlocks = template.default_blocks || DEFAULT_TEMPLATE.default_blocks;

    // --- Site 作成 ---
    currentStep = 'site_create';
    console.log(`[createSiteWithTemplate] step=${currentStep} site_name="${site_name}"`);

    const site = await base44.asServiceRole.entities.Site.create({
      site_name: site_name.trim(),
      business_type: business_type || 'other',
      user_id: user.id,
      status: 'draft',
      enabled_features: template.enabled_features || DEFAULT_TEMPLATE.enabled_features,
      navigation_config: navigation_config || template.navigation_config || {},
    });
    createdSiteId = site.id;
    console.log(`[createSiteWithTemplate] site created id=${site.id}`);

    // --- SitePage 作成（必ずサービスロール経由） ---
    currentStep = 'site_page_create';
    console.log(`[createSiteWithTemplate] step=${currentStep} pages=${defaultPages.length}`);

    const pageMap = {}; // slug → page.id
    for (const pageDef of defaultPages) {
      if (!pageDef.slug || !pageDef.title) {
        console.warn('[createSiteWithTemplate] skip invalid pageDef:', JSON.stringify(pageDef));
        continue;
      }
      const page = await base44.asServiceRole.entities.SitePage.create({
        site_id: site.id,
        title: pageDef.title,
        slug: pageDef.slug,
        page_type: pageDef.page_type || 'custom',
        sort_order: pageDef.sort_order ?? 0,
        status: 'draft',
      });
      pageMap[pageDef.slug] = page.id;
      console.log(`[createSiteWithTemplate] page created slug=${pageDef.slug} id=${page.id}`);
    }

    // --- SiteBlock 作成（必ずサービスロール経由） ---
    currentStep = 'site_block_create';
    console.log(`[createSiteWithTemplate] step=${currentStep} blocks=${defaultBlocks.length}`);

    for (const blockDef of defaultBlocks) {
      const pageId = pageMap[blockDef.page_slug];
      if (!pageId) {
        console.warn(`[createSiteWithTemplate] skip block - page not found for slug=${blockDef.page_slug}`);
        continue;
      }
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
    console.log(`[createSiteWithTemplate] blocks created`);

    // --- 初期サービスデータ ---
    currentStep = 'initial_data';
    const initialData = template.initial_data || {};
    if (initialData.services?.length > 0) {
      for (const service of initialData.services) {
        await base44.asServiceRole.entities.Service.create({ ...service, site_id: site.id }).catch(e => {
          console.warn('[createSiteWithTemplate] service create skipped:', e.message);
        });
      }
    }

    // --- 初期ブログデータ ---
    if (template.enabled_features?.blog && initialData.blog_posts?.length > 0) {
      for (const post of initialData.blog_posts) {
        await base44.asServiceRole.entities.Post.create({
          site_id: site.id, user_id: user.id, status: 'published', ...post,
        }).catch(e => {
          console.warn('[createSiteWithTemplate] post create skipped:', e.message);
        });
      }
    }

    const createdPages = defaultPages.map(p => ({ slug: p.slug, title: p.title }));
    console.log(`[createSiteWithTemplate] completed site_id=${site.id}`);

    // --- ログを保存 ---
    await base44.asServiceRole.entities.SiteCreationLog.create({
      user_id: user.id,
      site_id: site.id,
      site_name: site.site_name,
      business_type: site.business_type,
      result: 'success',
    }).catch(logErr => {
      console.warn('[createSiteWithTemplate] SiteCreationLog save failed:', logErr.message);
    });

    return Response.json({
      success: true,
      site_id: site.id,
      site,
      created_pages: createdPages,
      message: `「${site.site_name}」を作成しました`,
    });

  } catch (error) {
    console.error(`[createSiteWithTemplate] FAILED step=${currentStep}`, error.message, error.stack);

    // --- ロールバック: Siteだけ作成されてページがない中途半端な状態を防ぐ ---
    if (createdSiteId) {
      console.log(`[createSiteWithTemplate] rolling back site_id=${createdSiteId}`);
      try {
        const base44rb = createClientFromRequest(req);
        const pages = await base44rb.asServiceRole.entities.SitePage.filter({ site_id: createdSiteId }).catch(() => []);
        for (const p of pages) {
          const blocks = await base44rb.asServiceRole.entities.SiteBlock.filter({ page_id: p.id }).catch(() => []);
          for (const b of blocks) {
            await base44rb.asServiceRole.entities.SiteBlock.delete(b.id).catch(() => {});
          }
          await base44rb.asServiceRole.entities.SitePage.delete(p.id).catch(() => {});
        }
        await base44rb.asServiceRole.entities.Site.delete(createdSiteId).catch(() => {});
        console.log(`[createSiteWithTemplate] rollback completed`);
      } catch (rbErr) {
        console.error('[createSiteWithTemplate] rollback failed:', rbErr.message);
      }
    }

    // --- ログを保存（失敗） ---
    try {
      const base44log = createClientFromRequest(req);
      const user = await base44log.auth.me();
      if (user) {
        await base44log.asServiceRole.entities.SiteCreationLog.create({
          user_id: user.id,
          result: currentStep === 'plan_check' ? 'plan_limit' : currentStep === 'auth' ? 'permission_denied' : currentStep === 'validation' ? 'validation_error' : 'system_error',
          error_code: error.code || 'UNKNOWN',
          error_message: error.message,
          step: currentStep,
        }).catch(() => {});
      }
    } catch (logErr) {
      console.warn('[createSiteWithTemplate] error log save failed:', logErr.message);
    }

    return Response.json({
      success: false,
      step: currentStep,
      error: error.message,
      code: 'SERVER_ERROR',
    }, { status: 500 });
  }
});