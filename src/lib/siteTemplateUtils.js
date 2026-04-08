import { base44 } from '@/api/base44Client';

/**
 * 新規サイト作成時に初期ページを生成
 */
export async function initializeSiteWithTemplate(siteId, templateType) {
  try {
    const response = await base44.functions.invoke('createSiteWithTemplate', {
      site_id: siteId,
      template_type: templateType,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to initialize site template:', error);
    throw error;
  }
}

/**
 * テンプレート種別の表示ラベル
 */
export function getTemplateLabel(type) {
  const labels = {
    salon: 'サロン',
    hotel: 'ホテル',
    default: 'デフォルト',
  };
  return labels[type] || type;
}