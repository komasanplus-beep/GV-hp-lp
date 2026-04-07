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
    Hero: {
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
    About: {
      title: `About ${config.name}`,
      body: `Discover what makes ${config.name} special. We offer premium ${config.service_label.toLowerCase()} and exceptional service.`,
      tagline: 'Excellence in every detail',
    },
    Service: {
      title: `Our ${config.service_plural}`,
      subtitle: `Browse our curated selection of ${config.service_plural.toLowerCase()}`,
    },
    Menu: {
      title: 'Our Menu',
      subtitle: 'Delicious offerings for every taste',
      items: 'Item 1 | ¥1,000\nItem 2 | ¥2,000\nItem 3 | ¥3,000',
    },
    Gallery: {
      title: 'Gallery',
      image_urls: [],
    },
    Staff: {
      title: 'Our Team',
      members: 'Team Member 1 | Specialist\nTeam Member 2 | Specialist\nTeam Member 3 | Specialist',
    },
    Contact: {
      title: 'Get in Touch',
      body: 'Have questions? We would love to hear from you.',
      button_text: 'Send Message',
    },
    Booking: {
      title: 'Make a Reservation',
      body: 'Reserve your spot today',
      button_text: 'Reserve Now',
    },
    Feature: {
      title: 'Why Choose Us?',
      features: 'Premium Quality\nExpert Service\nExceptional Value\nPersonalized Experience',
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
  const defaultBlockTypes = getDefaultLPBlocks(businessType);

  return defaultBlockTypes.map((blockType, index) => ({
    ...createDefaultBlock(blockType, businessType),
    sort_order: index,
  }));
}

/**
 * Hotel 用カスタマイズ
 */
export function getHotelBlocks() {
  return [
    { block_type: 'Hero', sort_order: 0 },
    { block_type: 'About', sort_order: 1 },
    { block_type: 'Service', sort_order: 2 },
    { block_type: 'Gallery', sort_order: 3 },
    { block_type: 'Feature', sort_order: 4 },
    { block_type: 'Contact', sort_order: 5 },
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