/**
 * uiConfigUtils.js
 * UI設定用ユーティリティ関数
 */
import { getUIConfig, getNavItems, getTemplateBlocks, getAnimationPreset } from './uiConfig';
import { getThemeColors } from './businessTypeTheme';

/**
 * 業種に応じたサービス表示方式を取得
 * hotel: グリッド・高級, salon: リスト・シンプル など
 */
export function getServiceDisplayType(businessType) {
  const config = getUIConfig(businessType);
  
  if (businessType === 'hotel') return 'grid-luxury';
  if (businessType === 'salon') return 'list-simple';
  
  return 'grid-default';
}

/**
 * 業種に応じたナビゲーション設定を取得
 */
export function getNavigationConfig(businessType) {
  const navItems = getNavItems(businessType);
  const config = getUIConfig(businessType);
  
  return {
    items: navItems,
    style: {
      accent_color: config.style.accent_color,
      font_serif: config.style.font_serif,
    },
  };
}

/**
 * ブロックレイアウト設定を取得
 */
export function getBlockLayoutConfig(businessType) {
  const config = getUIConfig(businessType);
  return config.layout;
}

/**
 * スタイル設定を取得
 */
export function getStyleConfig(businessType) {
  const config = getUIConfig(businessType);
  return config.style;
}

/**
 * 完全なテーマ情報を取得
 */
export function getCompleteTheme(businessType) {
  const config = getUIConfig(businessType);
  const colors = getThemeColors(businessType);
  
  return {
    name: config.name,
    icon: config.icon,
    labels: {
      service: config.service_label,
      price: config.price_label,
      duration: config.duration_label,
      capacity: config.capacity_label,
    },
    layout: config.layout,
    style: config.style,
    colors: colors,
    animation: getAnimationPreset(businessType),
    navigation: getNavItems(businessType),
    defaultBlocks: getTemplateBlocks(businessType),
  };
}

/**
 * 業種別デフォルトナビゲーション項目を生成
 */
export function generateDefaultNavigationItems(businessType) {
  const items = getNavItems(businessType);
  return items.map((label, index) => ({
    label,
    href: `#${label.toLowerCase()}`,
    sort_order: index,
    is_visible: true,
  }));
}