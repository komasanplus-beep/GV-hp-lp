/**
 * BlockEditor
 * WordPress型ブロックエディタ
 * 見出し・段落・画像・リスト等をドラッグで管理
 */
import React, { useState } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Copy, GripVertical, Type, FileText, Image as ImageIcon,
  List, Quote, Code, Minus, Heading2, Heading3, Heading4
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BlockHeadingEdit from './BlockHeadingEdit';
import BlockParagraphEdit from './BlockParagraphEdit';
import BlockImageEdit from './BlockImageEdit';
import BlockListEdit from './BlockListEdit';
import BlockQuoteEdit from './BlockQuoteEdit';
import { v4 as uuidv4 } from 'uuid';

const BLOCK_TYPES = [
  { type: 'heading', label: 'H2見出し', icon: Heading2, level: 2 },
  { type: 'heading', label: 'H3見出し', icon: Heading3, level: 3 },
  { type: 'heading', label: 'H4見出し', icon: Heading4, level: 4 },
  { type: 'paragraph', label: '段落', icon: FileText },
  { type: 'image', label: '画像', icon: ImageIcon },
  { type: 'list', label: 'リスト', icon: List },
  { type: 'quote', label: '引用', icon: Quote },
  { type: 'separator', label: '区切り線', icon: Minus },
  { type: 'code', label: 'コード', icon: Code },
];

export default function BlockEditor({ blocks = [], onChange }) {
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showBlockMenu, setShowBlockMenu] = useState(null);

  const addBlock = (type, extraProps = {}) => {
    const newBlock = {
      id: uuidv4(),
      type,
      content: '',
      style: {
        font_size: 'base',
        bold: false,
        italic: false,
        line_height: 'normal',
      },
      ...extraProps,
    };
    onChange([...blocks, newBlock]);
    setShowBlockMenu(null);
  };

  const updateBlock = (id, updates) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const duplicateBlock = (block) => {
    const copy = { ...block, id: uuidv4() };
    const index = blocks.findIndex(b => b.id === block.id);
    onChange([...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)]);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* ━━━ ブロック一覧 ━━━ */}
      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={(newOrder) => onChange(newOrder)}
        className="space-y-2 p-4 min-h-96"
      >
        <AnimatePresence>
          {blocks.map((block, idx) => (
            <Reorder.Item key={block.id} value={block} className="relative">
              <div
                className={`border rounded-lg transition-all ${
                  selectedBlockId === block.id
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* ━━━ ブロックヘッダ ━━━ */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                    <BlockTypeIcon type={block.type} level={block.level} />
                    <span className="text-xs font-semibold text-slate-600">
                      {getBlockLabel(block)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => duplicateBlock(block)}
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteBlock(block.id)}
                      className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* ━━━ ブロック編集エリア ━━━ */}
                <div
                  className="p-4"
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  {block.type === 'heading' && (
                    <BlockHeadingEdit
                      block={block}
                      onChange={(updates) => updateBlock(block.id, updates)}
                    />
                  )}
                  {block.type === 'paragraph' && (
                    <BlockParagraphEdit
                      block={block}
                      onChange={(updates) => updateBlock(block.id, updates)}
                    />
                  )}
                  {block.type === 'image' && (
                    <BlockImageEdit
                      block={block}
                      onChange={(updates) => updateBlock(block.id, updates)}
                    />
                  )}
                  {block.type === 'list' && (
                    <BlockListEdit
                      block={block}
                      onChange={(updates) => updateBlock(block.id, updates)}
                    />
                  )}
                  {block.type === 'quote' && (
                    <BlockQuoteEdit
                      block={block}
                      onChange={(updates) => updateBlock(block.id, updates)}
                    />
                  )}
                  {block.type === 'separator' && (
                    <div className="h-2 bg-slate-300 rounded w-1/4"></div>
                  )}
                  {block.type === 'code' && (
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="コードを入力..."
                      className="w-full h-24 p-2 border border-slate-200 rounded font-mono text-xs resize-none"
                    />
                  )}
                </div>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>

        {/* ━━━ 空状態 ━━━ */}
        {blocks.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm mb-3">ブロックを追加して記事を作成します</p>
            <Button
              onClick={() => setShowBlockMenu('main')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              最初のブロックを追加
            </Button>
          </div>
        )}
      </Reorder.Group>

      {/* ━━━ ブロック追加ボタン ━━━ */}
      {blocks.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
          <div className="relative">
            <Button
              onClick={() => setShowBlockMenu(showBlockMenu ? null : 'inline')}
              variant="outline"
              size="sm"
              className="gap-2 w-full justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              ブロックを追加
            </Button>

            {/* ━━━ ブロック選択メニュー ━━━ */}
            {showBlockMenu === 'inline' && (
              <div className="absolute top-10 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <div className="grid grid-cols-2 gap-1 p-2">
                  {BLOCK_TYPES.map(({ type, label, icon: IconComponent, ...props }) => (
                    <button
                      key={`${type}-${props.level || ''}`}
                      onClick={() => addBlock(type, props)}
                      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 text-left text-sm"
                    >
                      <IconComponent className="w-4 h-4 text-slate-500" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BlockTypeIcon({ type, level }) {
  const iconProps = { className: 'w-4 h-4 text-slate-400' };
  switch (type) {
    case 'heading':
      if (level === 2) return <Heading2 {...iconProps} />;
      if (level === 3) return <Heading3 {...iconProps} />;
      if (level === 4) return <Heading4 {...iconProps} />;
      break;
    case 'paragraph':
      return <FileText {...iconProps} />;
    case 'image':
      return <ImageIcon {...iconProps} />;
    case 'list':
      return <List {...iconProps} />;
    case 'quote':
      return <Quote {...iconProps} />;
    case 'separator':
      return <Minus {...iconProps} />;
    case 'code':
      return <Code {...iconProps} />;
    default:
      return null;
  }
}

function getBlockLabel(block) {
  const typeLabels = {
    heading: `見出し H${block.level || 2}`,
    paragraph: '段落',
    image: '画像',
    list: `${block.list_type === 'ordered' ? '番号' : 'リスト'}`,
    quote: '引用',
    separator: '区切り線',
    code: 'コード',
  };
  return typeLabels[block.type] || block.type;
}