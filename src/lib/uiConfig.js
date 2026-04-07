/**
 * uiConfig.js
 * 業種別UI設定の一元管理
 * business_type に応じて、ラベル・レイアウト・スタイル・アニメーションを切り替え
 */

export const UI_CONFIGS = {
  hotel: {
    name: 'ホテル',
    icon: '🏨',
    service_label: '客室',
    service_plural: '全客室',
    price_label: '宿泊料金',
    duration_label: '宿泊期間',
    capacity_label: '定員',
    layout: {
      service_grid: 'lg:grid-cols-3',
      service_card_height: 'h-80',
      service_image_height: 'h-40',
      gallery_columns: 'grid-cols-3',
      hero_height: 'min-h-screen',
    },
    style: {
      accent_color: 'amber-600',
      bg_light: 'bg-amber-50',
      border_color: 'border-amber-200',
      font_serif: true,
      luxury_design: true,
    },
    nav_items: ['Rooms', 'Facilities', 'Gallery', 'Contact'],
    animation_preset: 'luxury',
    default_blocks: ['Hero', 'About', 'Rooms', 'Facilities', 'Gallery', 'Contact'],
  },

  salon: {
    name: 'サロン',
    icon: '💇',
    service_label: 'メニュー',
    service_plural: '全メニュー',
    price_label: '施術料金',
    duration_label: '所要時間',
    capacity_label: '対応人数',
    layout: {
      service_grid: 'md:grid-cols-2 lg:grid-cols-2',
      service_card_height: 'h-48',
      service_image_height: 'h-32',
      gallery_columns: 'grid-cols-2 md:grid-cols-4',
      hero_height: 'min-h-80',
    },
    style: {
      accent_color: 'rose-500',
      bg_light: 'bg-rose-50',
      border_color: 'border-rose-200',
      font_serif: false,
      luxury_design: false,
    },
    nav_items: ['Menu', 'Staff', 'Gallery', 'Contact'],
    animation_preset: 'light',
    default_blocks: ['Hero', 'Menu', 'Staff', 'Gallery', 'Contact'],
  },

  clinic: {
    name: 'クリニック',
    icon: '🏥',
    service_label: '診療科目',
    service_plural: '全診療科目',
    price_label: '診療料金',
    duration_label: '診療時間',
    capacity_label: '対応人数',
    layout: {
      service_grid: 'md:grid-cols-2 lg:grid-cols-3',
      service_card_height: 'h-56',
      service_image_height: 'h-32',
      gallery_columns: 'grid-cols-2 md:grid-cols-3',
      hero_height: 'min-h-96',
    },
    style: {
      accent_color: 'blue-600',
      bg_light: 'bg-blue-50',
      border_color: 'border-blue-200',
      font_serif: false,
      luxury_design: false,
    },
    nav_items: ['Services', 'Staff', 'Access', 'Contact'],
    animation_preset: 'professional',
    default_blocks: ['Hero', 'About', 'Services', 'Staff', 'Access', 'Contact'],
  },

  gym: {
    name: 'ジム',
    icon: '💪',
    service_label: 'コース',
    service_plural: '全コース',
    price_label: 'コース料金',
    duration_label: '所要時間',
    capacity_label: '定員',
    layout: {
      service_grid: 'md:grid-cols-2 lg:grid-cols-3',
      service_card_height: 'h-64',
      service_image_height: 'h-40',
      gallery_columns: 'grid-cols-2 md:grid-cols-3',
      hero_height: 'min-h-screen',
    },
    style: {
      accent_color: 'orange-600',
      bg_light: 'bg-orange-50',
      border_color: 'border-orange-200',
      font_serif: false,
      luxury_design: false,
    },
    nav_items: ['Courses', 'Classes', 'Facilities', 'Contact'],
    animation_preset: 'dynamic',
    default_blocks: ['Hero', 'Courses', 'Classes', 'Gallery', 'Contact'],
  },

  school: {
    name: 'スクール',
    icon: '🎓',
    service_label: 'レッスン',
    service_plural: '全レッスン',
    price_label: 'レッスン料金',
    duration_label: '所要時間',
    capacity_label: '定員',
    layout: {
      service_grid: 'md:grid-cols-2 lg:grid-cols-3',
      service_card_height: 'h-56',
      service_image_height: 'h-32',
      gallery_columns: 'grid-cols-2 md:grid-cols-4',
      hero_height: 'min-h-96',
    },
    style: {
      accent_color: 'indigo-600',
      bg_light: 'bg-indigo-50',
      border_color: 'border-indigo-200',
      font_serif: false,
      luxury_design: false,
    },
    nav_items: ['Lessons', 'Teachers', 'Gallery', 'Contact'],
    animation_preset: 'light',
    default_blocks: ['Hero', 'About', 'Lessons', 'Teachers', 'Gallery', 'Contact'],
  },

  restaurant: {
    name: 'レストラン',
    icon: '🍽️',
    service_label: 'メニュー',
    service_plural: '全メニュー',
    price_label: '料金',
    duration_label: '提供時間',
    capacity_label: '人数',
    layout: {
      service_grid: 'md:grid-cols-2 lg:grid-cols-3',
      service_card_height: 'h-64',
      service_image_height: 'h-40',
      gallery_columns: 'grid-cols-2 md:grid-cols-3',
      hero_height: 'min-h-screen',
    },
    style: {
      accent_color: 'red-600',
      bg_light: 'bg-red-50',
      border_color: 'border-red-200',
      font_serif: true,
      luxury_design: true,
    },
    nav_items: ['Menu', 'Gallery', 'Reservations', 'Contact'],
    animation_preset: 'luxury',
    default_blocks: ['Hero', 'Menu', 'Gallery', 'Reservations', 'Contact'],
  },

  beauty: {
    name: 'ビューティー',
    icon: '💄',
    service_label: '施術',
    service_plural: '全施術',
    price_label: '施術料金',
    duration_label: '所要時間',
    capacity_label: '対応人数',
    layout: {
      service_grid: 'md:grid-cols-2 lg:grid-cols-3',
      service_card_height: 'h-56',
      service_image_height: 'h-36',
      gallery_columns: 'grid-cols-2 md:grid-cols-4',
      hero_height: 'min-h-96',
    },
    style: {
      accent_color: 'pink-600',
      bg_light: 'bg-pink-50',
      border_color: 'border-pink-200',
      font_serif: false,
      luxury_design: false,
    },
    nav_items: ['Services', 'Gallery', 'Staff', 'Contact'],
    animation_preset: 'light',
    default_blocks: ['Hero', 'Services', 'Gallery', 'Staff', 'Contact'],
  },

  wellness: {
    name: 'ウェルネス',
    icon: '🧘',
    service_label: 'プログラム',
    service_plural: '全プログラム',
    price_label: 'プログラム料金',
    duration_label: '所要時間',
    capacity_label: '定員',
    layout: {
      service_grid: 'md:grid-cols-2 lg:grid-cols-3',
      service_card_height: 'h-56',
      service_image_height: 'h-36',
      gallery_columns: 'grid-cols-2 md:grid-cols-3',
      hero_height: 'min-h-screen',
    },
    style: {
      accent_color: 'teal-600',
      bg_light: 'bg-teal-50',
      border_color: 'border-teal-200',
      font_serif: false,
      luxury_design: false,
    },
    nav_items: ['Programs', 'Classes', 'Instructors', 'Contact'],
    animation_preset: 'calm',
    default_blocks: ['Hero', 'Programs', 'Classes', 'Instructors', 'Contact'],
  },

  other: {
    name: 'その他',
    icon: '⭐',
    service_label: 'サービス',
    service_plural: '全サービス',
    price_label: '料金',
    duration_label: '所要時間',
    capacity_label: '対応人数',
    layout: {
      service_grid: 'md:grid-cols-2 lg:grid-cols-3',
      service_card_height: 'h-56',
      service_image_height: 'h-36',
      gallery_columns: 'grid-cols-2 md:grid-cols-3',
      hero_height: 'min-h-96',
    },
    style: {
      accent_color: 'slate-600',
      bg_light: 'bg-slate-50',
      border_color: 'border-slate-200',
      font_serif: false,
      luxury_design: false,
    },
    nav_items: ['Services', 'Gallery', 'Contact'],
    animation_preset: 'light',
    default_blocks: ['Hero', 'Services', 'Gallery', 'Contact'],
  },
};

