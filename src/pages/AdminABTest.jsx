import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Copy, Play, Pause, ExternalLink, Trash2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  running: 'bg-green-100 text-green-700',
  stopped: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};
const STATUS_LABELS = { draft: '下書き', running: '実行中', stopped: '停止', completed: '完了' };

export default function AdminABTest() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLP, setSelectedLP] = useState('');

  const { data: lps = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date'),
  });
  const { data: experiments = [] } = useQuery({
    queryKey: ['lpExperiments'],
    queryFn: () => base44.entities.LPExperiments.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: async (lpAId) => {
      const lpA = lps.find(l => l.id === lpAId);
      const blocks = await base44.entities.LPBlock.filter({ lp_id: lpAId }, 'sort_order');

      const lpB = await base44.entities.LandingPage.create({
        title: `${lpA.title} - バリアントB`,
        slug: `${lpA.slug}-variant-b`,
        template_type: lpA.template_type,
        status: 'draft',
      });

      await Promise.all(blocks.map(b =>
        base44.entities.LPBlock.create({ lp_id: lpB.id, block_type: b.block_type, sort_order: b.sort_order, data: b.data })
      ));

      return base44.entities.LPExperiments.create({ lp_a_id: lpAId, lp_b_id: lpB.id, traffic_split: 50, status: 'draft' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpExperiments', 'landingPages'] });
      setShowCreate(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.LPExperiments.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lpExperiments'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LPExperiments.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lpExperiments'] }),
  });

  const getLPName = (id) => lps.find(l => l.id === id)?.title || id;

  return (
    <ProtectedRoute>
      <AdminLayout title="ABテスト">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">ABテスト管理</h2>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />新規ABテスト
          </Button>
        </div>

        {experiments.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Copy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ABテストがありません</p>
            <p className="text-sm mt-1">LPをコピーしてABテストを作成できます</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {experiments.map(exp => (
              <div key={exp.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={STATUS_COLORS[exp.status]}>{STATUS_LABELS[exp.status]}</Badge>
                      <span className="text-sm text-slate-500">トラフィック分割: A {exp.traffic_split}% / B {100 - exp.traffic_split}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {exp.status === 'draft' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatusMutation.mutate({ id: exp.id, status: 'running' })}>
                        <Play className="w-4 h-4 mr-1" />開始
                      </Button>
                    )}
                    {exp.status === 'running' && (
                      <Button size="sm" variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: exp.id, status: 'stopped' })}>
                        <Pause className="w-4 h-4 mr-1" />停止
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600"
                      onClick={() => deleteMutation.mutate(exp.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">パターン A</p>
                    <p className="text-sm text-slate-700 font-medium">{getLPName(exp.lp_a_id)}</p>
                    <div className="flex gap-1 mt-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link to={createPageUrl(`AdminLPEditor?id=${exp.lp_a_id}`)}>編集</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <a href={createPageUrl(`LPView?slug=${lps.find(l => l.id === exp.lp_a_id)?.slug}`)} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-amber-600 font-medium mb-1">パターン B</p>
                    <p className="text-sm text-slate-700 font-medium">{getLPName(exp.lp_b_id)}</p>
                    <div className="flex gap-1 mt-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link to={createPageUrl(`AdminLPEditor?id=${exp.lp_b_id}`)}>編集</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <a href={createPageUrl(`LPView?slug=${lps.find(l => l.id === exp.lp_b_id)?.slug}`)} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ABテスト作成</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label className="text-xs text-slate-500">ベースLP（パターンA）を選択</Label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                value={selectedLP} onChange={e => setSelectedLP(e.target.value)}>
                <option value="">選択してください</option>
                {lps.map(lp => <option key={lp.id} value={lp.id}>{lp.title}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-2">選択したLPをコピーしてパターンBを自動作成します</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>キャンセル</Button>
              <Button className="bg-amber-600 hover:bg-amber-700"
                disabled={!selectedLP || createMutation.isPending}
                onClick={() => createMutation.mutate(selectedLP)}>
                {createMutation.isPending ? '作成中...' : 'ABテスト作成'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}