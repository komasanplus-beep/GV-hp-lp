import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, UserPlus, Pencil, Settings } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function MasterUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['masterUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.auth.updateMe ? base44.entities.User.update(id, data) : Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterUsers'] });
      setEditUser(null);
    },
  });

  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.store_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MasterLayout title="Users">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">ユーザー一覧</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="検索..." className="pl-9" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">読み込み中...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">メール</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden md:table-cell">名前</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">店舗名</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">ステータス</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">登録日</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{user.full_name || user.representative_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{user.store_name || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.status === 'stop' ? 'destructive' : 'default'} className="text-xs">
                      {user.status === 'stop' ? '停止' : 'アクティブ'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                    {user.created_date ? new Date(user.created_date).toLocaleDateString('ja-JP') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditUser(user)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={createPageUrl(`MasterFeatureControl?userId=${user.id}`)}>
                          <Settings className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">ユーザーが見つかりません</div>
          )}
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ユーザー編集</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs text-slate-500">メール</Label>
                <p className="text-sm text-slate-700 mt-1">{editUser.email}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">店舗名</Label>
                <Input defaultValue={editUser.store_name} onChange={e => setEditUser({ ...editUser, store_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">代表者名</Label>
                <Input defaultValue={editUser.representative_name} onChange={e => setEditUser({ ...editUser, representative_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">電話</Label>
                <Input defaultValue={editUser.phone} onChange={e => setEditUser({ ...editUser, phone: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">ステータス</Label>
                <select
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                  value={editUser.status || 'active'}
                  onChange={e => setEditUser({ ...editUser, status: e.target.value })}
                >
                  <option value="active">アクティブ</option>
                  <option value="stop">停止</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>キャンセル</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => updateMutation.mutate({ id: editUser.id, data: editUser })}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MasterLayout>
  );
}