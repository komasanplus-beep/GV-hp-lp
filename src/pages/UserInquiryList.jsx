import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
import { Plus, MessageSquare, Loader2, Send, CheckCircle } from 'lucide-react';
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

export default function UserInquiryList() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [form, setForm] = useState({
    subject: '',
    category: 'general',
    body: '',
  });

  const queryClient = useQueryClient();

  // 現在のユーザーを取得
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // ユーザーの問い合わせ一覧
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['myInquiries', user?.id],
    queryFn: () =>
      user?.id
        ? base44.entities.Inquiry.filter({ user_id: user.id }, '-created_date')
        : Promise.resolve([]),
    enabled: !!user?.id,
  });

  // 問い合わせ作成・送信
  const createInquiryMutation = useMutation({
    mutationFn: async () => {
      return base44.functions.invoke('submitInquiry', {
        subject: form.subject,
        category: form.category,
        body: form.body,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['myInquiries'] });
      setForm({ subject: '', category: 'general', body: '' });
      setShowCreate(false);
      toast.success('問い合わせを送信しました');

      // AI回答がある場合は詳細ページを開く
      if (result.data?.inquiry_id) {
        const inquiry = inquiries.find(i => i.id === result.data.inquiry_id);
        if (inquiry) {
          setSelectedInquiry({ ...inquiry, ai_response: result.data.ai_response });
        }
      }
    },
  });

  const handleCreateInquiry = () => {
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error('件名と本文は必須です');
      return;
    }
    createInquiryMutation.mutate();
  };

  return (
    <UserLayout title="問い合わせ">
      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左: 問い合わせ一覧 */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800">問い合わせ一覧</h2>
            <Button
              onClick={() => {
                setForm({ subject: '', category: 'general', body: '' });
                setShowCreate(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-9 px-3"
              size="sm"
            >
              <Plus className="w-4 h-4" />新規
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : inquiries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-400 text-sm">
                問い合わせはありません
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {inquiries.map(inquiry => (
                <button
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedInquiry?.id === inquiry.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-800 truncate">{inquiry.subject}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(new Date(inquiry.created_date), 'MM/dd HH:mm')}
                  </p>
                  <Badge className={`mt-1 text-xs ${STATUS_COLORS[inquiry.status]}`}>
                    {STATUS_LABELS[inquiry.status]}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右: 問い合わせ詳細 */}
        <div className="lg:col-span-2">
          {selectedInquiry ? (
            <InquiryDetail inquiry={selectedInquiry} onDeselect={() => setSelectedInquiry(null)} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">問い合わせを選択してください</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 新規問い合わせダイアログ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>問い合わせを送信</DialogTitle>
            <DialogDescription>
              ご不明な点やご要望をお知らせください。AIが一次対応し、必要に応じて管理者が対応します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">件名 *</label>
              <Input
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="例: 決済方法について"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">カテゴリ</label>
              <Select value={form.category} onValueChange={cat => setForm(p => ({ ...p, category: cat }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">一般的な質問</SelectItem>
                  <SelectItem value="payment">決済について</SelectItem>
                  <SelectItem value="technical">技術的な問題</SelectItem>
                  <SelectItem value="account">アカウント関連</SelectItem>
                  <SelectItem value="feedback">フィードバック</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">本文 *</label>
              <Textarea
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="詳細をお聞かせください"
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreateInquiry}
              disabled={createInquiryMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {createInquiryMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              送信
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}

// 問い合わせ詳細コンポーネント
function InquiryDetail({ inquiry, onDeselect }) {
  const { data: messages = [] } = useQuery({
    queryKey: ['inquiryMessages', inquiry.id],
    queryFn: () => base44.entities.InquiryMessage.filter({ inquiry_id: inquiry.id }, 'created_date'),
    enabled: !!inquiry.id,
  });

  const aiMessage = messages.find(m => m.sender_type === 'ai');
  const adminMessages = messages.filter(m => m.sender_type === 'admin' && m.is_official_reply);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{inquiry.subject}</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {inquiry.category} | {format(new Date(inquiry.created_date), 'yyyy/MM/dd HH:mm')}
            </p>
          </div>
          <Badge className={STATUS_COLORS[inquiry.status]}>
            {STATUS_LABELS[inquiry.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* 初期メッセージ */}
        <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
          <p className="text-xs font-medium text-blue-700 mb-1">ご質問</p>
          <p className="text-sm text-slate-700">{inquiry.body}</p>
        </div>

        {/* AI回答 */}
        {aiMessage && (
          <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-500">
            <p className="text-xs font-medium text-yellow-700 mb-1">AI一次回答</p>
            <p className="text-sm text-slate-700">{aiMessage.message}</p>
            {inquiry.is_resolved_by_ai && (
              <div className="mt-2 pt-2 border-t border-yellow-200">
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  このAI回答で解決した
                </p>
              </div>
            )}
          </div>
        )}

        {/* 管理者回答 */}
        {adminMessages.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">管理者からの回答</p>
            {adminMessages.map(msg => (
              <div key={msg.id} className="bg-emerald-50 rounded-lg p-3 border-l-4 border-emerald-500">
                <p className="text-sm text-slate-700">{msg.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {format(new Date(msg.created_date), 'yyyy/MM/dd HH:mm')}
                </p>
              </div>
            ))}
          </div>
        )}

        {inquiry.status === 'new' && !aiMessage && (
          <p className="text-sm text-slate-500 text-center py-4">
            対応を準備中です。しばらくお待ちください。
          </p>
        )}
      </CardContent>
    </Card>
  );
}