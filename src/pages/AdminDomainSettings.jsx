import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Plus, Link2, CheckCircle2, Clock, Trash2, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminDomainSettings() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ site_id: '', domain: '', domain_type: 'subdomain' });
  const queryClient = useQueryClient();

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['domainMappings'],
    queryFn: () => base44.entities.DomainMapping.list(),
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.DomainMapping.create({ ...data, user_id: user.id, verification_status: 'pending' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domainMappings'] });
      setShowDialog(false);
      setForm({ site_id: '', domain: '', domain_type: 'subdomain' });
      toast.success('ドメインを追加しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DomainMapping.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domainMappings'] });
      toast.success('削除しました');
    },
  });

  const verifMutation = useMutation({
    mutationFn: (id) => base44.entities.DomainMapping.update(id, { verification_status: 'verified' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domainMappings'] });
      toast.success('確認済みにしました');
    },
  });

  const getSiteName = (id) => sites.find(s => s.id === id)?.site_name || id;

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="ドメイン設定">
        <div className="max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">ドメイン設定</h2>
              <p className="text-sm text-slate-500 mt-0.5">サブドメインまたは独自ドメインを設定します</p>
            </div>
            <Button onClick={() => setShowDialog(true)} className="bg-slate-800 hover:bg-slate-700 gap-2">
              <Plus className="w-4 h-4" />ドメインを追加
            </Button>
          </div>

          {/* 説明 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4 px-5">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-semibold">ドメイン設定の手順</p>
                  <p><strong>サブドメイン：</strong> 管理者がサブドメインを割り当てます（例: your-salon.service.com）</p>
                  <p><strong>独自ドメイン：</strong> お使いのドメインのCNAMEレコードを <code className="bg-blue-100 px-1 rounded">cname.service.com</code> に向けてください</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : domains.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">ドメインが設定されていません</p>
                <p className="text-sm mt-1">「ドメインを追加」から設定を始めましょう</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {domains.map(d => (
                <Card key={d.id}>
                  <CardContent className="py-4 px-5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800">{d.domain}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${d.domain_type === 'custom' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          {d.domain_type === 'custom' ? '独自ドメイン' : 'サブドメイン'}
                        </span>
                        {d.verification_status === 'verified' ? (
                          <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />確認済み</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600"><Clock className="w-3.5 h-3.5" />確認待ち</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">サイト: {getSiteName(d.site_id)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {d.verification_status !== 'verified' && (
                        <Button variant="outline" size="sm" onClick={() => verifMutation.mutate(d.id)} disabled={verifMutation.isPending}>
                          確認済みにする
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(d.id)}>
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
              <DialogTitle>ドメインを追加</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">対象サイト</label>
                <Select value={form.site_id} onValueChange={val => setForm(p => ({ ...p, site_id: val }))}>
                  <SelectTrigger><SelectValue placeholder="サイトを選択" /></SelectTrigger>
                  <SelectContent>
                    {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ドメイン種別</label>
                <Select value={form.domain_type} onValueChange={val => setForm(p => ({ ...p, domain_type: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subdomain">サブドメイン（例: your-salon.service.com）</SelectItem>
                    <SelectItem value="custom">独自ドメイン（例: example.com）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  {form.domain_type === 'custom' ? 'ドメイン名' : 'サブドメイン'}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.domain}
                    onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                    placeholder={form.domain_type === 'custom' ? 'example.com' : 'your-salon'}
                  />
                  {form.domain_type === 'subdomain' && <span className="text-sm text-slate-400 whitespace-nowrap">.service.com</span>}
                </div>
              </div>
              {form.domain_type === 'custom' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  独自ドメインを使用する場合、DNSのCNAMEレコードを <strong>cname.service.com</strong> に設定してください。
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>キャンセル</Button>
                <Button
                  className="flex-1 bg-slate-800 hover:bg-slate-700"
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.site_id || !form.domain || createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '追加'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </UserLayout>
    </ProtectedRoute>
  );
}