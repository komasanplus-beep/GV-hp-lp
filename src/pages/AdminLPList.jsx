import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from '@/components/user/UserLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Eye, Globe } from 'lucide-react';
import LPDomainSettingDialog from '@/components/lp/LPDomainSettingDialog';
import { usePlan } from '@/components/plan/usePlan';
import LPCreationFlow from '@/components/lp/LPCreationFlow';

export default function AdminLPList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreationFlow, setShowCreationFlow] = useState(false);
  const [domainSettingLP, setDomainSettingLP] = useState(null);

  const { plan, usage, isAtLPLimit } = usePlan();

  const { data: pages = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date'),
  });

  const atLimit = isAtLPLimit;

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LandingPage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landingPages'] }),
  });

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="LP管理">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">ランディングページ一覧</h2>
            <p className="text-xs text-slate-400 mt-1">
              {usage.lp_count} / {plan.max_lp === -1 ? '∞' : plan.max_lp} 件使用中
            </p>
          </div>
          <Button
            onClick={() => setShowCreationFlow(true)}
            className="bg-amber-600 hover:bg-amber-700"
            disabled={atLimit}
            title={atLimit ? 'LP作成数の上限に達しています' : ''}
          >
            <Plus className="w-4 h-4 mr-2" />新規作成
          </Button>
        </div>
        {atLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            LP作成数の上限（{plan.max_lp}件）に達しています。プランをアップグレードしてください。
          </div>
        )}
        {pages.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg mb-2">LPがまだありません</p>
            <p className="text-sm">「新規作成」からLPを作成してください</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pages.map((lp) => (
              <div key={lp.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-slate-800">{lp.title}</span>
                    <Badge variant={lp.status === 'published' ? 'default' : 'secondary'}>
                      {lp.status === 'published' ? '公開中' : '下書き'}
                    </Badge>
                    {lp.source_type === 'pasted_code' && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        コード貼り付け
                      </Badge>
                    )}
                    {lp.template_type && lp.template_type !== 'custom' && (
                      <Badge variant="outline" className="text-xs">
                        {lp.template_type}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-slate-400">/lp/{lp.slug}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" title="公開URL設定" onClick={() => setDomainSettingLP(lp)}>
                    <Globe className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" title="プレビュー" asChild>
                    <a href={`/lp/${lp.slug}?preview=true`} target="_blank" rel="noreferrer">
                      <Eye className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" title="編集" asChild>
                    <Link to={createPageUrl(`AdminLPEditor?id=${lp.id}`)}>
                      <Pencil className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-red-500 hover:text-red-700"
                    title="削除"
                    onClick={() => deleteMutation.mutate(lp.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <LPCreationFlow
          open={showCreationFlow}
          onOpenChange={setShowCreationFlow}
          disabled={atLimit}
        />
        <LPDomainSettingDialog
          lp={domainSettingLP}
          open={!!domainSettingLP}
          onOpenChange={(v) => { if (!v) setDomainSettingLP(null); }}
        />
      </UserLayout>
    </ProtectedRoute>
  );
}