/**
 * lpBlockGenerator.js
 * business_type に応じた LP（1ページ型）の初期ブロック構成を生成
 */

import { getUIConfig } from './uiConfig';

/**
 * business_type に応じたデフォルトブロック構成を取得
 */
export function getDefaultLPBlocks(businessType = 'other') {
  const config = getUIConfig(businessType);
  const defaultBlocks = config.default_blocks || [];

  return defaultBlocks;
}

/**
 * ブロックテンプレートを取得（初期データ付き）
 */
export function createDefaultBlock(blockType, businessType = 'other') {
  const config = getUIConfig(businessType);
  const blockId = getBlockId(blockType);

  const baseBlock = {
    block_type: blockType,
    sort_order: 0,
    animation_type: 'fade-up',
    animation_trigger: 'on-scroll',
    animation_duration: 600,
    animation_delay: 0,
    animation_once: true,
  };

  // ブロック種別ごとのデフォルトデータ
  const blockDataMap = {
    Hero: businessType === 'hotel' ? {
      hero_mode: 'slider',
      headline: 'Bawi Hotel',
      subheadline: 'Luxury Accommodation & Unforgettable Experiences',
      eyebrow: 'Welcome to',
      cta_text: 'Book Your Stay',
      cta_url: '#contact',
      image_urls: [
        'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
      ],
      image_opacity: 0.6,
      image_brightness: 100,
      overlay_type: 'gradient',
      gradient_from: '#00000080',
      gradient_to: '#000000CC',
      gradient_direction: 'to-bottom',
      text_align: 'center',
      text_color: '#ffffff',
      text_shadow: true,
      autoplay: true,
      slide_interval: 4000,
      transition_type: 'fade',
    } : {
      hero_mode: 'single',
      headline: `Welcome to ${config.name}`,
      subheadline: config.icon,
      eyebrow: 'Featured',
      cta_text: 'Get Started',
      cta_url: '#contact',
      image_opacity: 0.7,
      image_brightness: 100,
      overlay_type: 'color',
      overlay_color: '#000000',
      overlay_opacity: 0.3,
      text_align: 'center',
      text_color: '#ffffff',
      text_shadow: true,
    },
    About: businessType === 'hotel' ? {
      title: 'Experience Luxury & Comfort',
      body: 'At Bawi Hotel, we believe in providing more than just accommodation. Our thoughtfully designed rooms, world-class amenities, and attentive staff ensure every moment of your stay is extraordinary. Whether you\'re here for business or leisure, immerse yourself in the perfect blend of comfort and elegance.',
      tagline: 'Where Every Moment Becomes A Memory',
      image_url: 'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=600&h=400&fit=crop',
    } : {
      title: `About ${config.name}`,
      body: `Discover what makes ${config.name} special. We offer premium ${config.service_label.toLowerCase()} and exceptional service.`,
      tagline: 'Excellence in every detail',
    },
    Service: businessType === 'hotel' ? {
      title: 'Our Rooms',
      subtitle: 'Discover our collection of thoughtfully designed accommodations',
    } : {
      title: `Our ${config.service_plural}`,
      subtitle: `Browse our curated selection of ${config.service_plural.toLowerCase()}`,
    },
    Menu: {
      title: 'Our Menu',
      subtitle: 'Delicious offerings for every taste',
      items: 'Item 1 | ¥1,000\nItem 2 | ¥2,000\nItem 3 | ¥3,000',
    },
    Gallery: businessType === 'hotel' ? {
      title: 'Gallery',
      body: 'Explore the beauty and elegance of our hotel',
      image_urls: [
        'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1559023027-3bfb66c60b06?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1578683519653-38a9cfef5627?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=500&h=400&fit=crop',
      ],
    } : {
      title: 'Gallery',
      image_urls: [],
    },
    Staff: {
      title: 'Our Team',
      members: 'Team Member 1 | Specialist\nTeam Member 2 | Specialist\nTeam Member 3 | Specialist',
    },
    Contact: businessType === 'hotel' ? {
      title: 'Make Your Reservation',
      body: 'Ready to experience luxury? Book your stay with us today and create unforgettable memories.',
      button_text: 'Reserve Now',
    } : {
      title: 'Get in Touch',
      body: 'Have questions? We would love to hear from you.',
      button_text: 'Send Message',
    },
    Booking: {
      title: 'Make Your Reservation',
      body: 'Reserve your stay and experience our exceptional service',
      button_text: 'Reserve Now',
    },
    Feature: businessType === 'hotel' ? {
      title: 'Our Facilities & Amenities',
      features: 'Premium Bedding & Linens\nHigh-Speed WiFi\nFitness Center\nRestaurant & Lounge\n24-Hour Concierge\nValet Parking',
    } : {
      title: 'Why Choose Us?',
      features: 'Premium Quality\nExpert Service\nExceptional Value\nPersonalized Experience',
    },
    Access: businessType === 'hotel' ? {
      title: 'Location & Access',
      address: '東京都渋谷区道玄坂1-2-3 Bawi Hotel Building',
      phone: '03-XXXX-XXXX',
      hours: '24 Hours\nCheck-in: 15:00\nCheck-out: 11:00',
      map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.823521572327!2d139.7029!3d35.6595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188b5b5f5f5f5f%3A0x0!2sBawi%20Hotel!5e0!3m2!1sja!2sjp',
    } : {
      title: 'Access',
    },
    FAQ: {
      title: 'Frequently Asked Questions',
      faqs: 'What are your hours? | We are open daily\nDo you offer discounts? | Yes, for returning customers\nHow do I book? | Click the booking button above',
    },
    CTA: {
      title: 'Ready to Get Started?',
      body: 'Join us today and experience the difference',
      cta_text: 'Book Now',
      cta_url: '#contact',
      background_color: '#D97706',
    },
    Custom: {
      title: 'Custom Section',
      body: '<p>Add your custom content here</p>',
    },
  };

  const data = blockDataMap[blockType] || {};

  return {
    ...baseBlock,
    data,
  };
}

