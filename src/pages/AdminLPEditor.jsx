import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from '@/components/user/UserLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import BlockEditor from '@/components/lp/BlockEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  ChevronUp, ChevronDown, Pencil, Trash2, Plus, ExternalLink, ArrowLeft, Globe, FileText, Copy, Sparkles, FlaskConical
} from 'lucide-react';
import AIRegenerateButton from '@/components/lp/AIRegenerateButton';
import SEOAnalyzePanel from '@/components/lp/SEOAnalyzePanel';

const ALL_BLOCK_TYPES = ['Hero','Problem','Solution','Feature','Benefit','Evidence','Voice','CaseStudy','Flow','Comparison','FAQ','CTA','Future','Pricing','Profile','Gallery','Video','List','Campaign','Countdown','Contact'];

const BLOCK_COLORS = {
  Hero: 'bg-purple-100 text-purple-800',
  Problem: 'bg-red-100 text-red-800',
  Solution: 'bg-green-100 text-green-800',
  Feature: 'bg-blue-100 text-blue-800',
  Benefit: 'bg-sky-100 text-sky-800',
  Evidence: 'bg-yellow-100 text-yellow-800',
  Voice: 'bg-pink-100 text-pink-800',
  CaseStudy: 'bg-rose-100 text-rose-800',
  Flow: 'bg-cyan-100 text-cyan-800',
  Comparison: 'bg-orange-100 text-orange-800',
  FAQ: 'bg-indigo-100 text-indigo-800',
  CTA: 'bg-amber-100 text-amber-800',
  Future: 'bg-teal-100 text-teal-800',
  Pricing: 'bg-emerald-100 text-emerald-800',
  Profile: 'bg-violet-100 text-violet-800',
  Gallery: 'bg-fuchsia-100 text-fuchsia-800',
  Video: 'bg-red-100 text-red-800',
  List: 'bg-slate-100 text-slate-700',
  Campaign: 'bg-amber-100 text-amber-800',
  Countdown: 'bg-orange-100 text-orange-800',
  Contact: 'bg-green-100 text-green-800',
};

