/**
 * BlockParagraphEdit - 段落ブロック編集
 * react-quill を使用（header format は無効化）
 */
import React, { useRef } from 'react';
import ReactQuill from 'react-quill';

const TOOLBAR = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link'],
  ['clean'],
];

const FORMATS = [
  'bold', 'italic', 'underline',
  'list', 'bullet',
  'link',
];

export default function BlockParagraphEdit({ block, onUpdate }) {
  const quillRef = useRef(null);

  const modules = {
    toolbar: {
      container: TOOLBAR,
    },
  };

  return (
    <div className="prose prose-sm max-w-none">
      <ReactQuill
        ref={quillRef}
        value={block.html || ''}
        onChange={(html) => onUpdate({ html })}
        modules={modules}
        formats={FORMATS}
        theme="snow"
        placeholder="段落本文を入力..."
        style={{ minHeight: '200px' }}
      />
    </div>
  );
}