import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TEMPLATE_PAGES = {
  salon: [
    { slug: 'index', title: 'トップ', type: 'home', show_in_header: true, show_in_footer: false },
    { slug: 'services', title: 'サービス', type: 'menu', show_in_header: true, show_in_footer: false },
    { slug: 'price', title: '料金', type: 'custom', show_in_header: true, show_in_footer: false },
    { slug: 'staff', title: 'スタッフ', type: 'staff', show_in_header: true, show_in_footer: false },
    { slug: 'voice', title: 'お客様の声', type: 'custom', show_in_header: true, show_in_footer: false },
    { slug: 'access', title: 'アクセス', type: 'access', show_in_header: true, show_in_footer: false },
    { slug: 'contact', title: 'お問い合わせ', type: 'contact', show_in_header: true, show_in_footer: false },
    { slug: 'privacy-policy', title: '個人情報保護方針', type: 'custom', category: 'privacy', is_system: true, show_in_footer: true },
    { slug: 'security-policy', title: '情報セキュリティ管理', type: 'custom', category: 'security', is_system: true, show_in_footer: true },
    { slug: 'compliance', title: 'コンプライアンス', type: 'custom', category: 'compliance', is_system: true, show_in_footer: true },
  ],
  hotel: [
    { slug: 'index', title: 'トップ', type: 'home', show_in_header: true, show_in_footer: false },
    { slug: 'rooms', title: '客室案内', type: 'custom', show_in_header: true, show_in_footer: false },
    { slug: 'facilities', title: '施設案内', type: 'custom', show_in_header: true, show_in_footer: false },
    { slug: 'plans', title: '宿泊プラン', type: 'custom', show_in_header: true, show_in_footer: false },
    { slug: 'news', title: 'お知らせ', type: 'custom', show_in_header: true, show_in_footer: false },
    { slug: 'access', title: 'アクセス', type: 'access', show_in_header: true, show_in_footer: false },
    { slug: 'contact', title: 'お問い合わせ', type: 'contact', show_in_header: true, show_in_footer: false },
    { slug: 'privacy-policy', title: '個人情報保護方針', type: 'custom', category: 'privacy', is_system: true, show_in_footer: true },
    { slug: 'security-policy', title: '情報セキュリティ管理', type: 'custom', category: 'security', is_system: true, show_in_footer: true },
    { slug: 'compliance', title: 'コンプライアンス', type: 'custom', category: 'compliance', is_system: true, show_in_footer: true },
  ],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { site_id, template_type } = await req.json();

    if (!site_id || !template_type || !TEMPLATE_PAGES[template_type]) {
      return Response.json({ error: 'Invalid template_type' }, { status: 400 });
    }

    const pages = TEMPLATE_PAGES[template_type];
    const createdPages = [];

    for (const pageData of pages) {
      const pageObj = {
        site_id,
        title: pageData.title,
        slug: pageData.slug,
        page_type: pageData.type,
        page_category: pageData.category || 'regular',
        is_system_page: pageData.is_system || false,
        show_in_header: pageData.show_in_header || false,
        show_in_footer: pageData.show_in_footer || false,
        status: 'published',
        sort_order: createdPages.length,
      };

      const created = await base44.entities.SitePage.create(pageObj);
      createdPages.push(created);
    }

    return Response.json({
      success: true,
      pages: createdPages,
    });
  } catch (error) {
    console.error('Create site with template error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});