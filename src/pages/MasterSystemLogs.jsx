import React from 'react';
import MasterLayout from '@/components/master/MasterLayout';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

export default function MasterSystemLogs() {
  const { data: users = [] } = useQuery({
    queryKey: ['masterUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 20),
  });
  const { data: pages = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date', 10),
  });
  const { data: features = [] } = useQuery({
    queryKey: ['allUserFeatures'],
    queryFn: () => base44.entities.UserFeatures.list('-created_date', 50),
  });

  const logs = [
    ...users.map(u => ({ time: u.created_date, type: 'user', msg: `新規ユーザー登録: ${u.email}` })),
    ...pages.map(p => ({ time: p.created_date, msg: `LP作成: ${p.title}`, type: 'lp' })),
    ...features.map(f => ({ time: f.created_date, msg: `機能設定更新: user_id=${f.user_id}`, type: 'feature' })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 50);

  const TYPE_COLOR = { user: 'bg-blue-100 text-blue-700', lp: 'bg-amber-100 text-amber-700', feature: 'bg-green-100 text-green-700' };

  return (
    <MasterLayout title="システムログ">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">システムログ</h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">ログがありません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLOR[log.type] || 'bg-slate-100 text-slate-600'}`}>{log.type}</span>
                <span className="text-sm text-slate-700 flex-1">{log.msg}</span>
                <span className="text-xs text-slate-400 shrink-0">
                  {log.time ? new Date(log.time).toLocaleString('ja-JP') : '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MasterLayout>
  );
}