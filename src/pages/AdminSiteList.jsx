import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Globe, Pencil, Trash2, Loader2, ExternalLink, FileText, ArrowRight, Eye, Calendar, BookOpen, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SiteCreateWizard from '@/components/site/SiteCreateWizard';
import { toast } from 'sonner';
import { usePlan } from '@/components/plan/usePlan';

const BUSINESS_TYPES = [
  { value: 'hair_salon', label: '美容室・ヘアサロン' },
  { value: 'beauty_salon', label: 'エステサロン' },
  { value: 'nail_salon', label: 'ネイルサロン' },
  { value: 'esthetic', label: 'アイラッシュ・ブロウ' },
  { value: 'relaxation', label: 'リラクゼーション・整体' },
  { value: 'clinic', label: 'クリニック・医院' },
  { value: 'gym', label: 'パーソナルジム' },
  { value: 'school', label: 'スクール・教室' },
  { value: 'other', label: 'その他' },
];

export default function AdminSiteList() {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [editSite, setEditSite] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();
  const { plan, usage, isAtSiteLimit } = usePlan();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites', currentUser?.id],
    queryFn: () => currentUser
      ? base44.entities.Site.filter({ user_id: currentUser.id }, '-created_date')
      : Promise.resolve([]),
    enabled: !!currentUser,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Site.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setEditSite(null);
      toast.success('サイトを更新しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Site.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('削除しました');
    },
  });

  const businessLabel = (val) => BUSINESS_TYPES.find(t => t.value === val)?.label || val;

  const FEATURE_BADGES = [
    { key: 'booking',  Icon: Calendar,      label: '予約',   color: 'text-blue-500' },
    { key: 'blog',     Icon: BookOpen,      label: 'ブログ', color: 'text-emerald-500' },
    { key: 'inquiry',  Icon: MessageSquare, label: '問い合わせ', color: 'text-amber-500' },
    { key: 'customer', Icon: Users,         label: '顧客',   color: 'text-purple-500' },
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="サイト管理">
        <div className="max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">サイト一覧</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {usage.site_count || 0} / {(plan.max_sites ?? 1) === -1 ? '∞' : (plan.max_sites ?? 1)} 件使用中
              </p>
            </div>
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              disabled={isAtSiteLimit}
              title={isAtSiteLimit ? 'サイト作成数の上限に達しています' : ''}
            >
              <Plus className="w-4 h-4" />新規サイト作成
            </Button>
          </div>

          {isAtSiteLimit && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              サイト作成数の上限（{plan.max_sites ?? 1}件）に達しています。プランをアップグレードしてください。
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : sites.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <Globe className="w-14 h-14 mx-auto mb-4 opacity-20" />
                <p className="font-semibold text-slate-600">サイトがまだありません</p>
                <p className="text-sm mt-1 mb-6">「新規サイト作成」からウィザードで簡単に作成できます</p>
                <Button onClick={() => setShowWizard(true)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Plus className="w-4 h-4" />最初のサイトを作成
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sites.map(site => (
                <Card key={site.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800 truncate">{site.site_name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${site.status === 'published' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            {site.status === 'published' ? '公開中' : '下書き'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                          <span>{businessLabel(site.business_type)}</span>
                          {site.subdomain && <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />{site.subdomain}</span>}
                          {site.enabled_features && FEATURE_BADGES.filter(b => site.enabled_features[b.key]).map(b => (
                            <span key={b.key} className={`flex items-center gap-0.5 ${b.color}`}>
                              <b.Icon className="w-3 h-3" />{b.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Link to={`${createPageUrl('SitePageManager')}?site_id=${site.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <FileText className="w-3.5 h-3.5" />ページ管理
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <a href={`${createPageUrl('SiteView')}?site_id=${site.id}&preview=true`} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" title="サイトをプレビュー（下書き含む）">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                        <Button variant="ghost" size="icon" onClick={() => { setEditSite(site); setEditForm({ site_name: site.site_name, business_type: site.business_type, status: site.status }); }}>
                          <Pencil className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(site.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Wizard Dialog — ローディング中は外側クリックで閉じない */}
        <Dialog open={showWizard} onOpenChange={(open) => { if (!wizardLoading) setShowWizard(open); }}>
          <DialogContent className="max-w-lg" onPointerDownOutside={(e) => { if (wizardLoading) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (wizardLoading) e.preventDefault(); }}>
            <DialogHeader>
              <DialogTitle>新規サイト作成</DialogTitle>
            </DialogHeader>
            <SiteCreateWizard
              onLoadingChange={setWizardLoading}
              onComplete={(site) => {
                queryClient.invalidateQueries({ queryKey: ['sites'] });
                queryClient.invalidateQueries({ queryKey: ['planUsage'] });
                setShowWizard(false);
                setWizardLoading(false);
              }}
              onCancel={() => { if (!wizardLoading) setShowWizard(false); }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editSite} onOpenChange={() => setEditSite(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>サイトを編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">サイト名</label>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={editForm.site_name || ''}
                  onChange={e => setEditForm(p => ({ ...p, site_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">業種</label>
                <Select value={editForm.business_type} onValueChange={val => setEditForm(p => ({ ...p, business_type: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ステータス</label>
                <Select value={editForm.status} onValueChange={val => setEditForm(p => ({ ...p, status: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">下書き</SelectItem>
                    <SelectItem value="published">公開</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditSite(null)}>キャンセル</Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => updateMutation.mutate({ id: editSite.id, data: editForm })}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '更新'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </UserLayout>
    </ProtectedRoute>
  );
}