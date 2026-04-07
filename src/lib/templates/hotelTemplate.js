/**
 * ホテルサイト用テンプレート
 * Site 作成時に自動投入される初期データ
 */

export const hotelTemplate = {
  key: 'hotel',
  name: 'ホテル基本テンプレート',
  description: '完全装備のホテルサイトテンプレート',
  
  // Site 基本設定
  site_config: {
    site_name: 'マイホテル',
    business_type: 'hotel',
    enabled_features: {
      booking: true,
      blog: false,
      inquiry: true,
      customer: true,
    },
  },

  // フッター設定
  footer_config: {
    copyright_text: '© 2026 マイホテル. All rights reserved.',
    show_site_name: true,
    show_year: true,
    footer_links: [
      { label: 'プライバシーポリシー', href: '/privacy', sort_order: 0 },
      { label: '利用規約', href: '/terms', sort_order: 1 },
      { label: 'お問い合わせ', href: '#contact', sort_order: 2 },
    ],
  },

  // ナビゲーション設定
  navigation_config: {
    logo_url: 'https://images.unsplash.com/photo-1572193645878-05fe266ab6bb?w=200&h=60&fit=crop',
    site_name_text: 'マイホテル',
    booking_button_text: 'ご予約',
    booking_button_url: '#booking',
    show_admin_link: false,
    menu_items: [
      { label: 'Home', href: '#hero', sort_order: 0, is_visible: true },
      { label: 'About', href: '#about', sort_order: 1, is_visible: true },
      { label: 'Facilities', href: '#facilities', sort_order: 2, is_visible: true },
      { label: 'Rooms', href: '#rooms', sort_order: 3, is_visible: true },
      { label: 'Gallery', href: '#gallery', sort_order: 4, is_visible: true },
      { label: 'Contact', href: '#contact', sort_order: 5, is_visible: true },
    ],
  },

  // ページ一覧
  pages: [
    {
      title: 'HOME',
      slug: 'home',
      page_type: 'home',
      status: 'published',
      sort_order: 0,
    },
  ],

  // ブロック一覧
  blocks: [
    // Hero Block
    {
      page_slug: 'home',
      block_type: 'Hero',
      sort_order: 0,
      data: {
        eyebrow: 'Welcome to',
        headline: 'マイホテル',
        subheadline: '上質な滞在体験をお約束します',
        image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop',
        cta_text: 'ご予約する',
        cta_url: '#booking',
      },
      animation_type: 'fade-up',
      animation_trigger: 'on-load',
      animation_delay: 0,
      animation_duration: 600,
      animation_once: true,
    },

    // About Block
    {
      page_slug: 'home',
      block_type: 'About',
      sort_order: 1,
      data: {
        title: 'About Our Hotel',
        body: '当ホテルは、最高のおもてなしと快適さをお客様に提供することを約束しています。質の高い客室、充実した施設、そして心からのサービスで、皆様の滞在をより良いものにします。',
        image_url: 'https://images.unsplash.com/photo-1564501049-61e23ffd3e22?w=600&h=500&fit=crop',
        tagline: '創業以来、おもてなしの心を大切にしています',
      },
      animation_type: 'fade-up',
      animation_trigger: 'on-scroll',
      animation_delay: 100,
      animation_duration: 600,
      animation_once: true,
    },

    // Facilities Block
    {
      page_slug: 'home',
      block_type: 'Feature',
      sort_order: 2,
      data: {
        title: '設備・サービス',
        features: '24時間フロント\n大浴場\nレストラン\nフィットネスセンター\n無料Wi-Fi\nビジネスセンター',
      },
      animation_type: 'fade-up',
      animation_trigger: 'on-scroll',
      animation_delay: 150,
      animation_duration: 600,
      animation_once: true,
    },

    // Service Block (Rooms)
    {
      page_slug: 'home',
      block_type: 'Service',
      sort_order: 3,
      data: {
        title: 'お部屋の種類',
        subtitle: '快適さとスタイルを兼ね備えた客室',
        layout_type: 'grid',
        show_price: true,
        show_duration: true,
      },
      animation_type: 'fade-up',
      animation_trigger: 'on-scroll',
      animation_delay: 200,
      animation_duration: 600,
      animation_once: true,
    },

    // Gallery Block
    {
      page_slug: 'home',
      block_type: 'Gallery',
      sort_order: 4,
      data: {
        title: 'フォトギャラリー',
        image_urls: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
          'https://images.unsplash.com/photo-1578683078519-d0e15b9fdf00?w=600&h=400&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
          'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=600&h=400&fit=crop',
          'https://images.unsplash.com/photo-1564501049-61e23ffd3e22?w=600&h=400&fit=crop',
          'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop',
        ],
      },
      animation_type: 'fade-up',
      animation_trigger: 'on-scroll',
      animation_delay: 250,
      animation_duration: 600,
      animation_once: true,
    },

    // Voice Block
    {
      page_slug: 'home',
      block_type: 'Voice',
      sort_order: 5,
      data: {
        title: 'ゲストからのご感想',
        voices: 'Aさん 30代|とても快適でした。スタッフの対応も素晴らしかったです\nBさん 40代|素敵な滞在をありがとうございました。また来たいです\nCさん 50代|施設も新しく、食事も美味しく、大満足です',
      },
      animation_type: 'fade-up',
      animation_trigger: 'on-scroll',
      animation_delay: 300,
      animation_duration: 600,
      animation_once: true,
    },

    // Contact Block
    {
      page_slug: 'home',
      block_type: 'Contact',
      sort_order: 6,
      data: {
        title: 'お問い合わせ',
        body: 'ご不明な点がございましたら、お気軽にお問い合わせください',
        email: 'info@myhotel.jp',
        phone: '03-xxxx-xxxx',
        booking_url: '#booking',
      },
      animation_type: 'fade-up',
      animation_trigger: 'on-scroll',
      animation_delay: 350,
      animation_duration: 600,
      animation_once: true,
    },

    // Booking Block
    {
      page_slug: 'home',
      block_type: 'Booking',
      sort_order: 7,
      data: {
        title: 'ご予約',
        body: 'お好みの日時をお選びください',
        button_text: 'ご予約する',
      },
      animation_type: 'fade-up',
      animation_trigger: 'on-scroll',
      animation_delay: 400,
      animation_duration: 600,
      animation_once: true,
    },
  ],

  // サービス・客室一覧
  services: [
    {
      name: 'シングルルーム',
      description: '1名様向けの快適な客室',
      price: 8000,
      duration: '1泊',
      image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
      status: 'available',
      sort_order: 0,
    },
    {
      name: 'ツインルーム',
      description: '2名様向けの広々とした客室',
      price: 12000,
      duration: '1泊',
      image_url: 'https://images.unsplash.com/photo-1578683078519-d0e15b9fdf00?w=600&h=400&fit=crop',
      status: 'available',
      sort_order: 1,
    },
    {
      name: 'ダブルルーム',
      description: 'カップル向けのロマンティックな客室',
      price: 15000,
      duration: '1泊',
      image_url: 'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=600&h=400&fit=crop',
      status: 'available',
      sort_order: 2,
    },
    {
      name: 'スイートルーム',
      description: '最高級の滞在体験を提供するスイートルーム',
      price: 25000,
      duration: '1泊',
      image_url: 'https://images.unsplash.com/photo-1564501049-61e23ffd3e22?w=600&h=400&fit=crop',
      status: 'available',
      sort_order: 3,
    },
  ],
};