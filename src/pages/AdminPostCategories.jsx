/**
 * AdminPostCategories - カテゴリー管理
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

function toSlug(name) {
  return name.toLowerCase().replace(/[\s　]+/g, '-').replace(/[^a-z0-9\-]/g, '').slice(0, 50);
}

export default function AdminPostCategories() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['postCategories', siteId],
    queryFn: () => base44.entities.PostCategory.filter({ site_id: siteId }, 'sort_order'),
    enabled: !!siteId,
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.PostCategory.create({ site_id: siteId, name, slug: toSlug(name), sort_order: categories.length }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['postCategories', siteId] }); setName(''); toast.success('追加しました'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PostCategory.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['postCategories', siteId] }); toast.success('削除しました'); },
  });

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="カテゴリー管理">
        <div className="max-w-xl space-y-6">
          <button onClick={() => navigate(`/AdminPostList?site_id=${siteId}`)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />記事一覧に戻る
          </button>
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="カテゴリー名" onKeyDown={e => e.key === 'Enter' && name && createMutation.mutate()} />
                <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="bg-amber-600 hover:bg-amber-700 gap-1">
                  <Plus className="w-4 h-4" />追加
                </Button>
              </div>
              {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : (
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                        <p className="text-xs text-slate-400">/{cat.slug}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cat.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-center text-slate-400 text-sm py-4">カテゴリーがありません</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}