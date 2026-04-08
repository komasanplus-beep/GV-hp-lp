/**
 * lpThemeRenderer
 * LP表示時のテーマ適用ロジック
 * ホームページと同じデザインシステムを使用
 */

/**
 * テーマからCSS変数を生成
 */
export function generateThemeCSS(theme) {
  if (!theme) return '';
  
  return `
    :root {
      --lp-font-heading: ${theme.font_family_heading || 'sans-serif'};
      --lp-font-body: ${theme.font_family_body || 'sans-serif'};
      --lp-size-h1: ${theme.font_size_h1 || 32}px;
      --lp-size-h2: ${theme.font_size_h2 || 24}px;
      --lp-size-h3: ${theme.font_size_h3 || 18}px;
      --lp-size-body: ${theme.font_size_body || 14}px;
      --lp-line-height: ${theme.line_height_body || 1.6};
      --lp-section-spacing: ${theme.section_spacing || 80}px;
      --lp-container-width: ${theme.container_width || 1200}px;
      --lp-primary: ${theme.primary_color || '#000000'};
      --lp-accent: ${theme.accent_color || '#FF6B6B'};
      --lp-bg: ${theme.background_color || '#FFFFFF'};
      --lp-card-radius: ${theme.card_radius || 8}px;
    }

    body {
      font-family: var(--lp-font-body);
      font-size: var(--lp-size-body);
      line-height: var(--lp-line-height);
      color: var(--lp-primary);
      background-color: var(--lp-bg);
    }

    h1 { font-family: var(--lp-font-heading); font-size: var(--lp-size-h1); font-weight: 700; line-height: 1.2; }
    h2 { font-family: var(--lp-font-heading); font-size: var(--lp-size-h2); font-weight: 700; line-height: 1.3; }
    h3 { font-family: var(--lp-font-heading); font-size: var(--lp-size-h3); font-weight: 600; line-height: 1.4; }

    .lp-section {
      padding: var(--lp-section-spacing) 20px;
    }

    .lp-container {
      max-width: var(--lp-container-width);
      margin: 0 auto;
      padding: 0 20px;
    }

    .lp-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: var(--lp-accent);
      color: white;
      border-radius: var(--lp-card-radius);
      font-weight: 600;
      transition: all 0.3s ease;
      text-decoration: none;
      border: none;
      cursor: pointer;
    }

    .lp-button:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }

    .lp-card {
      background: white;
      border-radius: var(--lp-card-radius);
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .lp-feature-item {
      text-align: center;
    }

    .lp-feature-item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      margin: 0 auto 16px;
      background-color: rgba(255, 107, 107, 0.1);
      border-radius: var(--lp-card-radius);
      font-size: 32px;
    }

    .lp-feature-item-title {
      font-size: var(--lp-size-h3);
      font-weight: 600;
      margin-bottom: 8px;
    }

    .lp-feature-item-desc {
      font-size: var(--lp-size-body);
      color: #666;
      line-height: var(--lp-line-height);
    }
  `;
}

/**
 * ブロックのスタイル設定を適用
 */
export function applyBlockStyles(blockElement, blockData, theme, useTheme) {
  if (!useTheme || !blockElement) return;

  const blockType = blockData.block_type;

  // ブロックタイプ別のスタイル適用
  switch (blockType) {
    case 'Hero':
      blockElement.style.padding = `${(theme.section_spacing || 80) * 1.5}px 20px`;
      blockElement.classList.add('lp-hero');
      break;

    case 'Feature':
    case 'Benefit':
    case 'Evidence':
      blockElement.style.padding = `${theme.section_spacing || 80}px 20px`;
      blockElement.classList.add('lp-section');
      break;

    case 'CTA':
    case 'Contact':
      blockElement.style.padding = `${theme.section_spacing || 80}px 20px`;
      blockElement.style.backgroundColor = theme.accent_color || '#FF6B6B';
      blockElement.style.color = 'white';
      blockElement.classList.add('lp-section');
      break;

    default:
      blockElement.style.padding = `${theme.section_spacing || 80}px 20px`;
      blockElement.classList.add('lp-section');
  }
}

/**
 * テーマを簡潔にプレビュー用に変換
 */
export function getThemePreview(theme) {
  return {
    primaryColor: theme.primary_color,
    accentColor: theme.accent_color,
    fontSizeH1: theme.font_size_h1,
    fontSizeH2: theme.font_size_h2,
    sectionSpacing: theme.section_spacing,
    buttonStyle: theme.button_style,
    cardRadius: theme.card_radius,
  };
}