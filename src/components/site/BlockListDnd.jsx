/**
 * BlockListDnd
 * dnd-kitベースのドラッグ&ドロップ並び替えUI
 * ブロック管理・編集・削除機能完備
 */

import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { GripVertical, Pencil, Trash2, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

/**
 * BlockItem - ドラッグ可能な個別ブロック
 */
function BlockItem({ block, onEdit, onDelete, onConvert, isConverting }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white rounded-lg border transition-all ${
        isDragging
          ? 'shadow-lg border-blue-300 bg-blue-50'
          : 'border-slate-200 hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 transition-colors"
        aria-label="ブロックを移動"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Block Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{block.block_type}</p>
        {block.data?.title && (
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {block.data.title}
          </p>
        )}
      </div>

      {/* Block Type Badge */}
      <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full flex-shrink-0">
        #{block.sort_order + 1}
      </span>

      {/* Actions */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onConvert(block)}
        disabled={isConverting}
        title="ページ化"
        className="h-8 w-8 p-0 text-amber-400 hover:text-amber-600 hover:bg-amber-50 flex-shrink-0"
      >
        {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onEdit(block)}
        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 flex-shrink-0"
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(block)}
        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

/**
 * BlockListDnd - メインコンポーネント
 */
export default function BlockListDnd({ blocks, pageId, siteId, onBlocksChange }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [convertingId, setConvertingId] = useState(null);
  const [localBlocks, setLocalBlocks] = useState(blocks);
  const queryClient = useQueryClient();

  // dnd-kitセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor)
  );

  // ブロックIDリスト
  const blockIds = useMemo(() => localBlocks.map(b => b.id), [localBlocks]);

  // 削除mutation
  const deleteMutation = useMutation({
    mutationFn: (blockId) => base44.entities.SiteBlock.delete(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
      setDeleteTarget(null);
      toast.success('ブロックを削除しました');
      onBlocksChange?.();
    },
    onError: () => {
      toast.error('削除に失敗しました');
    },
  });

  // 並び替えmutation
  const reorderMutation = useMutation({
    mutationFn: async (updates) => {
      return Promise.all(
        updates.map(({ id, sort_order }) =>
          base44.entities.SiteBlock.update(id, { sort_order })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
      toast.success('保存しました');
      onBlocksChange?.();
    },
    onError: (error) => {
      setLocalBlocks(blocks); // ロールバック
      toast.error('保存に失敗しました');
    },
  });

  // ページ化mutation
  const convertMutation = useMutation({
    mutationFn: (blockId) => base44.functions.invoke('convertBlockToPage', { block_id: blockId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
      setConvertingId(null);
      toast.success(`ページ化しました: /${res.data?.new_page_slug}`);
      onBlocksChange?.();
    },
    onError: (error) => {
      setConvertingId(null);
      toast.error('ページ化に失敗しました: ' + error.message);
    },
  });

  // ドラッグ終了時の処理
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localBlocks.findIndex(b => b.id === active.id);
    const newIndex = localBlocks.findIndex(b => b.id === over.id);

    // ローカル配列を更新
    const newBlocks = arrayMove(localBlocks, oldIndex, newIndex);
    setLocalBlocks(newBlocks);

    // sort_orderを再計算
    const updates = newBlocks.map((block, index) => ({
      id: block.id,
      sort_order: index,
    }));

    // DBに保存
    reorderMutation.mutate(updates);
  };

  if (localBlocks.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p className="text-sm">ブロックなし</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {localBlocks.map(block => (
              <BlockItem
                key={block.id}
                block={block}
                onEdit={(b) => {
                  // 編集機能はPageBlocksListで実装
                  window.dispatchEvent(
                    new CustomEvent('editBlock', { detail: b })
                  );
                }}
                onDelete={setDeleteTarget}
                onConvert={(b) => {
                  setConvertingId(b.id);
                  convertMutation.mutate(b.id);
                }}
                isConverting={convertingId === block.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ブロック削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.block_type}」ブロックを削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}