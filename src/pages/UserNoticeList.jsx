import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Bell, AlertCircle, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function UserNoticeList() {
  const [selectedNotice, setSelectedNotice] = React.useState(null);
  const queryClient = useQueryClient();

  // 現在のユーザーを取得
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // 自分宛てのお知らせを取得
  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ['myNotices', user?.id],
    queryFn: () =>
      user?.id
        ? base44.entities.NoticeRecipient.filter({ user_id: user.id }, '-created_date')
        : Promise.resolve([]),
    enabled: !!user?.id,
  });

  // 既読状態を更新
  const markReadMutation = useMutation({
    mutationFn: (recipientId) =>
      base44.entities.NoticeRecipient.update(recipientId, {
        is_read: true,
        read_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNotices'] });
    },
  });

  const handleNoticeClick = async (recipient) => {
    setSelectedNotice(recipient);
    if (!recipient.is_read) {
      markReadMutation.mutate(recipient.id);
    }
  };

  // NoticeRecipient からお知らせ本文を取得（フロント側は別途 Notice entity を fetch）
  const getNoticeDetails = async (notice_id) => {
    try {
      const notices = await base44.entities.Notice.filter({ id: notice_id });
      return notices[0];
    } catch {
      return null;
    }
  };

  // 添付ファイル一覧取得
  const { data: attachments = [] } = useQuery({
    queryKey: ['noticeAttachments', selectedNotice?.notice_id],
    queryFn: () =>
      selectedNotice?.notice_id
        ? base44.entities.NoticeAttachment.filter({ notice_id: selectedNotice.notice_id })
        : Promise.resolve([]),
    enabled: !!selectedNotice?.notice_id,
  });

  const unreadCount = recipients.filter(r => !r.is_read).length;

  return (
    <UserLayout title="お知らせ">
      <div className="max-w-4xl space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-amber-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">お知らせ</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                全{recipients.length}件 ({unreadCount}件未読)
              </p>
            </div>
          </div>
        </div>

        {/* お知らせ一覧 */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : recipients.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-16 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">お知らせはありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recipients.map(recipient => (
              <React.Suspense key={recipient.id} fallback={null}>
                <NoticeItemWithDetails
                  recipient={recipient}
                  onSelect={() => handleNoticeClick(recipient)}
                  isSelected={selectedNotice?.id === recipient.id}
                />
              </React.Suspense>
            ))}
          </div>
        )}
      </div>

      {/* 詳細ダイアログ */}
      {selectedNotice && (
        <NoticeDetailDialog
          recipient={selectedNotice}
          attachments={attachments}
          onClose={() => setSelectedNotice(null)}
        />
      )}
    </UserLayout>
  );
}

// NoticeItem コンポーネント
function NoticeItemWithDetails({ recipient, onSelect, isSelected }) {
  const { data: notice, isLoading } = useQuery({
    queryKey: ['notice', recipient.notice_id],
    queryFn: async () => {
      const notices = await base44.entities.Notice.filter({ id: recipient.notice_id });
      return notices[0];
    },
  });

  if (isLoading || !notice) return null;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-amber-500 bg-amber-50'
          : 'border-slate-200 hover:border-slate-300'
      } ${!recipient.is_read ? 'bg-blue-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {notice.is_important && (
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 truncate">{notice.title}</h3>
            {!recipient.is_read && (
              <Badge className="bg-blue-100 text-blue-700 flex-shrink-0">未読</Badge>
            )}
            {notice.is_pinned && (
              <Badge className="bg-slate-200 text-slate-700 flex-shrink-0">固定</Badge>
            )}
            {notice.is_important && (
              <Badge className="bg-red-100 text-red-700 flex-shrink-0">重要</Badge>
            )}
          </div>
          <p className="text-sm text-slate-600 truncate">{notice.body}</p>
          <p className="text-xs text-slate-400 mt-1">
            {format(new Date(notice.created_date), 'yyyy/MM/dd HH:mm')}
          </p>
        </div>
      </div>
    </button>
  );
}

// 詳細ダイアログ
function NoticeDetailDialog({ recipient, attachments, onClose }) {
  const { data: notice } = useQuery({
    queryKey: ['notice', recipient.notice_id],
    queryFn: async () => {
      const notices = await base44.entities.Notice.filter({ id: recipient.notice_id });
      return notices[0];
    },
  });

  if (!notice) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {notice.is_important && <AlertCircle className="w-5 h-5 text-red-500" />}
            {notice.title}
          </DialogTitle>
          <DialogDescription>
            {format(new Date(notice.created_date), 'yyyy年M月d日 HH:mm 配信')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {notice.thumbnail_url && (
            <img src={notice.thumbnail_url} alt="" className="w-full h-64 object-cover rounded-lg" />
          )}

          <div className="prose prose-sm max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap">{notice.body}</p>
          </div>

          {attachments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">添付ファイル</h4>
              <div className="space-y-2">
                {attachments.map(file => (
                  <a
                    key={file.id}
                    href={file.file_url}
                    download={file.file_name}
                    className="flex items-center gap-2 p-2 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">{file.file_name}</span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {(file.file_size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}