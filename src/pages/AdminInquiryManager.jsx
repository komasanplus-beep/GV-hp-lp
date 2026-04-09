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
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Loader2, MessageSquare, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_LABELS = {
  new: '新規',
  ai_answered: 'AI回答待ち',
  in_progress: '対応中',
  resolved: '解決',
  closed: '終了',
};

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  ai_answered: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-orange-100 text-orange-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-700',
};

export default function AdminInquiryManager() {
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showConvertKnowledge, setShowConvertKnowledge] = useState(false);
  const [knowledgeTitle, setKnowledgeTitle] = useState('');

  const queryClient = useQueryClient();

  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'store' | 'system_support'
  const [filterStatus, setFilterStatus] = useState('all');

  // 問い合わせ一覧取得
  const { data: allInquiries = [], isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: () => base44.entities.Inquiry.list('-created_date'),
  });

  const inquiries = allInquiries.filter(i => {
    const catMatch = filterCategory === 'all' ? true :
      filterCategory === 'system_support' ? i.category === 'system_support' :
      i.category !== 'system_support';
    const statusMatch = filterStatus === 'all' ? true : i.status === filterStatus;
    return catMatch && statusMatch;
  });

  const unresolvedQACount = allInquiries.filter(i => i.category === 'system_support' && (i.status === 'new' || i.status === 'in_progress')).length;

  // 選択中の問い合わせのメッセージ取得
  const { data: messages = [] } = useQuery({
    queryKey: ['inquiryMessages', selectedInquiry?.id],
    queryFn: () =>
      selectedInquiry?.id
        ? base44.entities.InquiryMessage.filter({ inquiry_id: selectedInquiry.id }, 'created_date')
        : Promise.resolve([]),
    enabled: !!selectedInquiry?.id,
  });

  // 返信送信
  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!adminReply.trim() || !selectedInquiry) return;

      const message = await base44.entities.InquiryMessage.create({
        inquiry_id: selectedInquiry.id,
        sender_type: 'admin',
        sender_id: 'admin',
        message: adminReply,
        is_official_reply: true,
      });

      // Inquiry のステータスを更新
      if (selectedStatus) {
        await base44.entities.Inquiry.update(selectedInquiry.id, {
          status: selectedStatus,
          assigned_admin_id: 'admin',
        });
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiryMessages'] });
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      setAdminReply('');
      setSelectedStatus('');
      toast.success('返信を送信しました');
    },
  });

  // ナレッジ化
  const convertKnowledgeMutation = useMutation({
    mutationFn: async () => {
      if (!knowledgeTitle.trim() || !selectedInquiry) return;

      const officialMsg = messages.find(m => m.is_official_reply && m.sender_type === 'admin');

      return base44.functions.invoke('convertInquiryToKnowledge', {
        inquiry_id: selectedInquiry.id,
        title: knowledgeTitle,
        official_reply_message_id: officialMsg?.id,
      });
    },
    onSuccess: () => {
      setShowConvertKnowledge(false);
      setKnowledgeTitle('');
      toast.success('ナレッジとして登録しました');
    },
  });

  const aiMessage = messages.find(m => m.sender_type === 'ai');
  const adminMessages = messages.filter(m => m.sender_type === 'admin');

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="問い合わせ管理">
        <div className="max-w-6xl space-y-4">
          {/* 未対応Q&Aバナー */}
          {unresolvedQACount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <p className="text-sm text-orange-800 font-medium">
                未対応のQ&A（システムサポート）が <span className="font-bold">{unresolvedQACount}件</span> あります
              </p>
              <Button size="sm" variant="outline" onClick={() => { setFilterCategory('system_support'); setFilterStatus('all'); }}
                className="ml-auto text-orange-700 border-orange-300">
                確認する
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左: 問い合わせ一覧 */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-800">問い合わせ一覧</h2>
            </div>
            {/* フィルター */}
            <div className="space-y-2 mb-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="system_support">Q&A（システム）</SelectItem>
                  <SelectItem value="store">店舗問い合わせ</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ステータス</SelectItem>
                  <SelectItem value="new">未対応</SelectItem>
                  <SelectItem value="in_progress">対応中</SelectItem>
                  <SelectItem value="resolved">解決済み</SelectItem>
                  <SelectItem value="closed">終了</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : inquiries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-400 text-sm">
                  問い合わせがありません
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {inquiries.map(inquiry => (
                  <button
                    key={inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selectedInquiry?.id === inquiry.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{inquiry.subject}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {format(new Date(inquiry.created_date), 'MM/dd HH:mm')}
                        </p>
                        <Badge className={`mt-1 text-xs ${STATUS_COLORS[inquiry.status]}`}>
                          {STATUS_LABELS[inquiry.status]}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右: 問い合わせ詳細 */}
          <div className="lg:col-span-2">
            {selectedInquiry ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedInquiry.subject}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        {selectedInquiry.category} | {format(new Date(selectedInquiry.created_date), 'yyyy/MM/dd HH:mm')}
                      </p>
                    </div>
                    <Badge className={STATUS_COLORS[selectedInquiry.status]}>
                      {STATUS_LABELS[selectedInquiry.status]}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* メッセージスレッド */}
                  <Tabs defaultValue="messages" className="space-y-3">
                    <TabsList>
                      <TabsTrigger value="messages">メッセージ</TabsTrigger>
                      <TabsTrigger value="ai" disabled={!aiMessage}>
                        AI回答
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="messages" className="space-y-3 max-h-64 overflow-y-auto">
                      {/* ユーザー初期メッセージ */}
                      <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                        <p className="text-xs font-medium text-blue-700 mb-1">ユーザー</p>
                        <p className="text-sm text-slate-700">{selectedInquiry.body}</p>
                      </div>

                      {/* AI回答 */}
                      {aiMessage && (
                        <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-500">
                          <p className="text-xs font-medium text-yellow-700 mb-1">AI一次回答</p>
                          <p className="text-sm text-slate-700">{aiMessage.message}</p>
                        </div>
                      )}

                      {/* 管理者返信 */}
                      {adminMessages.map(msg => (
                        <div key={msg.id} className="bg-emerald-50 rounded-lg p-3 border-l-4 border-emerald-500">
                          <p className="text-xs font-medium text-emerald-700 mb-1">
                            管理者返信
                            {msg.is_official_reply && <span className="ml-1 text-emerald-600">[正式回答]</span>}
                          </p>
                          <p className="text-sm text-slate-700">{msg.message}</p>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="ai">
                      {aiMessage ? (
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                          <p className="text-sm text-slate-700">{aiMessage.message}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">AI回答なし</p>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* 管理者返信入力 */}
                  <div className="border-t pt-3 space-y-3">
                    <Textarea
                      value={adminReply}
                      onChange={e => setAdminReply(e.target.value)}
                      placeholder="管理者から返信を入力..."
                      rows={3}
                      className="resize-none"
                    />

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">ステータス</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">対応中</SelectItem>
                          <SelectItem value="resolved">解決</SelectItem>
                          <SelectItem value="closed">終了</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => sendReplyMutation.mutate()}
                        disabled={!adminReply.trim() || sendReplyMutation.isPending}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {sendReplyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '返信を送信'}
                      </Button>

                      {selectedInquiry.status === 'resolved' && (
                        <Button
                          onClick={() => setShowConvertKnowledge(true)}
                          variant="outline"
                          className="gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />ナレッジ化
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center text-slate-400">
                  問い合わせを選択してください
                </CardContent>
              </Card>
            )}
          </div>
          </div>{/* grid end */}
        </div>

        {/* ナレッジ化ダイアログ */}
        {showConvertKnowledge && (
          <Dialog open={showConvertKnowledge} onOpenChange={setShowConvertKnowledge}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ナレッジとして登録</DialogTitle>
                <DialogDescription>
                  この解決済み問い合わせをAIナレッジベースに追加します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">ナレッジタイトル</label>
                  <Input
                    value={knowledgeTitle}
                    onChange={e => setKnowledgeTitle(e.target.value)}
                    placeholder="例: パスワードリセット手順"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConvertKnowledge(false)}>
                  キャンセル
                </Button>
                <Button
                  onClick={() => convertKnowledgeMutation.mutate()}
                  disabled={!knowledgeTitle.trim() || convertKnowledgeMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {convertKnowledgeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '登録'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </UserLayout>
    </ProtectedRoute>
  );
}