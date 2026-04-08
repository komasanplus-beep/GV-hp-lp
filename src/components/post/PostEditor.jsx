/**
 * PostEditor - リッチテキストエディタ (react-quill ベース)
 * 将来的なブロックエディタ拡張を想定した構造
 */
import React, { useRef } from 'react';
import ReactQuill from 'react-quill';
import { base44 } from '@/api/base44Client';

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  ['link', 'image', 'video'],
  ['clean'],
];

const FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'code-block',
  'link', 'image', 'video',
];

export default function PostEditor({ value, onChange }) {
  const quillRef = useRef(null);

  // 画像アップロードハンドラ
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', file_url);
      }
    };
  };

  const modules = {
    toolbar: {
      container: TOOLBAR,
      handlers: { image: imageHandler },
    },
  };

  return (
    <div className="post-editor-wrap">
      <ReactQuill
        ref={quillRef}
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        theme="snow"
        style={{ minHeight: '320px' }}
        placeholder="本文を入力してください..."
      />
    </div>
  );
}