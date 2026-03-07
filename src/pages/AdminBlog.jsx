import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, Home, Loader2, Upload } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const defaultForm = {
  title: '', slug: '', excerpt: '', content: '', thumbnail_url: '',
  category_id: '', status: 'draft', show_on_home: false, home_block_order: 0,
};

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [uploading, setUploading] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 100),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['blogCategories'],
    queryFn: () => base44.entities.BlogCategory.list('name'),
  });

  const openCreate = () => { setEditing('new'); setForm(defaultForm); };
  const openEdit = (post) => { setEditing(post.id); setForm({ ...defaultForm, ...post }); };
  const closeDialog = () => { setEditing(null); setForm(defaultForm); };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editing === 'new') return base44.entities.BlogPost.create(data);
      return base44.entities.BlogPost.update(editing, data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blogPosts'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blogPosts'] }),
  });

  const toggleStatus = (post) => {
    base44.entities.BlogPost.update(post.id, { status: post.status === 'published' ? 'draft' : 'published' })
      .then(() => queryClient.invalidateQueries({ queryKey: ['blogPosts'] }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, thumbnail_url: file_url }));
    setUploading(false);
  };

  const published = posts.filter(p => p.status === 'published').length;
  const onHome = posts.filter(p => p.show_on_home).length;

  return (
    <ProtectedRoute>
      <AdminLayout title="ブログ管理">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">記事管理</h2>
            <p className="text-xs text-slate-400 mt-1">公開: {published}件 / トップ表示: {onHome}件（最大5件推奨）</p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />新規記事
          </Button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p>記事がありません。「新規記事」から作成してください。</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">タイトル</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium hidden md:table-cell">ステータス</th>
                  <th className="text-center px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">
                    <Home className="w-4 h-4 inline" /> トップ表示
                  </th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">日付</th>
                  <th className="text-right px-4 py-3 text-slate-600 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 line-clamp-1">{post.title}</div>
                      {post.slug && <div className="text-xs text-slate-400">/blog/{post.slug}</div>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <button onClick={() => toggleStatus(post)}>
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="cursor-pointer">
                          {post.status === 'published' ? '公開中' : '下書き'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {post.show_on_home ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Home className="w-3 h-3" /> {post.home_block_order ?? 0}番目
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                      {post.created_date ? new Date(post.created_date).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600"
                          onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(post.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={open => !open && closeDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing === 'new' ? '新規記事作成' : '記事編集'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-slate-500">タイトル</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">スラッグ（URL）</Label>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.replace(/\s/g, '-').toLowerCase() }))} placeholder="my-article" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">カテゴリ</Label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                    value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">選択してください</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">概要（抜粋）</Label>
                <Textarea rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} className="mt-1" placeholder="記事の概要（一覧・SNSシェア用）" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">本文</Label>
                <div className="mt-1">
                  <ReactQuill theme="snow" value={form.content} onChange={val => setForm(f => ({ ...f, content: val }))}
                    style={{ minHeight: '200px' }} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">サムネイル画像</Label>
                <div className="mt-1 space-y-2">
                  {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="h-32 object-cover rounded border" />}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                        画像をアップロード
                      </span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  </label>
                  <Input value={form.thumbnail_url || ''} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="または画像URLを入力" className="text-sm" />
                </div>
              </div>

              {/* トップページ表示設定 */}
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 space-y-3">
                <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                  <Home className="w-4 h-4" />トップページ表示設定
                </p>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 text-sm">トップページに表示する</Label>
                  <Switch checked={!!form.show_on_home} onCheckedChange={val => setForm(f => ({ ...f, show_on_home: val }))} />
                </div>
                {form.show_on_home && (
                  <div>
                    <Label className="text-xs text-slate-500">表示順（小さい数字が先）</Label>
                    <Input type="number" min={0} value={form.home_block_order ?? 0}
                      onChange={e => setForm(f => ({ ...f, home_block_order: parseInt(e.target.value) || 0 }))}
                      className="mt-1 w-32" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-slate-700">公開する</Label>
                <Switch checked={form.status === 'published'} onCheckedChange={val => setForm(f => ({ ...f, status: val ? 'published' : 'draft' }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>キャンセル</Button>
              <Button className="bg-amber-600 hover:bg-amber-700"
                disabled={!form.title || saveMutation.isPending}
                onClick={() => saveMutation.mutate(form)}>
                {saveMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}