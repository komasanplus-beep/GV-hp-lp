/**
 * TableOfContents
 * ブロックから自動生成された目次を表示
 */
import React from 'react';
import { List } from 'lucide-react';

export default function TableOfContents({ blocks, visible = true }) {
  if (!visible) return null;

  // 見出しを抽出
  const headings = blocks
    .filter(b => b.type === 'heading' && [2, 3, 4].includes(b.level))
    .map((b, idx) => ({
      id: `heading-${idx}`,
      level: b.level,
      text: b.content,
    }));

  if (headings.length === 0) return null;

  const handleScroll = (headingId) => {
    const index = headings.findIndex(h => h.id === headingId);
    if (index !== -1) {
      const targetBlock = blocks.filter(b => b.type === 'heading')[index];
      const element = document.getElementById(targetBlock.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <List className="w-4 h-4 text-slate-600" />
        <h4 className="font-semibold text-sm text-slate-800">目次</h4>
      </div>
      <ul className="space-y-1.5 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`${
              heading.level === 2 ? 'ml-0' : heading.level === 3 ? 'ml-4' : 'ml-8'
            }`}
          >
            <button
              onClick={() => handleScroll(heading.id)}
              className="text-violet-600 hover:underline text-left truncate"
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}