/**
 * 業種別UI設定を取得
 */
export function getUIConfig(businessType) {
  return UI_CONFIGS[businessType] || UI_CONFIGS.other;
}

/**
 * ナビゲーション項目を取得
 */
export function getNavItems(businessType) {
  const config = getUIConfig(businessType);
  return config.nav_items || [];
}

/**
 * テンプレートブロックを取得
 */
export function getTemplateBlocks(businessType) {
  const config = getUIConfig(businessType);
  return config.default_blocks || [];
}

/**
 * アニメーションプリセットを取得
 */
export const ANIMATION_PRESETS = {
  luxury: {
    default_type: 'fade-in',
    default_trigger: 'on-scroll',
    default_duration: 800,
    default_delay: 100,
  },
  light: {
    default_type: 'fade-up',
    default_trigger: 'on-scroll',
    default_duration: 600,
    default_delay: 0,
  },
  professional: {
    default_type: 'fade-in',
    default_trigger: 'on-scroll',
    default_duration: 700,
    default_delay: 50,
  },
  dynamic: {
    default_type: 'zoom-in',
    default_trigger: 'on-scroll',
    default_duration: 700,
    default_delay: 100,
  },
  calm: {
    default_type: 'fade-up',
    default_trigger: 'on-scroll',
    default_duration: 800,
    default_delay: 100,
  },
};

export function getAnimationPreset(businessType) {
  const config = getUIConfig(businessType);
  return ANIMATION_PRESETS[config.animation_preset] || ANIMATION_PRESETS.light;
}

/**
 * アクセント色を取得（Tailwind クラス用）
 */
export function getAccentColorClass(businessType, variant = 'DEFAULT') {
  const config = getUIConfig(businessType);
  const accentColor = config.style.accent_color;
  const variants = {
    DEFAULT: accentColor,
    light: accentColor.replace('-600', '-100'),
    lighter: accentColor.replace('-600', '-50'),
    dark: accentColor.replace('-600', '-700'),
  };
  return `bg-${variants[variant] || variants.DEFAULT}`;
}