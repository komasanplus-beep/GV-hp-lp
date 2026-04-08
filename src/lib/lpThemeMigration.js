/**
 * lpThemeMigration
 * 既存LPを新しいテーマシステムへ移行するユーティリティ
 */

import { base44 } from '@/api/base44Client';

/**
 * 単一サイトの全LPに use_site_theme フラグを付与
 */
export async function migrateAllLPsInSite(siteId) {
  try {
    const result = await base44.functions.invoke('migrateExistingLPToTheme', {
      site_id: siteId,
    });
    return result.data?.migratedCount || 0;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * 個別LPの theme_use フラグをトグル
 */
export async function toggleLPThemeUsage(lpId, useTheme) {
  return base44.entities.LandingPage.update(lpId, {
    use_site_theme: useTheme,
  });
}

/**
 * サイトテーマを初期化（なければ作成）
 */
export async function initializeSiteTheme(siteId, overrides = {}) {
  try {
    const result = await base44.functions.invoke('getSiteTheme', {
      site_id: siteId,
    });
    
    if (result.data?.created) {
      console.log(`New theme created for site ${siteId}`);
    }
    
    return result.data?.theme;
  } catch (error) {
    console.error('Theme initialization failed:', error);
    throw error;
  }
}

/**
 * 既存のホームページテーマ設定をLPに反映
 */
export async function syncHomepageThemeToLP(siteId) {
  try {
    // Siteエンティティから色設定などを取得
    const sites = await base44.entities.Site.filter({ id: siteId });
    const site = sites?.[0];
    
    if (!site) {
      console.warn('Site not found for theme sync');
      return null;
    }

    // サイト共通テーマを更新
    const themeUpdates = {
      site_id: siteId,
      // Siteから取得できるカラー設定があれば適用
      ...(site.seo_config?.theme && {
        primary_color: site.seo_config.theme.primaryColor,
        accent_color: site.seo_config.theme.accentColor,
      }),
    };

    const result = await base44.functions.invoke('updateSiteTheme', themeUpdates);
    console.log('Theme synced from homepage to LP:', result.data?.theme);
    
    return result.data?.theme;
  } catch (error) {
    console.error('Theme sync failed:', error);
    throw error;
  }
}

/**
 * デフォルトテーマをリセット
 */
export async function resetSiteThemeToDefault(siteId) {
  const defaultTheme = {
    site_id: siteId,
    font_family_heading: 'sans-serif',
    font_family_body: 'sans-serif',
    font_size_h1: 32,
    font_size_h2: 24,
    font_size_h3: 18,
    font_size_body: 14,
    line_height_body: 1.6,
    section_spacing: 80,
    container_width: 1200,
    primary_color: '#000000',
    accent_color: '#FF6B6B',
    background_color: '#FFFFFF',
    card_radius: 8,
    button_style: 'solid',
    icon_style: 'circle',
  };

  return base44.functions.invoke('updateSiteTheme', defaultTheme);
}