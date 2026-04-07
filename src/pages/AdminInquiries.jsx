import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, MessageSquare, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  new: { label: '新着', variant: 'default', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  read: { label: '確認済', variant: 'secondary', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  replied: { label: '返信済', variant: 'secondary', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

export default function AdminInquiries() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['inquiries', siteId],
    queryFn: () => siteId
      ? base44.entities.Inquiry.filter({ site_id: siteId }, '-created_date', 100)
      : base44.entities.Inquiry.list('-created_date', 100),
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Inquiry.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquiries'] }),
  });

  const getSiteName = (siteId) => sites.find(s => s.id === siteId)?.site_name || '-';
  const newCount = inquiries.filter(i => i.status === 'new').length;

  const handleOpen = (inquiry) => {
    setSelected(inquiry);
    if (inquiry.status === 'new') {
      updateMutation.mutate({ id: inquiry.id, status: 'read' });
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="お問い合わせ管理">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">問い合わせ一覧</h2>
            {newCount > 0 && (
              <p className="text-sm text-blue-600 mt-1">新着 {newCount} 件</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>問い合わせはまだありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">名前</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium hidden md:table-cell">メール</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">サイト</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">ステータス</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">日時</th>
                  <th className="text-right px-4 py-3 text-slate-600 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map(inquiry => {
                  const sc = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.new;
                  return (
                    <tr key={inquiry.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleOpen(inquiry)}>
                      <td className="px-4 py-3 font-medium text-slate-800">{inquiry.name}</td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{inquiry.email}</td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{getSiteName(inquiry.site_id)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${sc.className} border text-xs`}>{sc.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                        {inquiry.created_date ? new Date(inquiry.created_date).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <Select value={inquiry.status} onValueChange={val => updateMutation.mutate({ id: inquiry.id, status: val })}>
                          <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">新着</SelectItem>
                            <SelectItem value="read">確認済</SelectItem>
                            <SelectItem value="replied">返信済</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>問い合わせ詳細</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">お名前</p>
                    <p className="font-medium text-slate-800">{selected.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">サイト</p>
                    <p className="text-slate-700">{getSiteName(selected.site_id)}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-xs text-slate-400 mb-1">メールアドレス</p>
                  <a href={`mailto:${selected.email}`} className="text-amber-600 hover:underline flex items-center gap-1">
                    <Mail className="w-3 h-3" />{selected.email}
                  </a>
                </div>
                <div className="text-sm">
                  <p className="text-xs text-slate-400 mb-1">メッセージ</p>
                  <p className="text-slate-700 whitespace-pre-line bg-slate-50 rounded-lg p-4">{selected.message}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-slate-400">
                    {selected.created_date ? new Date(selected.created_date).toLocaleString('ja-JP') : '-'}
                  </span>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500">ステータス:</span>
                    <Select
                      value={selected.status}
                      onValueChange={val => {
                        updateMutation.mutate({ id: selected.id, status: val });
                        setSelected({ ...selected, status: val });
                      }}
                    >
                      <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">新着</SelectItem>
                        <SelectItem value="read">確認済</SelectItem>
                        <SelectItem value="replied">返信済</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </UserLayout>
    </ProtectedRoute>
  );
}