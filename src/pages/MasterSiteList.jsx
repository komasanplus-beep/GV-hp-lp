import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

const BUSINESS_LABELS = {
  hair_salon: 'ヘアサロン', beauty_salon: '美容サロン', nail_salon: 'ネイルサロン',
  esthetic: 'エステ', relaxation: 'リラクゼーション', gym: 'ジム', clinic: 'クリニック',
  school: 'スクール', other: 'その他',
};

export default function MasterSiteList() {
  const [search, setSearch] = useState('');

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['masterSites'],
    queryFn: () => base44.entities.Site.list('-created_date', 200),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['masterUsersForSite'],
    queryFn: () => base44.entities.User.list(),
  });

  const getUserEmail = (userId) => users.find(u => u.id === userId)?.email || userId;

  const filtered = sites.filter(s =>
    (s.site_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.user_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MasterLayout title="サイト一覧">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">全サイト一覧</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="サイト名・ユーザーで検索..." className="pl-9" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>サイト名</span>
          <span>オーナー</span>
          <span>業種</span>
          <span>ステータス</span>
        </div>
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">サイトが見つかりません</div>
        ) : (
          filtered.map(site => (
            <div key={site.id} className="grid grid-cols-4 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 text-sm items-center">
              <span className="font-medium text-slate-800">{site.site_name}</span>
              <span className="text-slate-500 text-xs truncate">{getUserEmail(site.user_id)}</span>
              <span className="text-slate-600">{BUSINESS_LABELS[site.business_type] || site.business_type}</span>
              <Badge className={site.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                {site.status === 'published' ? '公開' : '下書き'}
              </Badge>
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-slate-400 mt-3">計 {filtered.length} 件</p>
    </MasterLayout>
  );
}