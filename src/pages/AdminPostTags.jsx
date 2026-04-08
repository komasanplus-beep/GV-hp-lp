/**
 * AdminPostTags - タグ管理
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Plus, X, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

function toSlug(name) {
  return name.toLowerCase().replace(/[\s　]+/g, '-').replace(/[^a-z0-9\-]/g, '').slice(0, 50);
}

export default function AdminPostTags() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['postTags', siteId],
    queryFn: () => base44.entities.PostTag.filter({ site_id: siteId }),
    enabled: !!siteId,
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.PostTag.create({ site_id: siteId, name, slug: toSlug(name) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['postTags', siteId] }); setName(''); toast.success('追加しました'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PostTag.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['postTags', siteId] }); toast.success('削除しました'); },
  });

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="タグ管理">
        <div className="max-w-xl space-y-6">
          <button onClick={() => navigate(`/AdminPostList?site_id=${siteId}`)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />記事一覧に戻る
          </button>
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="タグ名" onKeyDown={e => e.key === 'Enter' && name && createMutation.mutate()} />
                <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="bg-amber-600 hover:bg-amber-700 gap-1">
                  <Plus className="w-4 h-4" />追加
                </Button>
              </div>
              {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag.id} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                      #{tag.name}
                      <button onClick={() => deleteMutation.mutate(tag.id)} className="text-slate-400 hover:text-red-500 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && <p className="text-slate-400 text-sm py-4">タグがありません</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}