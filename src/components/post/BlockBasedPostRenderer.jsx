/**
 * BlockBasedPostRenderer
 * ブロック配列を実際のHTMLにレンダリング
 */
import React from 'react';

export default function BlockBasedPostRenderer({ blocks = [] }) {
  return (
    <div className="prose prose-lg max-w-none">
      {blocks.map(block => {
        switch (block.type) {
          case 'heading':
            const Tag = block.level || 'h2';
            return <Tag key={block.id} id={block.id}>{block.text}</Tag>;

          case 'paragraph':
            return <div key={block.id} dangerouslySetInnerHTML={{ __html: block.html }} />;

          case 'image':
            return (
              <figure key={block.id}>
                <img
                  src={block.image_url}
                  alt={block.alt_text}
                  style={{ width: `${block.width || 100}%`, margin: block.align === 'center' ? 'auto' : '' }}
                  className={`rounded-lg shadow-md`}
                />
                {block.caption && <figcaption className="text-center text-sm text-slate-500 mt-2">{block.caption}</figcaption>}
              </figure>
            );

          case 'list':
            const ListTag = block.list_type === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={block.id}>
                {(block.items || []).map((item, index) => <li key={index}>{item}</li>)}
              </ListTag>
            );

          case 'quote':
            return (
              <blockquote key={block.id}>
                <p>{block.content}</p>
              </blockquote>
            );

          case 'separator':
            return <hr key={block.id} className="my-8" />;

          default:
            return null;
        }
      })}
    </div>
  );
}