/**
 * migrateHomeToSiteBlocks
 * 旧ホテルテンプレートの Home 構成を SiteBlock に移植
 * 
 * 入力：site_id
 * 処理：
 * 1. HotelSettings から hero / contact 情報を取得
 * 2. Home.jsx のセクション構成を SiteBlock として投入
 * 3. 既存の home SitePage に紐付け
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { site_id } = await req.json();
    if (!site_id) {
      return Response.json({ error: 'site_id required' }, { status: 400 });
    }

    // 1. Site を取得
    const sites = await base44.asServiceRole.entities.Site.filter({ id: site_id });
    const site = sites[0];
    if (!site) {
      return Response.json({ error: 'Site not found' }, { status: 404 });
    }

    // 2. HotelSettings を取得（グローバルデータソース）
    const settingsList = await base44.asServiceRole.entities.HotelSettings.list();
    const settings = settingsList[0] || {};

    // 3. SalonContent を取得（セクション別のコンテンツ）
    let contentList = [];
    try {
      contentList = await base44.asServiceRole.entities.SalonContent.list();
    } catch {
      // SalonContent がない場合は HotelContent を試す
      contentList = await base44.asServiceRole.entities.HotelContent.list();
    }

    // 4. SitePage (home) を取得または作成
    const pages = await base44.asServiceRole.entities.SitePage.filter({
      site_id,
      page_type: 'home'
    });
    let homePage = pages[0];

    if (!homePage) {
      homePage = await base44.asServiceRole.entities.SitePage.create({
        site_id,
        title: 'HOME',
        slug: 'home',
        page_type: 'home',
        status: 'published',
        sort_order: 0
      });
    }

    // 5. 既存ブロックをクリア（空から始める）
    const existingBlocks = await base44.asServiceRole.entities.SiteBlock.filter({
      site_id,
      page_id: homePage.id
    });
    for (const block of existingBlocks) {
      await base44.asServiceRole.entities.SiteBlock.delete(block.id);
    }

    // 6. ブロックを投入
    const blocks = [];
    let sortOrder = 0;

    // Hero
    blocks.push({
      site_id,
      page_id: homePage.id,
      block_type: 'Hero',
      sort_order: sortOrder++,
      data: {
        headline: settings.hero_title || settings.hotel_name || 'Welcome',
        subheadline: settings.hero_subtitle || '',
        image_url: settings.hero_image_url || '',
        cta_text: settings.hero_button_text || '予約する',
        cta_url: '#contact',
        eyebrow: settings.hero_eyebrow || ''
      }
    });

    // About
    const aboutContent = contentList.find(c => c.section === 'about');
    if (aboutContent) {
      blocks.push({
        site_id,
        page_id: homePage.id,
        block_type: 'About',
        sort_order: sortOrder++,
        data: {
          title: aboutContent.title || 'About',
          body: aboutContent.content || aboutContent.description || '',
          image_url: aboutContent.image_url || '',
          tagline: settings.tagline || ''
        }
      });
    }

    // Menu (SalonContent の menu セクション)
    const menus = contentList.filter(c => c.section === 'menu').sort((a, b) => (a.order || 0) - (b.order || 0));
    if (menus.length > 0) {
      const menuItems = menus
        .map(m => `${m.title}|${m.price || ''}`)
        .join('\n');
      blocks.push({
        site_id,
        page_id: homePage.id,
        block_type: 'Menu',
        sort_order: sortOrder++,
        data: {
          title: 'メニュー',
          items: menuItems
        }
      });
    }

    // Staff
    const staff = contentList.filter(c => c.section === 'staff').sort((a, b) => (a.order || 0) - (b.order || 0));
    if (staff.length > 0) {
      const staffMembers = staff
        .map(s => `${s.staff_name || s.title}|${s.content || s.description || ''}`)
        .join('\n');
      blocks.push({
        site_id,
        page_id: homePage.id,
        block_type: 'Staff',
        sort_order: sortOrder++,
        data: {
          title: 'スタッフ',
          members: staffMembers
        }
      });
    }

    // Gallery
    const gallery = contentList.filter(c => c.section === 'gallery').sort((a, b) => (a.order || 0) - (b.order || 0));
    if (gallery.length > 0) {
      const imageUrls = gallery
        .filter(g => g.image_url)
        .map(g => g.image_url);
      blocks.push({
        site_id,
        page_id: homePage.id,
        block_type: 'Gallery',
        sort_order: sortOrder++,
        data: {
          title: 'ギャラリー',
          image_urls: imageUrls
        }
      });
    }

    // Voice (customer testimonials)
    const voices = contentList.filter(c => c.section === 'voice').sort((a, b) => (a.order || 0) - (b.order || 0));
    if (voices.length > 0) {
      const voicesData = voices
        .map(v => `${v.title || ''}|${v.content || v.description || ''}`)
        .join('\n');
      blocks.push({
        site_id,
        page_id: homePage.id,
        block_type: 'Voice',
        sort_order: sortOrder++,
        data: {
          title: 'お客様の声',
          voices: voicesData
        }
      });
    }

    // Campaign
    const campaigns = contentList.filter(c => c.section === 'campaign').sort((a, b) => (a.order || 0) - (b.order || 0));
    if (campaigns.length > 0) {
      blocks.push({
        site_id,
        page_id: homePage.id,
        block_type: 'Campaign',
        sort_order: sortOrder++,
        data: {
          title: campaigns[0].title || 'キャンペーン',
          body: campaigns[0].content || campaigns[0].description || '',
          cta_text: campaigns[0].cta_text || '詳しく見る',
          cta_url: campaigns[0].cta_url || '#'
        }
      });
    }

    // Contact
    blocks.push({
      site_id,
      page_id: homePage.id,
      block_type: 'Contact',
      sort_order: sortOrder++,
      data: {
        title: 'お問い合わせ',
        body: 'ご不明な点やご質問がございましたら、お気軽にお問い合わせください。',
        button_text: '送信する'
      }
    });

    // Access (footer info)
    blocks.push({
      site_id,
      page_id: homePage.id,
      block_type: 'Access',
      sort_order: sortOrder++,
      data: {
        title: 'アクセス',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        hours: settings.hours || '',
        map_embed_url: settings.map_embed_url || ''
      }
    });

    // ブロック一括作成
    for (const blockData of blocks) {
      await base44.asServiceRole.entities.SiteBlock.create(blockData);
    }

    return Response.json({
      success: true,
      message: 'Home blocks migrated',
      site_id,
      home_page_id: homePage.id,
      blocks_created: blocks.length,
      blocks_summary: blocks.map(b => ({ type: b.block_type, order: b.sort_order }))
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
});