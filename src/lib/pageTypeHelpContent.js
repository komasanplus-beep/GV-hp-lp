/**
 * pageTypeHelpContent.js
 * ページタイプ（トップページ・通常ページ）の説明文を管理
 * 将来的にDB管理への拡張も容易
 */

export const PAGE_TYPE_HELP = {
  top: {
    title: 'トップページとは',
    icon: '🏠',
    description: 'サイトの入口となるメインページです。通常は「/」に対応し、最初に訪問者が見る中心ページになります。1サイトに1つを基本とし、サイト全体の案内や主要導線をまとめます。',
    details: [
      'サイトのランディングページ（LP）として機能します',
      'ヘッダーとフッターから常に遷移可能な位置にあります',
      '複数のセクション（Hero、About、Service、Gallery など）を組み合わせて構成します',
      'サイト全体のテーマやビジュアルの基調となります',
    ],
  },
  regular: {
    title: '通常ページとは',
    icon: '📄',
    description: 'サービス詳細、料金、アクセス、お問い合わせなどの個別ページです。各ページは独自の URL（slug）を持ち、ヘッダーやフッターのメニューから遷移されます。複数作成可能です。',
    details: [
      'トップページの下層にある個別ページです',
      '各ページが独自の URL（例：/service、/contact）を持ちます',
      'ヘッダーメニューやフッターリンクから遷移されます',
      '1つ1つが独立した情報や機能を提供します',
      '複数作成でき、サイトの情報量を拡張できます',
    ],
  },
};

/**
 * 指定されたページタイプのヘルプコンテンツを取得
 * @param {string} type - 'top' or 'regular'
 * @returns {object} ヘルプコンテンツ
 */
export function getPageTypeHelp(type) {
  return PAGE_TYPE_HELP[type] || null;
}

/**
 * UI/UX 設定
 */
export const HELP_UI_CONFIG = {
  popover: {
    align: 'center',
    side: 'bottom',
  },
  keyboard: {
    closeOn: ['Escape'],
  },
};