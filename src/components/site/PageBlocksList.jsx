/**
 * PageBlocksList
 * ページ内のブロック一覧表示・管理
 * ドラッグ&ドロップで並び替え、追加・削除・編集機能
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Pencil, GripVertical, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const BLOCK_TYPES = [
  'Hero', 'About', 'Menu', 'Service', 'Staff', 'Gallery', 'Voice', 'Feature',
  'FAQ', 'Access', 'Contact', 'CTA', 'Campaign', 'Booking', 'Custom'
];

export default function PageBlocksList({ pageId, siteId, onUpdate }) {
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState('Hero');
  const [editingBlock, setEditingBlock] = useState(null);
  const [deleteBlock, setDeleteBlock] = useState(null);
  const queryClient = useQueryClient();

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['blocks', pageId],
    queryFn: () => base44.entities.SiteBlock.filter({ page_id: pageId }, 'sort_order'),
    enabled: !!pageId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SiteBlock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
      setIsAddingBlock(false);
      toast.success('ブロックを追加しました');
      onUpdate?.();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SiteBlock.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
      toast.success('更新しました');
      onUpdate?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SiteBlock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
      setDeleteBlock(null);
      toast.success('削除しました');
      onUpdate?.();
    },
  });

  const handleAddBlock = () => {
    const maxSortOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.sort_order || 0)) : -1;
    createMutation.mutate({
      page_id: pageId,
      site_id: siteId,
      block_type: selectedBlockType,
      sort_order: maxSortOrder + 1,
      data: {},
    });
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const newBlocks = Array.from(blocks);
    const [movedBlock] = newBlocks.splice(source.index, 1);
    newBlocks.splice(destination.index, 0, movedBlock);

    // sort_order を再計算して更新
    newBlocks.forEach((block, idx) => {
      if (block.sort_order !== idx) {
        updateMutation.mutate({ id: block.id, data: { sort_order: idx } });
      }
    });
  };

  if (isLoading) {
    return <div className="text-sm text-slate-400 py-4 px-4">読み込み中...</div>;
  }

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
          <ChevronDown className="w-4 h-4" />
          ブロック ({blocks.length})
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAddingBlock(true)}
          className="gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          追加
        </Button>
      </div>

      {/* Block List */}
      {blocks.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          <p>ブロックなし</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded p-2' : ''}`}
              >
                {blocks.map((block, idx) => (
                  <Draggable key={block.id} draggableId={block.id} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-2 p-3 bg-white rounded border transition-all ${
                          snapshot.isDragging
                            ? 'shadow-lg border-blue-300 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Drag Handle */}
                        <div {...provided.dragHandleProps} className="cursor-grab">
                          <GripVertical className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        </div>

                        {/* Block Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            {block.block_type}
                          </p>
                          {block.data?.title && (
                            <p className="text-xs text-slate-500 truncate">
                              {block.data.title}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingBlock(block)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteBlock(block)}
                          className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add Block Dialog */}
      <Dialog open={isAddingBlock} onOpenChange={setIsAddingBlock}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ブロック追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                ブロックタイプ
              </label>
              <select
                value={selectedBlockType}
                onChange={(e) => setSelectedBlockType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BLOCK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsAddingBlock(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleAddBlock}
                disabled={createMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending ? '追加中...' : '追加'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBlock} onOpenChange={() => setDeleteBlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ブロック削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteBlock?.block_type}」ブロックを削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteBlock.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}