import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * initializePlanAndFeatures
 * 
 * システムの初期化用
 * - デフォルトプラン登録
 * - デフォルト機能マスター登録
 */
// deno-lint-ignore no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'master') {
      return Response.json(
        { error: 'Unauthorized - master role required' },
        { status: 403 }
      );
    }

    // ===== プランマスター初期データ =====
    const defaultPlans = [
      {
        code: 'free',
        name: 'Free',
        description: '基本機能のみ',
        monthly_price: 0,
        yearly_price: 0,
        status: 'active',
        sort_order: 0,
        included_features: [
          'site_builder',
          'page_management',
          'block_editor',
          'service_management',
          'booking_form',
          'inquiry_form',
          'gallery_management'
        ],
        limits: {
          site_count: 1,
          page_count: 5,
          lp_count: 0,
          ai_generation_count: 0
        },
        trial_days: 0
      },
      {
        code: 'starter',
        name: 'Starter',
        description: 'ブログと AI サポート付き',
        monthly_price: 4980,
        yearly_price: 49800,
        status: 'active',
        sort_order: 1,
        included_features: [
          'site_builder',
          'page_management',
          'block_editor',
          'service_management',
          'booking_form',
          'inquiry_form',
          'gallery_management',
          'blog_management',
          'template_initializer',
          'seo_settings',
          'ai_lp_generation'
        ],
        limits: {
          site_count: 3,
          page_count: 20,
          lp_count: 3,
          ai_generation_count: 20
        },
        trial_days: 14
      },
      {
        code: 'business',
        name: 'Business',
        description: 'CRM と詳細分析付き',
        monthly_price: 14980,
        yearly_price: 149800,
        status: 'active',
        sort_order: 2,
        included_features: [
          'site_builder',
          'page_management',
          'block_editor',
          'service_management',
          'booking_form',
          'inquiry_form',
          'gallery_management',
          'blog_management',
          'template_initializer',
          'seo_settings',
          'ai_lp_generation',
          'ai_site_generation',
          'crm_guest',
          'crm_reservation',
          'custom_domain',
          'analytics_dashboard'
        ],
        limits: {
          site_count: 10,
          page_count: 50,
          lp_count: 10,
          ai_generation_count: 100,
          guest_count: 500,
          reservation_count: 5000
        },
        trial_days: 14
      },
      {
        code: 'crm',
        name: 'CRM',
        description: '顧客管理と営業支援',
        monthly_price: 24980,
        yearly_price: 249800,
        status: 'active',
        sort_order: 3,
        included_features: [
          'site_builder',
          'page_management',
          'block_editor',
          'service_management',
          'booking_form',
          'inquiry_form',
          'gallery_management',
          'blog_management',
          'template_initializer',
          'seo_settings',
          'ai_lp_generation',
          'ai_site_generation',
          'crm_guest',
          'crm_reservation',
          'crm_sales',
          'crm_follow',
          'campaign_mail',
          'custom_domain',
          'analytics_dashboard'
        ],
        limits: {
          site_count: 20,
          page_count: 100,
          lp_count: 20,
          ai_generation_count: 200,
          guest_count: 2000,
          reservation_count: 20000,
          campaign_send_count: 10000
        },
        trial_days: 14
      },
      {
        code: 'enterprise',
        name: 'Enterprise',
        description: '完全版 + サポート',
        monthly_price: 49980,
        yearly_price: 499800,
        status: 'active',
        sort_order: 4,
        included_features: [
          'site_builder',
          'page_management',
          'block_editor',
          'service_management',
          'booking_form',
          'inquiry_form',
          'gallery_management',
          'blog_management',
          'template_initializer',
          'seo_settings',
          'ai_lp_generation',
          'ai_site_generation',
          'crm_guest',
          'crm_reservation',
          'crm_sales',
          'crm_follow',
          'campaign_mail',
          'line_integration',
          'custom_domain',
          'analytics_dashboard'
        ],
        limits: {
          site_count: -1, // 無制限
          page_count: -1,
          lp_count: -1,
          ai_generation_count: -1,
          guest_count: -1,
          reservation_count: -1,
          campaign_send_count: -1
        },
        trial_days: 30
      }
    ];

    // ===== 機能マスター初期データ =====
    const defaultFeatures = [
      // site_core
      { code: 'site_builder', name: 'サイトビルダー', category: 'site_core', default_enabled: true, requires_payment: false, ui_label: 'サイト作成', sort_order: 0 },
      { code: 'page_management', name: 'ページ管理', category: 'site_core', default_enabled: true, requires_payment: false, ui_label: 'ページ管理', sort_order: 1 },
      { code: 'block_editor', name: 'ブロックエディタ', category: 'site_core', default_enabled: true, requires_payment: false, ui_label: 'ブロック編集', sort_order: 2 },
      { code: 'service_management', name: 'サービス管理', category: 'site_core', default_enabled: true, requires_payment: false, ui_label: 'サービス管理', sort_order: 3 },
      { code: 'template_initializer', name: 'テンプレート初期化', category: 'site_core', default_enabled: false, requires_payment: false, ui_label: 'テンプレート', sort_order: 4 },

      // booking
      { code: 'booking_form', name: '予約フォーム', category: 'booking', default_enabled: true, requires_payment: false, ui_label: '予約機能', sort_order: 10 },
      { code: 'inquiry_form', name: 'お問い合わせ', category: 'booking', default_enabled: true, requires_payment: false, ui_label: 'お問い合わせ', sort_order: 11 },

      // content
      { code: 'gallery_management', name: 'ギャラリー', category: 'site_core', default_enabled: true, requires_payment: false, ui_label: 'ギャラリー', sort_order: 5 },
      { code: 'blog_management', name: 'ブログ', category: 'site_core', default_enabled: false, requires_payment: false, ui_label: 'ブログ管理', sort_order: 6 },

      // lp
      { code: 'lp_builder', name: 'LPビルダー', category: 'lp', default_enabled: false, requires_payment: false, ui_label: 'LP作成', sort_order: 20 },
      { code: 'ai_lp_generation', name: 'AI LP生成', category: 'lp', default_enabled: false, requires_payment: true, ui_label: 'AI LP生成', sort_order: 21 },

      // ai
      { code: 'ai_site_generation', name: 'AI サイト生成', category: 'ai', default_enabled: false, requires_payment: true, ui_label: 'AI サイト生成', sort_order: 30 },

      // crm
      { code: 'crm_guest', name: 'ゲスト管理', category: 'crm', default_enabled: false, requires_payment: true, ui_label: 'ゲスト管理', sort_order: 40 },
      { code: 'crm_reservation', name: '予約管理', category: 'crm', default_enabled: false, requires_payment: true, ui_label: '予約管理', sort_order: 41 },
      { code: 'crm_sales', name: '売上管理', category: 'crm', default_enabled: false, requires_payment: true, ui_label: '売上管理', sort_order: 42 },
      { code: 'crm_follow', name: 'フォロー管理', category: 'crm', default_enabled: false, requires_payment: true, ui_label: 'フォロー', sort_order: 43 },

      // campaign
      { code: 'campaign_mail', name: 'メール配信', category: 'campaign', default_enabled: false, requires_payment: true, ui_label: 'メール配信', sort_order: 50 },

      // integration
      { code: 'line_integration', name: 'LINE連携', category: 'integration', default_enabled: false, requires_payment: true, ui_label: 'LINE連携', sort_order: 60 },

      // seo / analytics
      { code: 'seo_settings', name: 'SEO設定', category: 'seo', default_enabled: false, requires_payment: false, ui_label: 'SEO設定', sort_order: 70 },
      { code: 'custom_domain', name: 'カスタムドメイン', category: 'domain', default_enabled: false, requires_payment: true, ui_label: 'カスタムドメイン', sort_order: 71 },
      { code: 'analytics_dashboard', name: 'アナリティクス', category: 'analytics', default_enabled: false, requires_payment: true, ui_label: 'アナリティクス', sort_order: 72 }
    ];

    let plansCreated = 0;
    let featuresCreated = 0;

    // プランを登録
    for (const plan of defaultPlans) {
      try {
        const existing = await base44.asServiceRole.entities.PlanMaster.filter({ code: plan.code });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.PlanMaster.create(plan);
          plansCreated++;
        }
      } catch (e) {
        console.warn(`Failed to create plan ${plan.code}:`, e.message);
      }
    }

    // 機能を登録
    for (const feature of defaultFeatures) {
      try {
        const existing = await base44.asServiceRole.entities.FeatureMaster.filter({ code: feature.code });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.FeatureMaster.create(feature);
          featuresCreated++;
        }
      } catch (e) {
        console.warn(`Failed to create feature ${feature.code}:`, e.message);
      }
    }

    return Response.json({
      status: 'initialized',
      plans_created: plansCreated,
      features_created: featuresCreated,
      total_plans: defaultPlans.length,
      total_features: defaultFeatures.length
    });
  } catch (error) {
    console.error('initializePlanAndFeatures error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});