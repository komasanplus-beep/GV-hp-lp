import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SiteBlockEditForm from '@/components/site/SiteBlockEditForm';
import { Plus, Trash2, Pencil, Loader2, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SITE_BLOCK_TYPES = [
  'Hero', 'About', 'Menu', 'Staff', 'Gallery',
  'Voice', 'Feature', 'FAQ', 'Access', 'Service', 'Contact', 'Booking', 'CTA', 'Campaign', 'Custom',
];

const BLOCK_COLORS = {
  Hero: 'bg-purple-50 border-purple-200 text-purple-700',
  About: 'bg-blue-50 border-blue-200 text-blue-700',
  Menu: 'bg-amber-50 border-amber-200 text-amber-700',
  Staff: 'bg-pink-50 border-pink-200 text-pink-700',
  Gallery: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  Voice: 'bg-rose-50 border-rose-200 text-rose-700',
  Feature: 'bg-cyan-50 border-cyan-200 text-cyan-700',
  FAQ: 'bg-orange-50 border-orange-200 text-orange-700',
  Access: 'bg-teal-50 border-teal-200 text-teal-700',
  Service: 'bg-green-50 border-green-200 text-green-700',
  Contact: 'bg-slate-50 border-slate-200 text-slate-700',
  Booking: 'bg-lime-50 border-lime-200 text-lime-700',
  CTA: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Campaign: 'bg-red-50 border-red-200 text-red-700',
  Custom: 'bg-gray-50 border-gray-200 text-gray-700',
};

export default function SiteBlockEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get('page_id');
  const siteId = urlParams.get('site_id');

  const [editingBlock, setEditingBlock] = useState(null);
  const [addBlockType, setAddBlockType] = useState('Hero');
  const [showAddBlock, setShowAddBlock] = useState(false);
  const queryClient = useQueryClient();

  const { data: page } = useQuery({
    queryKey: ['sitePage', pageId],
    queryFn: () => base44.entities.SitePage.filter({ id: pageId }).then(r => r[0]),
    enabled: !!pageId,
  });

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['siteBlocks', pageId],
    queryFn: () => base44.entities.SiteBlock.filter({ page_id: pageId }, 'sort_order'),
    enabled: !!pageId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SiteBlock.create({
        site_id: siteId,
        page_id: pageId,
        block_type: addBlockType,
        sort_order: blocks.length,
        data: {},
        user_id: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteBlocks', pageId] });
      setShowAddBlock(false);
      toast.success('ブロックを追加しました');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SiteBlock.update(id, { data }),
    onSuccess: () => {
      // 複数の query を無効化してキャッシュを確実にリフレッシュ
      queryClient.invalidateQueries({ queryKey: ['siteBlocks'] });
      queryClient.invalidateQueries({ queryKey: ['siteViewData'] });
      queryClient.invalidateQueries({ queryKey: ['sitePage'] });
      setEditingBlock(null);
      toast.success('保存しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SiteBlock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteBlocks'] });
      queryClient.invalidateQueries({ queryKey: ['siteViewData'] });
      toast.success('削除しました');
    },
  });

  const moveBlock = async (block, direction) => {
    const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(b => b.id === block.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    await base44.entities.SiteBlock.update(sorted[idx].id, { sort_order: sorted[swapIdx].sort_order });
    await base44.entities.SiteBlock.update(sorted[swapIdx].id, { sort_order: sorted[idx].sort_order });
    queryClient.invalidateQueries({ queryKey: ['siteBlocks', pageId] });
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="ブロック編集">
        <div className="max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`${createPageUrl('SitePageManager')}?site_id=${siteId}`}>
                <Button variant="outline" size="icon">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {page ? page.title : 'ブロック編集'}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">ブロックを並べてページを構成します</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddBlock(true)}
              className="bg-amber-600 hover:bg-amber-700 gap-2"
            >
              <Plus className="w-4 h-4" />ブロック追加
            </Button>
          </div>

          {/* Block list */}
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : blocks.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <p className="font-medium">ブロックがありません</p>
                <p className="text-sm mt-1 mb-4">「ブロック追加」からページを構成してください</p>
                <Button onClick={() => setShowAddBlock(true)} className="bg-amber-600 hover:bg-amber-700 gap-2">
                  <Plus className="w-4 h-4" />ブロックを追加
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...blocks].sort((a, b) => a.sort_order - b.sort_order).map((block, idx) => (
                <div
                  key={block.id}
                  className={cn(
                    "border-2 rounded-xl p-4 flex items-center gap-4",
                    BLOCK_COLORS[block.block_type] || 'bg-slate-50 border-slate-200 text-slate-700'
                  )}
                >
                  {/* Order badge */}
                  <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-xs font-bold flex-shrink-0 border">
                    {idx + 1}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-sm">{block.block_type}</p>
                    {block.data && Object.keys(block.data).length > 0 && (
                      <p className="text-xs opacity-60 mt-0.5 truncate">
                        {Object.entries(block.data).filter(([, v]) => v).slice(0, 2).map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`).join(' / ')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost" size="icon"
                      className="w-7 h-7 text-current opacity-60 hover:opacity-100"
                      onClick={() => moveBlock(block, -1)} disabled={idx === 0}
                      title="上に移動"
                    >
                      <ChevronUp className="w-5 h-5 font-bold" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="w-7 h-7 text-current opacity-60 hover:opacity-100"
                      onClick={() => moveBlock(block, 1)} disabled={idx === blocks.length - 1}
                      title="下に移動"
                    >
                      <ChevronDown className="w-5 h-5 font-bold" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="w-7 h-7 text-current opacity-70 hover:opacity-100"
                      onClick={() => setEditingBlock(block)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="w-7 h-7 hover:text-red-600"
                      onClick={() => deleteMutation.mutate(block.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add block dialog */}
        <Dialog open={showAddBlock} onOpenChange={setShowAddBlock}>
          <DialogContent className="max-w-sm">
            <h3 className="font-semibold text-slate-800 text-base mb-4">ブロックを追加</h3>
            <div className="space-y-3">
              <Select value={addBlockType} onValueChange={setAddBlockType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SITE_BLOCK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddBlock(false)}>キャンセル</Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={() => addMutation.mutate()}
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '追加'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit block dialog */}
        {editingBlock && (
          <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <SiteBlockEditForm
                block={editingBlock}
                onSave={(data) => updateMutation.mutate({ id: editingBlock.id, data })}
                onCancel={() => setEditingBlock(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </UserLayout>
    </ProtectedRoute>
  );
}