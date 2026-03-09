import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Trash2 } from 'lucide-react';

const STATUS_MAP = {
  pending: { label: '確認待ち', cls: 'bg-yellow-100 text-yellow-700' },
  verified: { label: '確認済み', cls: 'bg-green-100 text-green-700' },
  failed: { label: '失敗', cls: 'bg-red-100 text-red-700' },
};

export default function MasterDomainList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['masterDomains'],
    queryFn: () => base44.entities.DomainMapping.list('-created_date', 200),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['masterUsersForDomain'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DomainMapping.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterDomains'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DomainMapping.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterDomains'] }),
  });

  const getUserEmail = (userId) => users.find(u => u.id === userId)?.email || userId || '-';

  const filtered = domains.filter(d =>
    (d.domain || d.subdomain || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MasterLayout title="ドメイン一覧">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">ドメイン管理</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ドメイン名で検索..." className="pl-9" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span className="col-span-2">ドメイン</span>
          <span>種別</span>
          <span>オーナー</span>
          <span>ステータス</span>
        </div>
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">ドメインが登録されていません</div>
        ) : (
          filtered.map(d => {
            const st = STATUS_MAP[d.verification_status] || STATUS_MAP.pending;
            return (
              <div key={d.id} className="grid grid-cols-5 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 text-sm items-center">
                <span className="col-span-2 font-mono text-slate-800">{d.domain || d.subdomain}</span>
                <Badge className={d.domain_type === 'custom_domain' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}>
                  {d.domain_type === 'custom_domain' ? '独自' : 'サブ'}
                </Badge>
                <span className="text-slate-500 text-xs truncate">{getUserEmail(d.user_id)}</span>
                <div className="flex items-center gap-2">
                  <Badge className={st.cls}>{st.label}</Badge>
                  {d.verification_status === 'pending' && (
                    <button className="text-slate-400 hover:text-violet-600"
                      onClick={() => updateMutation.mutate({ id: d.id, data: { verification_status: 'verified' } })}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button className="text-slate-300 hover:text-red-500"
                    onClick={() => deleteMutation.mutate(d.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="text-xs text-slate-400 mt-3">計 {filtered.length} 件</p>
    </MasterLayout>
  );
}