/**
 * businessTypeTheme.js
 * 業種別テーマ・カラースキーム管理
 */

export const THEME_COLORS = {
  hotel: {
    primary: '#D97706', // amber-600
    secondary: '#92400E', // amber-900
    accent: '#FBBF24', // amber-400
    background: '#FFFBEB', // amber-50
    text: '#1F2937', // gray-800
    border: '#FCD34D', // amber-300
  },
  salon: {
    primary: '#EC4899', // rose-500
    secondary: '#BE185D', // rose-800
    accent: '#F472B6', // rose-300
    background: '#FFF1F2', // rose-50
    text: '#1F2937', // gray-800
    border: '#FBCFE8', // rose-200
  },
  clinic: {
    primary: '#2563EB', // blue-600
    secondary: '#1E40AF', // blue-800
    accent: '#3B82F6', // blue-500
    background: '#EFF6FF', // blue-50
    text: '#1F2937', // gray-800
    border: '#93C5FD', // blue-300
  },
  gym: {
    primary: '#EA580C', // orange-600
    secondary: '#B45309', // orange-800
    accent: '#FB923C', // orange-400
    background: '#FFF7ED', // orange-50
    text: '#1F2937', // gray-800
    border: '#FDBA74', // orange-300
  },
  school: {
    primary: '#4F46E5', // indigo-600
    secondary: '#3730A3', // indigo-800
    accent: '#6366F1', // indigo-500
    background: '#EEF2FF', // indigo-50
    text: '#1F2937', // gray-800
    border: '#A5B4FC', // indigo-300
  },
  restaurant: {
    primary: '#DC2626', // red-600
    secondary: '#991B1B', // red-900
    accent: '#EF4444', // red-500
    background: '#FEF2F2', // red-50
    text: '#1F2937', // gray-800
    border: '#FECACA', // red-300
  },
  beauty: {
    primary: '#DB2777', // pink-600
    secondary: '#9D174D', // pink-900
    accent: '#EC4899', // pink-500
    background: '#FDF2F8', // pink-50
    text: '#1F2937', // gray-800
    border: '#F472B6', // pink-300
  },
  wellness: {
    primary: '#0D9488', // teal-600
    secondary: '#134E4A', // teal-900
    accent: '#14B8A6', // teal-500
    background: '#F0FDFA', // teal-50
    text: '#1F2937', // gray-800
    border: '#7EE8DF', // teal-300
  },
  other: {
    primary: '#475569', // slate-600
    secondary: '#1E293B', // slate-800
    accent: '#64748B', // slate-500
    background: '#F8FAFC', // slate-50
    text: '#1F2937', // gray-800
    border: '#CBD5E1', // slate-300
  },
};

export function getThemeColors(businessType) {
  return THEME_COLORS[businessType] || THEME_COLORS.other;
}

/**
 * CSS 変数を生成
 */
export function generateThemeCSS(businessType) {
  const colors = getThemeColors(businessType);
  return `
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-accent: ${colors.accent};
      --color-background: ${colors.background};
      --color-text: ${colors.text};
      --color-border: ${colors.border};
    }
  `;
}