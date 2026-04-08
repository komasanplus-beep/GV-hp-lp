/**
 * generateCompleteSite.js
 * 業種選択から完成サイトを一括生成
 * - Site作成
 * - SitePage (home) 作成
 * - SiteBlock (7-8ブロック) 一括作成
 * - Service (初期データ3件) 一括作成
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/* global Deno */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { business_type, site_name } = body;

    // AI ガードチェック
    const guardRes = await base44.functions.invoke('aiGuard', {
      feature_code: 'ai_site_generation',
      site_id: null,
    });
    if (!guardRes.data?.allowed) {
      return Response.json(
        { error: guardRes.data?.reason || 'AI機能が無効です' },
        { status: 403 }
      );
    }

    if (!business_type || !site_name) {
      return Response.json(
        { error: 'business_type and site_name are required' },
        { status: 400 }
      );
    }

    // ===== 1. Site 作成 =====
    const site = await base44.entities.Site.create({
      user_id: user.id,
      site_name: site_name,
      business_type: business_type,
      status: 'published',
      enabled_features: {
        booking: true,
        blog: false,
        inquiry: true,
        customer: false,
      },
      navigation_config: getNavigationConfig(business_type, site_name),
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

    // ===== 2. SitePage (home) 作成 =====
    const page = await base44.entities.SitePage.create({
      site_id: site.id,
      title: 'HOME',
      slug: 'home',
      page_type: 'home',
      status: 'published',
      sort_order: 0,
    });

    // ===== 3. SiteBlock 一括作成 =====
    const blocks = generateBlocks(business_type, site.id, page.id, site_name);
    const createdBlocks = [];
    for (const block of blocks) {
      const blockData = {
        ...block,
        site_id: site.id,
      };
      const createdBlock = await base44.entities.SiteBlock.create(blockData);
      createdBlocks.push(createdBlock);
    }

    // ===== 4. Service 初期データ作成 =====
    const services = generateServices(business_type, site.id);
    const createdServices = [];
    for (const service of services) {
      const createdService = await base44.entities.Service.create(service);
      createdServices.push(createdService);
    }

    return Response.json({
      status: 'success',
      site_id: site.id,
      page_id: page.id,
      blocks_created: createdBlocks.length,
      services_created: createdServices.length,
      site_name: site_name,
      business_type: business_type,
      preview_url: `/site/${site.id}?preview=true`,
    });
  } catch (error) {
    console.error('generateCompleteSite error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

function getNavigationConfig(businessType, siteName) {
  const navConfigs = {
    hotel: {
      site_name_text: siteName || 'Hotel',
      logo_url: null,
      booking_button_text: 'ご予約',
      booking_button_url: '#contact',
      menu_items: [
        { label: 'About', href: '#about', is_visible: true, sort_order: 0 },
        { label: 'Rooms', href: '#services', is_visible: true, sort_order: 1 },
        { label: 'Facilities', href: '#facilities', is_visible: true, sort_order: 2 },
        { label: 'Gallery', href: '#gallery', is_visible: true, sort_order: 3 },
        { label: 'Access', href: '#access', is_visible: true, sort_order: 4 },
        { label: 'Contact', href: '#contact', is_visible: true, sort_order: 5 },
      ],
    },
    salon: {
      site_name_text: siteName || 'Hair Salon',
      logo_url: null,
      booking_button_text: 'ご予約',
      booking_button_url: '#contact',
      menu_items: [
        { label: 'About', href: '#about', is_visible: true, sort_order: 0 },
        { label: 'Menu', href: '#services', is_visible: true, sort_order: 1 },
        { label: 'Staff', href: '#staff', is_visible: true, sort_order: 2 },
        { label: 'Gallery', href: '#gallery', is_visible: true, sort_order: 3 },
        { label: 'Voice', href: '#testimonials', is_visible: true, sort_order: 4 },
        { label: 'FAQ', href: '#faq', is_visible: true, sort_order: 5 },
        { label: 'Contact', href: '#contact', is_visible: true, sort_order: 6 },
      ],
    },
  };

  return navConfigs[businessType] || navConfigs.hotel;
}

function generateBlocks(businessType, siteId, pageId, siteName) {
  if (businessType === 'hotel') {
    return [
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Hero',
        sort_order: 0,
        data: {
          hero_mode: 'slider',
          headline: siteName || 'Bawi Hotel',
          subheadline: 'Luxury Accommodation & Unforgettable Experiences',
          eyebrow: 'Welcome to',
          cta_text: 'Book Your Stay',
          cta_url: '#contact',
          image_urls: [
            'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=1200&h=800&fit=crop',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
          ],
          image_opacity: 0.6,
          overlay_type: 'gradient',
          gradient_from: '#00000080',
          gradient_to: '#000000CC',
          text_shadow: true,
          autoplay: true,
          slide_interval: 4000,
        },
        animation_type: 'none',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'About',
        sort_order: 1,
        data: {
          title: 'Experience Luxury & Comfort',
          body: 'At Bawi Hotel, we offer premium accommodation with exceptional service.',
          image_url: 'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=600&h=400&fit=crop',
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Service',
        sort_order: 2,
        data: {
          title: 'Our Rooms',
          subtitle: 'Elegantly designed rooms with modern amenities',
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Feature',
        sort_order: 3,
        data: {
          title: 'Facilities & Amenities',
          features: 'Premium Bedding\nHigh-Speed WiFi\nFitness Center\nRestaurant & Lounge\n24-Hour Concierge\nValet Parking',
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Gallery',
        sort_order: 4,
        data: {
          title: 'Gallery',
          image_urls: [
            'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=500&h=400&fit=crop',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=400&fit=crop',
            'https://images.unsplash.com/photo-1559023027-3bfb66c60b06?w=500&h=400&fit=crop',
            'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=500&h=400&fit=crop',
          ],
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Access',
        sort_order: 5,
        data: {
          title: 'Location & Access',
          address: 'Tokyo, Japan',
          phone: '03-XXXX-XXXX',
          hours: '24 Hours\nCheck-in: 15:00\nCheck-out: 11:00',
          map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.823521572327!2d139.7029!3d35.6595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1',
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Booking',
        sort_order: 6,
        data: {
          title: 'Make Your Reservation',
          body: 'Ready to experience luxury? Book your stay with us today.',
          button_text: 'Reserve Now',
        },
        animation_type: 'fade-up',
      },
    ];
  } else if (businessType === 'salon') {
    return [
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Hero',
        sort_order: 0,
        data: {
          hero_mode: 'slider',
          headline: siteName || 'Hair Salon Bawi',
          subheadline: 'あなたの理想のスタイルを実現する',
          eyebrow: 'Welcome to',
          cta_text: 'ご予約はこちら',
          cta_url: '#contact',
          image_urls: [
            'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=1200&h=800&fit=crop',
            'https://images.unsplash.com/photo-1596729936813-5b6d34e8e5d3?w=1200&h=800&fit=crop',
          ],
          image_opacity: 0.5,
          overlay_type: 'gradient',
          gradient_from: '#00000080',
          gradient_to: '#000000CC',
          text_shadow: true,
          autoplay: true,
          slide_interval: 4000,
        },
        animation_type: 'none',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'About',
        sort_order: 1,
        data: {
          title: '「美しく」「心地よく」を大切にしたサロン',
          body: 'Hair Salon Bawiでは、経験豊富なスタイリストがお客様一人ひとりに寄り添い、理想のスタイルを実現します。',
          image_url: 'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=600&h=400&fit=crop',
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Service',
        sort_order: 2,
        data: {
          title: 'メニュー',
          subtitle: '豊富なメニューから選べます',
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Staff',
        sort_order: 3,
        data: {
          title: 'スタイリスト',
          members: 'Yuki Tanaka|ヘッドスタイリスト\nHaruka Nakamura|カット＆パーマ専門\nMisaki Yamamoto|トリートメント・アシスタント',
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Gallery',
        sort_order: 4,
        data: {
          title: 'ギャラリー',
          image_urls: [
            'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=500&h=400&fit=crop',
            'https://images.unsplash.com/photo-1596729936813-5b6d34e8e5d3?w=500&h=400&fit=crop',
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=400&fit=crop',
            'https://images.unsplash.com/photo-1505664202109-b89fbc8ac1f1?w=500&h=400&fit=crop',
          ],
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Voice',
        sort_order: 5,
        data: {
          title: 'お客様の声',
          voices: 'Aさん|毎回、丁寧なカウンセリングで理想のスタイルにしてくれます。\nBさん|カラーで傷んだ髪を見事に蘇らせてくれました。\nCさん|居心地がいいサロンです。これからも通い続けます。',
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'FAQ',
        sort_order: 6,
        data: {
          title: 'よくあるご質問',
          faqs: 'はじめてですが大丈夫ですか？|もちろんです！詳しくカウンセリングさせていただきます。\n予約は必須ですか？|はい、完全予約制です。\nカットの時間はどのくらい？|通常60分程度です。',
        },
        animation_type: 'fade-up',
      },
      {
        page_id: pageId,
        site_id: siteId,
        block_type: 'Contact',
        sort_order: 7,
        data: {
          title: 'ご予約はこちら',
          body: 'スタイリストがお待ちしています。',
          button_text: '予約する',
        },
        animation_type: 'fade-up',
      },
    ];
  }

  return [];
}

function generateServices(businessType, siteId) {
  if (businessType === 'hotel') {
    return [
      {
        site_id: siteId,
        name: 'Single Room',
        description: 'Cozy room with premium bedding',
        price: 12000,
        duration: '1泊',
        capacity: 1,
        image_url: 'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=500&h=400&fit=crop',
        category: 'room',
        amenities: ['WiFi', 'Air Conditioning', 'Private Bath'],
        size: 25,
        bed_type: 'Single Bed',
        status: 'available',
        sort_order: 0,
      },
      {
        site_id: siteId,
        name: 'Twin Room',
        description: 'Spacious room with two single beds',
        price: 16000,
        duration: '1泊',
        capacity: 2,
        image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=400&fit=crop',
        category: 'room',
        amenities: ['WiFi', 'Air Conditioning', 'Flat-screen TV'],
        size: 35,
        bed_type: 'Twin Beds',
        status: 'available',
        sort_order: 1,
      },
      {
        site_id: siteId,
        name: 'Deluxe Suite',
        description: 'Luxurious suite with separate living area',
        price: 28000,
        duration: '1泊',
        capacity: 3,
        image_url: 'https://images.unsplash.com/photo-1559023027-3bfb66c60b06?w=500&h=400&fit=crop',
        category: 'room',
        amenities: ['WiFi', 'Marble Bath', 'Concierge'],
        size: 65,
        bed_type: 'King Bed + Sofabed',
        status: 'available',
        sort_order: 2,
      },
    ];
  } else if (businessType === 'salon') {
    return [
      {
        site_id: siteId,
        name: 'ヘアカット',
        description: 'プロのスタイリストによる似合わせカット',
        price: 5500,
        duration: '60分',
        capacity: 1,
        image_url: 'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=500&h=400&fit=crop',
        category: 'hair_cut',
        amenities: ['シャンプー込み', 'ドライセット'],
        status: 'available',
        sort_order: 0,
      },
      {
        site_id: siteId,
        name: 'カラーリング',
        description: '髪に優しい高級カラー剤を使用',
        price: 8800,
        duration: '90分',
        capacity: 1,
        image_url: 'https://images.unsplash.com/photo-1596729936813-5b6d34e8e5d3?w=500&h=400&fit=crop',
        category: 'hair_color',
        amenities: ['頭皮ケア', 'トリートメント'],
        status: 'available',
        sort_order: 1,
      },
      {
        site_id: siteId,
        name: 'パーマ',
        description: 'ダメージを最小限に抑えた高級パーマメニュー',
        price: 9900,
        duration: '120分',
        capacity: 1,
        image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=400&fit=crop',
        category: 'hair_perm',
        amenities: ['ヘッドマッサージ', 'トリートメント'],
        status: 'available',
        sort_order: 2,
      },
    ];
  }

  return [];
}