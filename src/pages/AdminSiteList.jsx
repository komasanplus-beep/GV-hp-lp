import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Plus, Globe, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const BUSINESS_TYPES = [
  { value: 'hair_salon', label: '美容室・ヘアサロン' },
  { value: 'beauty_salon', label: 'エステサロン' },
  { value: 'nail_salon', label: 'ネイルサロン' },
  { value: 'esthetic_salon', label: 'アイラッシュ・ブロウ' },
  { value: 'relaxation', label: 'リラクゼーション・整体' },
  { value: 'clinic', label: 'クリニック・医院' },
  { value: 'gym', label: 'パーソナルジム・スクール' },
  { value: 'school', label: 'スクール・教室' },
  { value: 'other', label: 'その他' },
];

const defaultForm = {
  site_name: '',
  business_type: 'hair_salon',
  subdomain: '',
  status: 'draft',
};

export default function AdminSiteList() {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-created_date'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['siteTemplates'],
    queryFn: () => base44.entities.SiteTemplate.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const payload = { ...data, user_id: user.id };
      return editing?.id
        ? base44.entities.Site.update(editing.id, payload)
        : base44.entities.Site.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setShowDialog(false);
      setEditing(null);
      setForm(defaultForm);
      toast.success(editing ? 'サイトを更新しました' : 'サイトを作成しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Site.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('削除しました');
    },
  });

  const openEdit = (site) => {
    setEditing(site);
    setForm({ site_name: site.site_name, business_type: site.business_type || 'hair_salon', subdomain: site.subdomain || '', status: site.status || 'draft' });
    setShowDialog(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowDialog(true);
  };

  const businessLabel = (val) => BUSINESS_TYPES.find(t => t.value === val)?.label || val;

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="サイト管理">
        <div className="max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">ホームページ一覧</h2>
              <p className="text-sm text-slate-500 mt-0.5">ユーザーのホームページを管理します</p>
            </div>
            <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Plus className="w-4 h-4" />新規サイト作成
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : sites.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">サイトがまだありません</p>
                <p className="text-sm mt-1">「新規サイト作成」から始めましょう</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sites.map(site => (
                <Card key={site.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4 px-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800 truncate">{site.site_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${site.status === 'published' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                          {site.status === 'published' ? '公開中' : '下書き'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        <span>{businessLabel(site.business_type)}</span>
                        {site.subdomain && <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />{site.subdomain}</span>}
                        {site.domain && <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />{site.domain}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(site)}>
                        <Pencil className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(site.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'サイトを編集' : '新規サイト作成'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">サイト名 *</label>
                <Input value={form.site_name} onChange={e => setForm(p => ({ ...p, site_name: e.target.value }))} placeholder="My Salon" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">業種</label>
                <Select value={form.business_type} onValueChange={val => setForm(p => ({ ...p, business_type: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">サブドメイン</label>
                <div className="flex items-center gap-2">
                  <Input value={form.subdomain} onChange={e => setForm(p => ({ ...p, subdomain: e.target.value }))} placeholder="my-salon" />
                  <span className="text-sm text-slate-400 whitespace-nowrap">.service.com</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ステータス</label>
                <Select value={form.status} onValueChange={val => setForm(p => ({ ...p, status: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">下書き</SelectItem>
                    <SelectItem value="published">公開</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>キャンセル</Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => saveMutation.mutate(form)}
                  disabled={!form.site_name || saveMutation.isPending}
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? '更新' : '作成')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </UserLayout>
    </ProtectedRoute>
  );
}