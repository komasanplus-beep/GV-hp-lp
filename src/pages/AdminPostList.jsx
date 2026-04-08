/**
 * AdminPostList - 記事一覧管理画面
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Plus, Pencil, Trash2, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

const POST_TYPES = {
  news: { label: 'お知らせ', color: 'bg-blue-100 text-blue-700' },
  blog: { label: 'ブログ', color: 'bg-green-100 text-green-700' },
  column: { label: 'コラム', color: 'bg-purple-100 text-purple-700' },
  campaign: { label: 'キャンペーン', color: 'bg-orange-100 text-orange-700' },
};

export default function AdminPostList() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deletePost, setDeletePost] = useState(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', siteId],
    queryFn: () => base44.entities.Post.filter({ site_id: siteId }, '-created_date'),
    enabled: !!siteId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Post.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', siteId] });
      setDeletePost(null);
      toast.success('記事を削除しました');
    },
  });

  const filtered = posts.filter(p => {
    if (filterType !== 'all' && p.post_type !== filterType) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  if (!siteId) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="記事管理">
          <Card><CardContent className="py-16 text-center text-slate-400">
            <p className="text-2xl mb-2">⚠️</p>
            <p>URLに <code className="bg-slate-100 px-1 rounded">?site_id=...</code> が必要です</p>
          </CardContent></Card>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="記事管理">
        <div className="max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-slate-800">記事一覧</h2>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/AdminPostCategories?site_id=${siteId}`)}
              >
                カテゴリー管理
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/AdminPostTags?site_id=${siteId}`)}
              >
                タグ管理
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 gap-2"
                onClick={() => navigate(`/AdminPostEdit?site_id=${siteId}`)}
              >
                <Plus className="w-4 h-4" />新規記事
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="記事タイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのタイプ</SelectItem>
                {Object.entries(POST_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="published">公開</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-slate-400">
              <p className="text-3xl mb-2">📝</p>
              <p className="font-medium">記事がありません</p>
              <Button className="mt-4 bg-amber-600 hover:bg-amber-700 gap-2" onClick={() => navigate(`/AdminPostEdit?site_id=${siteId}`)}>
                <Plus className="w-4 h-4" />最初の記事を作成
              </Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(post => {
                const typeInfo = POST_TYPES[post.post_type] || POST_TYPES.blog;
                return (
                  <Card key={post.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      {post.featured_image_url && (
                        <img src={post.featured_image_url} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {post.status === 'published' ? '公開' : '下書き'}
                          </span>
                        </div>
                        <p className="font-medium text-slate-800 truncate">{post.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {post.published_at ? format(new Date(post.published_at), 'yyyy/MM/dd') : '未公開'}
                          {post.author_name && ` · ${post.author_name}`}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" asChild title="表示">
                          <a href={`/post/${post.slug}?site_id=${siteId}`} target="_blank" rel="noreferrer">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/AdminPostEdit?site_id=${siteId}&post_id=${post.id}`)}>
                          <Pencil className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletePost(post)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>記事を削除</AlertDialogTitle>
              <AlertDialogDescription>「{deletePost?.title}」を削除してもよろしいですか？</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate(deletePost.id)} className="bg-red-600 hover:bg-red-700">削除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </UserLayout>
    </ProtectedRoute>
  );
}