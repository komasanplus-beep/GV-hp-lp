/**
 * generateCompleteSite.js
 * SiteTemplate エンティティ参照型サイト生成
 * - SiteTemplate.default_pages → SitePage 生成
 * - SiteTemplate.default_blocks → SiteBlock 生成（{{site_name}} 置換）
 * - SiteTemplate.initial_data.services → Service 生成
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/* global Deno */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { business_type, site_name } = body;

    if (!business_type || !site_name) {
      return Response.json(
        { error: 'business_type and site_name are required' },
        { status: 400 }
      );
    }

    // ===== 1. SiteTemplate を取得 =====
    // template_key = business_type で検索（例: "hotel", "salon"）
    const templates = await base44.asServiceRole.entities.SiteTemplate.filter({
      template_key: business_type,
      is_active: true,
    });
    const template = templates?.[0] || null;

    if (!template) {
      return Response.json(
        { error: `テンプレートが見つかりません: ${business_type}` },
        { status: 404 }
      );
    }

    // ===== 2. navigation_config を構築 =====
    // テンプレートの navigation_config があればそれを使い、site_name_text を上書き
    const baseNavConfig = template.navigation_config || getDefaultNavConfig(business_type);
    const navigation_config = {
      ...baseNavConfig,
      site_name_text: site_name,
    };

    // ===== 3. Site 作成 =====
    const site = await base44.entities.Site.create({
      user_id: user.id,
      site_name: site_name,
      business_type: business_type,
      status: 'published',
      enabled_features: template.enabled_features || {
        booking: true,
        blog: false,
        inquiry: true,
        customer: false,
      },
      navigation_config: navigation_config,
      footer_config: {
        copyright_text: `© ${new Date().getFullYear()} ${site_name}. All rights reserved.`,
        show_site_name: true,
        show_year: true,
      },
      seo_config: {
        meta_title: site_name,
        meta_description: `${site_name}のオフィシャルサイト`,
      },
    });

    // ===== 4. SitePage を default_pages から生成 =====
    const defaultPages = Array.isArray(template.default_pages) && template.default_pages.length > 0
      ? template.default_pages
      : [{ slug: 'home', title: 'HOME', page_type: 'home', sort_order: 0 }];

    // slug → page_id マップ（SiteBlock の page_id 割り当て用）
    const pageSlugToId = {};
    for (const pageDef of defaultPages) {
      const page = await base44.entities.SitePage.create({
        site_id: site.id,
        title: pageDef.title || 'HOME',
        slug: pageDef.slug || 'home',
        page_type: pageDef.page_type || 'home',
        status: 'published',
        sort_order: pageDef.sort_order ?? 0,
      });
      pageSlugToId[pageDef.slug] = page.id;
    }

    // home ページの ID（SiteBlock のデフォルト割り当て先）
    const homePageId = pageSlugToId['home'] || Object.values(pageSlugToId)[0];

    // ===== 5. SiteBlock を default_blocks から生成 =====
    const defaultBlocks = Array.isArray(template.default_blocks)
      ? [...template.default_blocks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      : [];

    const createdBlocks = [];
    for (const blockDef of defaultBlocks) {
      // {{site_name}} / {{siteName}} プレースホルダ置換
      const data = replaceSiteName(blockDef.data || {}, site_name);

      // page_slug が指定されていれば対応する page_id を使い、なければ home
      const pageId = blockDef.page_slug && pageSlugToId[blockDef.page_slug]
        ? pageSlugToId[blockDef.page_slug]
        : homePageId;

      const block = await base44.entities.SiteBlock.create({
        site_id: site.id,
        page_id: pageId,
        block_type: blockDef.block_type,
        sort_order: blockDef.sort_order ?? 0,
        data: data,
        animation_type: blockDef.animation_type || 'fade-up',
        animation_trigger: blockDef.animation_trigger || 'on-scroll',
        animation_delay: blockDef.animation_delay ?? 0,
        animation_duration: blockDef.animation_duration ?? 600,
        animation_once: blockDef.animation_once !== false,
      });
      createdBlocks.push(block);
    }

    // ===== 6. Service を initial_data.services から生成 =====
    const initialServices = Array.isArray(template.initial_data?.services)
      ? template.initial_data.services
      : [];

    const createdServices = [];
    for (const svcDef of initialServices) {
      const svc = await base44.entities.Service.create({
        ...svcDef,
        site_id: site.id,
      });
      createdServices.push(svc);
    }

    return Response.json({
      status: 'success',
      site_id: site.id,
      template_key: template.template_key,
      template_name: template.name,
      pages_created: Object.keys(pageSlugToId).length,
      blocks_created: createdBlocks.length,
      services_created: createdServices.length,
      site_name: site_name,
      business_type: business_type,
      preview_url: `/site/${site.id}?preview=true`,
    });
  } catch (error) {
    console.error('generateCompleteSite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * オブジェクト内の文字列値に含まれる {{site_name}} / {{siteName}} を置換
 * 再帰的に処理する
 */
function replaceSiteName(obj, siteName) {
  if (typeof obj === 'string') {
    return obj
      .replace(/\{\{site_name\}\}/g, siteName)
      .replace(/\{\{siteName\}\}/g, siteName);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replaceSiteName(item, siteName));
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceSiteName(value, siteName);
    }
    return result;
  }
  return obj;
}

/**
 * テンプレートに navigation_config がない場合のデフォルト
 * （フォールバック用 — テンプレートを整備すれば不要になる）
 */
function getDefaultNavConfig(businessType) {
  const configs = {
    hotel: {
      logo_url: null,
      booking_button_text: 'ご予約',
      booking_button_url: '#contact',
      menu_items: [
        { label: 'About', href: '#about', is_visible: true, sort_order: 0 },
        { label: 'Rooms', href: '#services', is_visible: true, sort_order: 1 },
        { label: 'Gallery', href: '#gallery', is_visible: true, sort_order: 2 },
        { label: 'Access', href: '#access', is_visible: true, sort_order: 3 },
        { label: 'Contact', href: '#contact', is_visible: true, sort_order: 4 },
      ],
    },
    salon: {
      logo_url: null,
      booking_button_text: 'ご予約',
      booking_button_url: '#contact',
      menu_items: [
        { label: 'About', href: '#about', is_visible: true, sort_order: 0 },
        { label: 'Menu', href: '#services', is_visible: true, sort_order: 1 },
        { label: 'Gallery', href: '#gallery', is_visible: true, sort_order: 2 },
        { label: 'Contact', href: '#contact', is_visible: true, sort_order: 3 },
      ],
    },
  };
  return configs[businessType] || configs.hotel;
}