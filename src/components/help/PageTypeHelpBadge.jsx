/**
 * PageTypeHelpBadge.jsx
 * ページタイプ説明のミニバージョン
 * 見出しの横に配置用
 */
import React from 'react';
import PageTypeHelpIcon from './PageTypeHelpIcon';

export default function PageTypeHelpBadge({ type = 'top' }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <PageTypeHelpIcon type={type} size="sm" />
    </div>
  );
}