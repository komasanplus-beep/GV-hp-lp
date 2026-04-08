/**
 * BlockBasedPostEditor
 * ブロック型本文エディタ（見出し、文章、画像など）
 * ドラッグ&ドロップで並び替え対応
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Grip, Trash2, Copy, ChevronUp, ChevronDown,
  Heading2, Heading3, Heading4, Type, Image as ImageIcon, Minus as Separator, List, Quote
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import BlockHeadingEdit from './BlockHeadingEdit';
import BlockParagraphEdit from './BlockParagraphEdit';
import BlockImageEdit from './BlockImageEdit';

const BLOCK_TYPES = [
  { type: 'heading', label: '見出し', icon: Heading2 },
  { type: 'paragraph', label: '文章', icon: Type },
  { type: 'image', label: '画像', icon: ImageIcon },
  { type: 'list', label: 'リスト', icon: List },
  { type: 'quote', label: '引用', icon: Quote },
  { type: 'separator', label: '区切り線', icon: Separator },
];

export default function BlockBasedPostEditor({ blocks = [], onChange }) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const addBlock = (type) => {
    const newBlock = {
      id: `blk_${Date.now()}`,
      type,
      level: 'h2',
      text: '',
      html: '',
      image_url: '',
      alt_text: '',
      caption: '',
      width: 100,
      align: 'center',
      items: [],
      list_type: 'bullet',
      content: '',
    };
    onChange([...blocks, newBlock]);
    setShowAddMenu(false);
    toast.success(`${BLOCK_TYPES.find(b => b.type === type)?.label}を追加しました`);
  };

  const updateBlock = (id, updates) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id) => {
    onChange(blocks.filter(b => b.id !== id));
    toast.success('ブロックを削除しました');
  };

  const duplicateBlock = (id) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const newBlock = { ...block, id: `blk_${Date.now()}` };
    const idx = blocks.findIndex(b => b.id === id);
    onChange([...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)]);
    toast.success('ブロックを複製しました');
  };

  const moveBlock = (id, direction) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (direction === 'up' && idx <= 0) return;
    if (direction === 'down' && idx >= blocks.length - 1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    onChange(newBlocks);
  };

  const handleImageUpload = async (blockId, file) => {
    setIsImageUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      updateBlock(blockId, { image_url: res.file_url });
      toast.success('画像をアップロードしました');
    } catch (err) {
      toast.error('アップロードに失敗しました');
    } finally {
      setIsImageUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* ブロックリスト */}
      {blocks.length > 0 && (
        <div className="space-y-2.5">
          {blocks.map((block, idx) => (
            <BlockCard
              key={block.id}
              block={block}
              index={idx}
              total={blocks.length}
              onUpdate={(updates) => updateBlock(block.id, updates)}
              onDelete={() => deleteBlock(block.id)}
              onDuplicate={() => duplicateBlock(block.id)}
              onMove={(dir) => moveBlock(block.id, dir)}
              onImageUpload={(file) => handleImageUpload(block.id, file)}
              isImageUploading={isImageUploading}
            />
          ))}
        </div>
      )}

      {/* ブロック追加ボタン */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed border-slate-300 hover:border-slate-400 h-10"
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          <Plus className="w-4 h-4" />
          ブロックを追加
        </Button>

        {/* ドロップダウンメニュー */}
        {showAddMenu && (
          <div className="absolute top-11 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
            <div className="p-2 space-y-1">
              {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 rounded-md transition-colors text-sm"
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">ブロックがありません</p>
          <p className="text-xs mt-1">「ブロックを追加」から開始してください</p>
        </div>
      )}
    </div>
  );
}

/**
 * BlockCard - ブロック1つの編集カード
 */
function BlockCard({
  block,
  index,
  total,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  onImageUpload,
  isImageUploading,
}) {
  const blockType = BLOCK_TYPES.find(b => b.type === block.type);
  const Icon = blockType?.icon;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* ヘッダー */}
      <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Grip className="w-4 h-4 text-slate-400 cursor-grab" />
          {Icon && <Icon className="w-4 h-4 text-slate-600" />}
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {blockType?.label}
          </span>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="上へ"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove('down')}
            disabled={index === total - 1}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="下へ"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
            title="複製"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {block.type === 'heading' && (
          <BlockHeadingEdit block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'paragraph' && (
          <BlockParagraphEdit block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'image' && (
          <BlockImageEdit
            block={block}
            onUpdate={onUpdate}
            onImageUpload={onImageUpload}
            isUploading={isImageUploading}
          />
        )}
        {block.type === 'list' && (
          <BlockListEdit block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'quote' && (
          <BlockQuoteEdit block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'separator' && (
          <p className="text-xs text-slate-400 text-center py-2">区切り線</p>
        )}
      </div>
    </div>
  );
}

/**
 * BlockListEdit
 */
function BlockListEdit({ block, onUpdate }) {
  return (
    <div className="space-y-2">
      <select
        value={block.list_type || 'bullet'}
        onChange={(e) => onUpdate({ list_type: e.target.value })}
        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
      >
        <option value="bullet">・リスト</option>
        <option value="ordered">1. 番号付きリスト</option>
      </select>
      <Textarea
        value={(block.items || []).join('\n')}
        onChange={(e) => onUpdate({ items: e.target.value.split('\n').filter(Boolean) })}
        placeholder="各行に1つの項目を入力"
        rows={4}
        className="text-sm resize-none"
      />
    </div>
  );
}

/**
 * BlockQuoteEdit
 */
function BlockQuoteEdit({ block, onUpdate }) {
  return (
    <Textarea
      value={block.content || ''}
      onChange={(e) => onUpdate({ content: e.target.value })}
      placeholder="引用文を入力"
      rows={3}
      className="text-sm resize-none"
    />
  );
}