export default function AdminLPEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const lpId = urlParams.get('id');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingBlock, setEditingBlock] = useState(null);
  const [showAddBlock, setShowAddBlock] = useState(false);

  const { data: lp } = useQuery({
    queryKey: ['landingPage', lpId],
    queryFn: () => base44.entities.LandingPage.filter({ id: lpId }).then(r => r[0]),
    enabled: !!lpId,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['lpBlocks', lpId],
    queryFn: () => base44.entities.LPBlock.filter({ lp_id: lpId }, 'sort_order'),
    enabled: !!lpId,
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LPBlock.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lpBlocks', lpId] }),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id) => base44.entities.LPBlock.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lpBlocks', lpId] }),
  });

  const addBlockMutation = useMutation({
    mutationFn: (block_type) => base44.entities.LPBlock.create({
      lp_id: lpId,
      block_type,
      sort_order: blocks.length,
      data: {},
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpBlocks', lpId] });
      setShowAddBlock(false);
    },
  });

  const updateLPMutation = useMutation({
    mutationFn: (data) => base44.entities.LandingPage.update(lpId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landingPage', lpId] }),
  });

  const copyLPMutation = useMutation({
    mutationFn: async () => {
      const newLP = await base44.entities.LandingPage.create({
        title: `${lp.title} - コピー`,
        slug: `${lp.slug}-copy-${Date.now().toString(36)}`,
        template_type: lp.template_type,
        status: 'draft',
      });
      await Promise.all(blocks.map(b =>
        base44.entities.LPBlock.create({ lp_id: newLP.id, block_type: b.block_type, sort_order: b.sort_order, data: b.data })
      ));
      return newLP;
    },
    onSuccess: (newLP) => {
      queryClient.invalidateQueries({ queryKey: ['landingPages'] });
      navigate(createPageUrl(`AdminLPEditor?id=${newLP.id}`));
    },
  });

  const moveBlock = (index, direction) => {
    const newBlocks = [...blocks];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    newBlocks.forEach((b, i) => {
      updateBlockMutation.mutate({ id: b.id, data: { sort_order: i } });
    });
  };

  const handleSaveBlock = (blockData) => {
    updateBlockMutation.mutate({ id: editingBlock.id, data: { data: blockData } });
    setEditingBlock(null);
  };

  if (!lpId) return <div className="p-8 text-red-500">LP IDが指定されていません</div>;

  return (
    <ProtectedRoute>
      <AdminLayout title={lp?.title || 'LPエディタ'}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl('AdminLPList')}><ArrowLeft className="w-4 h-4 mr-1" />一覧へ</Link>
            </Button>
            <div>
              <h2 className="font-semibold text-slate-800">{lp?.title}</h2>
              <span className="text-sm text-slate-400">/lp/{lp?.slug}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl('AdminLPGenerate')}>
                <Sparkles className="w-4 h-4 mr-1" />AI生成
              </Link>
            </Button>
            <Button variant="outline" size="sm" disabled={copyLPMutation.isPending}
              onClick={() => copyLPMutation.mutate()}>
              <Copy className="w-4 h-4 mr-1" />{copyLPMutation.isPending ? '...' : 'コピー'}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={createPageUrl('AdminABTest')}>
                <FlaskConical className="w-4 h-4 mr-1" />ABテスト
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={createPageUrl(`LPView?slug=${lp?.slug}`)} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />プレビュー
              </a>
            </Button>
            {lp?.status === 'published' ? (
              <Button size="sm" variant="outline" className="text-slate-600"
                onClick={() => updateLPMutation.mutate({ status: 'draft' })}>
                <FileText className="w-4 h-4 mr-1" />下書きに戻す
              </Button>
            ) : (
              <Button size="sm" className="bg-green-600 hover:bg-green-700"
                onClick={() => updateLPMutation.mutate({ status: 'published' })}>
                <Globe className="w-4 h-4 mr-1" />公開する
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ブロック一覧 */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-700">ブロック構成</h3>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowAddBlock(true)}>
                <Plus className="w-4 h-4 mr-1" />ブロック追加
              </Button>
            </div>

            {blocks.map((block, index) => (
              <div key={block.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-slate-400 w-5 text-center">{index + 1}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${BLOCK_COLORS[block.block_type] || 'bg-slate-100 text-slate-600'}`}>
                  {block.block_type}
                </span>
                <div className="flex-1 text-sm text-slate-500 truncate">
                  {block.data?.headline || block.data?.title || block.data?.cta_text || '未編集'}
                </div>
                <div className="flex gap-1">
                  <AIRegenerateButton block={block} lpId={lpId} />
                  <Button variant="ghost" size="sm" onClick={() => setEditingBlock(block)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600"
                    onClick={() => deleteBlockMutation.mutate(block.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                ブロックがありません。追加してください。
              </div>
            )}
          </div>

          {/* LP設定 */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-medium text-slate-700 mb-4">LP設定</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-500">タイトル</Label>
                  <Input
                    defaultValue={lp?.title}
                    onBlur={e => updateLPMutation.mutate({ title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">スラッグ</Label>
                  <Input
                    defaultValue={lp?.slug}
                    onBlur={e => updateLPMutation.mutate({ slug: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-slate-600">ステータス</span>
                  <Badge variant={lp?.status === 'published' ? 'default' : 'secondary'}>
                    {lp?.status === 'published' ? '公開中' : '下書き'}
                  </Badge>
                </div>
              </div>
            </div>

            <SEOAnalyzePanel lpId={lpId} />

            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">使い方</p>
              <ul className="space-y-1 text-xs list-disc list-inside">
                <li>ブロックを追加・並び替えてLPを構成</li>
                <li>鉛筆アイコンでブロックを編集</li>
                <li>「公開する」でLPが公開されます</li>
                <li>URL: /lp/{lp?.slug}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ブロック編集ダイアログ */}
        <Dialog open={!!editingBlock} onOpenChange={open => !open && setEditingBlock(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {editingBlock && (
              <BlockEditor
                block={editingBlock}
                onSave={handleSaveBlock}
                onCancel={() => setEditingBlock(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* ブロック追加ダイアログ */}
        <Dialog open={showAddBlock} onOpenChange={setShowAddBlock}>
          <DialogContent className="max-w-lg">
            <h3 className="font-semibold text-slate-800 mb-4">ブロックを追加</h3>
            <div className="grid grid-cols-3 gap-2">
              {ALL_BLOCK_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => addBlockMutation.mutate(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80 ${BLOCK_COLORS[type] || 'bg-slate-100 text-slate-600'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}