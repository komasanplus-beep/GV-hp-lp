/**
 * ブロック関連ユーティリティ
 */

/**
 * blocks配列から見出しを抽出して目次を生成
 */
export function generateTableOfContents(blocks) {
  const headings = blocks
    .filter(b => b.type === 'heading' && [2, 3, 4].includes(b.level))
    .map((b, idx) => ({
      id: `heading-${idx}`,
      level: b.level,
      text: b.content,
      blockId: b.id,
    }));

  return headings;
}

/**
 * ブロック配列をHTML文字列に変換（プレビュー用）
 */
export function blocksToHtml(blocks) {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `<h${block.level} class="my-4 font-bold">${escapeHtml(block.content)}</h${block.level}>`;
        case 'paragraph':
          const fontSize = {
            sm: 'text-sm',
            base: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
          }[block.style?.font_size || 'base'];
          const bold = block.style?.bold ? 'font-bold' : '';
          return `<p class="my-2 ${fontSize} ${bold}">${escapeHtml(block.content)}</p>`;
        case 'image':
          const width = block.width ? `style="width:${block.width}%"` : '';
          const align = block.align === 'center' ? 'mx-auto' : block.align === 'right' ? 'ml-auto' : '';
          return `<div class="${align}"><img src="${block.image_url}" alt="${escapeHtml(block.alt_text || '')}" ${width} class="rounded-lg" /></div>`;
        case 'list':
          const tag = block.list_type === 'ordered' ? 'ol' : 'ul';
          const items = (block.items || [])
            .map(item => `<li>${escapeHtml(item)}</li>`)
            .join('');
          return `<${tag} class="my-2 ml-5 space-y-1">${items}</${tag}>`;
        case 'quote':
          return `<blockquote class="my-4 pl-4 border-l-4 border-slate-300 italic text-slate-600">${escapeHtml(block.content)}${block.citation ? `<footer class="text-sm mt-2">— ${escapeHtml(block.citation)}</footer>` : ''}</blockquote>`;
        case 'separator':
          return `<hr class="my-4" />`;
        case 'code':
          return `<pre class="my-2 p-3 bg-slate-100 rounded overflow-auto"><code>${escapeHtml(block.content)}</code></pre>`;
        default:
          return '';
      }
    })
    .join('');
}

/**
 * HTML特殊文字をエスケープ
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * blocks配列から簡単なテキスト抜粋を生成
 */
export function generateExcerpt(blocks, maxLength = 120) {
  const text = blocks
    .filter(b => b.type === 'paragraph')
    .map(b => b.content)
    .join(' ')
    .trim();
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}