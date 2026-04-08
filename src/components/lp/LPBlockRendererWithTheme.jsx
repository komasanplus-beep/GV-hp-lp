/**
 * LPBlockRendererWithTheme
 * テーマを適用したLP用ブロックレンダラー
 * ホームページデザインシステムを流用
 */

import React from 'react';
import BlockRenderer from './BlockRenderer';
import { applyBlockStyles } from '@/lib/lpThemeRenderer';

export default function LPBlockRendererWithTheme({ block, siteId, theme, useTheme }) {
  return (
    <div
      ref={(el) => {
        if (el && useTheme && theme) {
          applyBlockStyles(el, block, theme, useTheme);
        }
      }}
      className="lp-block-wrapper"
    >
      <BlockRenderer block={block} siteId={siteId} />
    </div>
  );
}