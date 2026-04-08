import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Pencil, Trash2, Loader2, Send, Eye, Copy, Calendar, Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_LABELS = {
  draft: '下書き',
  scheduled: '予約中',
  sent: '配信済み',
};

const TARGET_TYPE_LABELS = {
  all: '全ユーザー',
  site_user: 'サイト利用者',
  lp_user: 'LP利用者',
  both_user: 'サイト・LP両用',
  plan: '特定プラン',
  specific_user: '個別選択',
};

export default function AdminNoticeManager() {
  const [notices, setNotices] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [deleteNotice, setDeleteNotice] = useState(null);
  const [sendNotice, setSendNotice] = useState(null);
  const [previewCount, setPreviewCount] = useState(0);

  const [form, setForm] = useState({
    title: '',
    body: '',
    thumbnail_url: '',
    is_pinned: false,
    is_important: false,
    scheduled_at: '',
    target_rules: [],
  });

  const queryClient = useQueryClient();

  // お知らせ一覧取得
  const { data: noticesData = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => base44.entities.Notice.list('-created_date'),
  });

  // 保存ミューテーション
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingNotice?.id) {
        return base44.entities.Notice.update(editingNotice.id, {
          title: data.title,
          body: data.body,
          thumbnail_url: data.thumbnail_url,
          is_pinned: data.is_pinned,
          is_important: data.is_important,
        });
      } else {
        const notice = await base44.entities.Notice.create({
          title: data.title,
          body: data.body,
          thumbnail_url: data.thumbnail_url,
          is_pinned: data.is_pinned,
          is_important: data.is_important,
          status: 'draft',
        });

        // 配信対象ルールを保存
        if (data.target_rules && data.target_rules.length > 0) {
          for (const rule of data.target_rules) {
            await base44.entities.NoticeTargetRule.create({
              notice_id: notice.id,
              target_type: rule.target_type,
              target_value: rule.target_value || '',
            });
          }
        }

        return notice;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      setShowCreate(false);
      setEditingNotice(null);
      setForm({
        title: '',
        body: '',
        thumbnail_url: '',
        is_pinned: false,
        is_important: false,
        scheduled_at: '',
        target_rules: [],
      });
      toast.success(editingNotice ? 'お知らせを更新しました' : 'お知らせを作成しました');
    },
  });

  // 配信ミューテーション
  const sendMutation = useMutation({
    mutationFn: async (noticeId) => {
      return base44.functions.invoke('sendNotice', {
        notice_id: noticeId,
        scheduled_at: form.scheduled_at || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      setSendNotice(null);
      toast.success('お知らせを配信しました');
    },
  });

  // 削除ミューテーション
  const deleteMutation = useMutation({
    mutationFn: (noticeId) => base44.entities.Notice.delete(noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      setDeleteNotice(null);
      toast.success('お知らせを削除しました');
    },
  });

  const handlePreviewCount = async () => {
    try {
      const result = await base44.functions.invoke('getNoticePreviewCount', {
        rules: form.target_rules,
      });
      setPreviewCount(result.data?.preview_count || 0);
      toast.success(`配信対象: ${result.data?.preview_count || 0}人`);
    } catch (err) {
      toast.error('対象人数の取得に失敗しました');
    }
  };

  const handleAddRule = () => {
    setForm(p => ({
      ...p,
      target_rules: [...p.target_rules, { target_type: 'all', target_value: '' }],
    }));
  };

  const handleRemoveRule = (idx) => {
    setForm(p => ({
      ...p,
      target_rules: p.target_rules.filter((_, i) => i !== idx),
    }));
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      body: notice.body,
      thumbnail_url: notice.thumbnail_url || '',
      is_pinned: notice.is_pinned || false,
      is_important: notice.is_important || false,
      scheduled_at: notice.scheduled_at ? notice.scheduled_at.slice(0, 16) : '',
      target_rules: [],
    });
    setShowCreate(true);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="お知らせ管理">
        <div className="max-w-6xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">お知らせ一覧</h2>
            <Button
              onClick={() => {
                setEditingNotice(null);
                setForm({
                  title: '',
                  body: '',
                  thumbnail_url: '',
                  is_pinned: false,
                  is_important: false,
                  scheduled_at: '',
                  target_rules: [],
                });
                setShowCreate(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <Plus className="w-4 h-4" />新規作成
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : noticesData.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <p>お知らせがありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {noticesData.map(notice => (
                <Card key={notice.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-800">{notice.title}</h3>
                          {notice.is_important && (
                            <Badge className="bg-red-100 text-red-700">重要</Badge>
                          )}
                          {notice.is_pinned && (
                            <Badge className="bg-blue-100 text-blue-700">固定</Badge>
                          )}
                          <Badge className="bg-slate-100 text-slate-700">
                            {STATUS_LABELS[notice.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          作成: {format(new Date(notice.created_date), 'yyyy/MM/dd HH:mm')}
                        </p>
                        {notice.sent_at && (
                          <p className="text-xs text-emerald-600">
                            配信: {format(new Date(notice.sent_at), 'yyyy/MM/dd HH:mm')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(notice)}
                          className="gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />編集
                        </Button>
                        {notice.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSendNotice(notice)}
                            className="gap-1 text-emerald-600"
                          >
                            <Send className="w-3.5 h-3.5" />配信
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteNotice(notice)}
                          className="text-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 作成・編集ダイアログ */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNotice ? 'お知らせを編集' : '新規お知らせ作成'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">タイトル *</label>
                <Input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="お知らせのタイトル"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">本文 *</label>
                <Textarea
                  value={form.body}
                  onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="お知らせの本文"
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_important}
                    onChange={e => setForm(p => ({ ...p, is_important: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-slate-700">重要として表示</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-slate-700">トップに固定</span>
                </label>
              </div>

              {!editingNotice && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-700">配信対象</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddRule}
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" />条件追加
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {form.target_rules.map((rule, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <Select
                            value={rule.target_type}
                            onValueChange={val =>
                              setForm(p => ({
                                ...p,
                                target_rules: p.target_rules.map((r, i) =>
                                  i === idx ? { ...r, target_type: val } : r
                                ),
                              }))
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(TARGET_TYPE_LABELS).map(([type, label]) => (
                                <SelectItem key={type} value={type}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {rule.target_type !== 'all' && (
                            <Input
                              value={rule.target_value}
                              onChange={e =>
                                setForm(p => ({
                                  ...p,
                                  target_rules: p.target_rules.map((r, i) =>
                                    i === idx ? { ...r, target_value: e.target.value } : r
                                  ),
                                }))
                              }
                              placeholder="値"
                              className="flex-1"
                            />
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveRule(idx)}
                            className="text-red-400 h-9"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePreviewCount}
                      className="mt-3 gap-1 w-full"
                    >
                      <Users className="w-3.5 h-3.5" />対象人数を確認 ({previewCount}人)
                    </Button>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">配信日時（予約）</label>
                    <Input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  キャンセル
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => saveMutation.mutate(form)}
                  disabled={!form.title || !form.body || saveMutation.isPending}
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* 配信確認ダイアログ */}
        {sendNotice && (
          <AlertDialog open={!!sendNotice} onOpenChange={() => setSendNotice(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>お知らせを配信しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{sendNotice.title}」を{previewCount}人に配信します。この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => sendMutation.mutate(sendNotice.id)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '配信する'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* 削除確認ダイアログ */}
        {deleteNotice && (
          <AlertDialog open={!!deleteNotice} onOpenChange={() => setDeleteNotice(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>お知らせを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{deleteNotice.title}」を削除します。この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(deleteNotice.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </UserLayout>
    </ProtectedRoute>
  );
}