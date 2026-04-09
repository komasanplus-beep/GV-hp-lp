import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Globe, Pencil, Trash2, Loader2, ExternalLink, FileText, ArrowRight, Eye, Calendar, BookOpen, MessageSquare, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

function AdminSiteListContent() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [editSite, setEditSite] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();
  const { plan, usage, isAtSiteLimit } = usePlan();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: sitesRaw, isLoading, error: sitesError } = useQuery({
    queryKey: ['sites', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const res = await base44.functions.invoke('getAdminSiteList', {});
        console.log('[AdminSiteList] response:', res);
        // レスポンスが配列ならそのまま、オブジェクトなら items を取り出す
        if (Array.isArray(res)) return res;
        if (res?.data?.items && Array.isArray(res.data.items)) return res.data.items;
        if (res?.items && Array.isArray(res.items)) return res.items;
        return [];
      } catch (err) {
        console.error('[AdminSiteList] getAdminSiteList failed:', err);
        return [];
      }
    },
    enabled: !!currentUser,
    staleTime: 5000,
  });
  
  // 常に配列を保証
  const sites = Array.isArray(sitesRaw) ? sitesRaw : [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Site.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setEditSite(null);
      toast.success('サイトを更新しました');
    },
    onError: (error) => {
      console.error('[AdminSiteList] update failed:', error);
      toast.error(`更新に失敗しました: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      console.log('[AdminSiteList] deleting site via backend function:', id);
      const result = await base44.functions.invoke('deleteSiteById', { siteId: id });
      if (!result.data?.success) {
        throw new Error(result.data?.error || '削除に失敗しました');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('削除しました');
    },
    onError: (error) => {
      console.error('[AdminSiteList] delete failed:', error);
      toast.error(`削除に失敗しました: ${error.message}`);
    },
  });
  
  // 削除確認ダイアログ用
  const [deleteConfirmSite, setDeleteConfirmSite] = useState(null);

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
          {/* ── エラー表示 ── */}
          {sitesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">サイト一覧の読み込みに失敗しました</p>
                <p className="text-xs text-red-600 mt-1">{sitesError.message}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">サイト一覧</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {usage.site_count || 0} / {(plan.max_sites ?? 1) === -1 ? '∞' : (plan.max_sites ?? 1)} 件使用中
              </p>
            </div>
            <Button
              onClick={() => setWizardOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              disabled={isAtSiteLimit || wizardLoading}
              title={isAtSiteLimit ? 'サイト作成数の上限に達しています' : ''}
            >
              <Plus className="w-4 h-4" />新規サイト作成
            </Button>
          </div>

          {isAtSiteLimit && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                サイト作成数の上限（{plan.max_sites ?? 1}件）に達しています。プランをアップグレードしてください。
              </p>
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
                <Button onClick={() => setWizardOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Plus className="w-4 h-4" />最初のサイトを作成
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sites.map((site) => (
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteConfirmSite(site)}
                          disabled={deleteMutation.isPending}
                        >
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

        {/* ── Wizard Dialog（1系統化） ── */}
        <Dialog open={wizardOpen} onOpenChange={(open) => !wizardLoading && setWizardOpen(open)}>
          <DialogContent className="max-w-lg" onPointerDownOutside={(e) => wizardLoading && e.preventDefault()} onEscapeKeyDown={(e) => wizardLoading && e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>新規サイト作成</DialogTitle>
              <DialogDescription>テンプレートを選択してサイトを作成します</DialogDescription>
            </DialogHeader>
            <SiteCreateWizard
              onLoadingChange={setWizardLoading}
              onComplete={(site) => {
                toast.success(`「${site.site_name}」を作成しました`);
                queryClient.invalidateQueries({ queryKey: ['sites'] });
                setWizardOpen(false);
                setWizardLoading(false);
              }}
              onCancel={() => !wizardLoading && setWizardOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* ── Edit Dialog（1系統化） ── */}
        <Dialog open={!!editSite} onOpenChange={(open) => !open && setEditSite(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>サイトを編集</DialogTitle>
              <DialogDescription>サイト名を変更します</DialogDescription>
            </DialogHeader>
            {editSite && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">サイト名</label>
                  <Input
                    value={editForm.site_name || ''}
                    onChange={e => setEditForm(p => ({ ...p, site_name: e.target.value }))}
                    placeholder="サイト名を入力"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditSite(null)} disabled={updateMutation.isPending}>
                    キャンセル
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => updateMutation.mutate({ id: editSite.id, data: { site_name: editForm.site_name } })}
                    disabled={updateMutation.isPending || !editForm.site_name?.trim()}
                  >
                    {updateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />更新中</> : '更新'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm Dialog ── */}
        <Dialog 
          open={!!deleteConfirmSite} 
          onOpenChange={(open) => {
            if (!open) setDeleteConfirmSite(null);
          }}
        >
          {deleteConfirmSite && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  サイトを削除しますか？
                </DialogTitle>
                <DialogDescription>
                  「{deleteConfirmSite.site_name}」を削除します。この操作は元に戻せません。
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setDeleteConfirmSite(null)}
                  disabled={deleteMutation.isPending}
                >
                  キャンセル
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    deleteMutation.mutate(deleteConfirmSite.id, {
                      onSuccess: () => setDeleteConfirmSite(null),
                      onError: () => setDeleteConfirmSite(null),
                    });
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />削除中...</>
                  ) : (
                    <><Trash2 className="w-4 h-4 mr-2" />削除する</>
                  )}
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </UserLayout>
    </ProtectedRoute>
  );
}

export default function AdminSiteList() {
  return (
    <ErrorBoundary>
      <AdminSiteListContent />
    </ErrorBoundary>
  );
}