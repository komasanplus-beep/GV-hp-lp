import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Search, ExternalLink } from 'lucide-react';

export default function MasterLPList() {
  const [search, setSearch] = useState('');

  const { data: lps = [], isLoading } = useQuery({
    queryKey: ['masterLPs'],
    queryFn: () => base44.entities.LandingPage.list('-created_date', 200),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['masterUsersForLP'],
    queryFn: () => base44.entities.User.list(),
  });

  const getUserEmail = (userId) => users.find(u => u.id === userId)?.email || userId || '-';

  const filtered = lps.filter(lp =>
    (lp.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (lp.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MasterLayout title="LP一覧">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">全LP一覧</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="タイトル・スラッグで検索..." className="pl-9" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>タイトル</span>
          <span>スラッグ</span>
          <span>オーナー</span>
          <span>ステータス</span>
        </div>
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">LPが見つかりません</div>
        ) : (
          filtered.map(lp => (
            <div key={lp.id} className="grid grid-cols-4 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 text-sm items-center">
              <span className="font-medium text-slate-800">{lp.title}</span>
              <span className="text-slate-500 font-mono text-xs">{lp.slug}</span>
              <span className="text-slate-500 text-xs truncate">{getUserEmail(lp.user_id)}</span>
              <Badge className={lp.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                {lp.status === 'published' ? '公開' : '下書き'}
              </Badge>
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-slate-400 mt-3">計 {filtered.length} 件</p>
    </MasterLayout>
  );
}