/**
 * ブロックタイプからセクションIDを取得
 */
export function getBlockId(blockType) {
  const idMap = {
    'Hero': 'hero',
    'About': 'about',
    'Service': 'services',
    'Menu': 'menu',
    'Gallery': 'gallery',
    'Staff': 'staff',
    'Contact': 'contact',
    'Booking': 'booking',
    'Voice': 'testimonials',
    'Feature': 'features',
    'FAQ': 'faq',
    'Access': 'access',
  };
  return idMap[blockType] || blockType.toLowerCase();
}

/**
 * 業種別の完全なLP初期ブロック構成を生成
 */
export function generateLPBlockStructure(businessType = 'other', pageName = 'home') {
  let blockTypes;
  
  // ホテルは特別にカスタマイズ
  if (businessType === 'hotel') {
    blockTypes = getHotelBlocks();
  } else {
    blockTypes = getDefaultLPBlocks(businessType);
  }

  return blockTypes.map((blockType, index) => ({
    ...createDefaultBlock(blockType, businessType),
    sort_order: index,
  }));
}

/**
 * Hotel 用カスタマイズ（1ページLP構造）
 */
export function getHotelBlocks() {
  return [
    'Hero',      // 0
    'About',     // 1
    'Service',   // 2 (Rooms)
    'Feature',   // 3 (Facilities)
    'Gallery',   // 4
    'Access',    // 5
    'Contact',   // 6 (Booking)
  ];
}

/**
 * Salon 用カスタマイズ
 */
export function getSalonBlocks() {
  return [
    { block_type: 'Hero', sort_order: 0 },
    { block_type: 'Service', sort_order: 1 },
    { block_type: 'Staff', sort_order: 2 },
    { block_type: 'Gallery', sort_order: 3 },
    { block_type: 'Voice', sort_order: 4 },
    { block_type: 'Contact', sort_order: 5 },
  ];
}

/**
 * Clinic 用カスタマイズ
 */
export function getClinicBlocks() {
  return [
    { block_type: 'Hero', sort_order: 0 },
    { block_type: 'About', sort_order: 1 },
    { block_type: 'Service', sort_order: 2 },
    { block_type: 'Staff', sort_order: 3 },
    { block_type: 'FAQ', sort_order: 4 },
    { block_type: 'Contact', sort_order: 5 },
  ];
}