import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Bot, Send, User, CheckCircle2, AlertTriangle, Plus, History,
  Loader2, Paperclip, X, ChevronRight, MessageSquare, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_LABELS = {
  new: '未対応',
  in_progress: '対応中',
  resolved: '解決',
  closed: '終了',
  active: 'AIチャット中',
  escalated: '管理者対応中',
};

const STATUS_COLORS = {
  new: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-700',
  active: 'bg-indigo-100 text-indigo-700',
  escalated: 'bg-amber-100 text-amber-700',
};

export default function UserQAPage() {
  const [tab, setTab] = useState('chat'); // 'chat' | 'history'
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [escalateForm, setEscalateForm] = useState({ subject: '', body: '', priority: 'normal', attachments: [] });
  const [sessionStatus, setSessionStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // セッション一覧
  const { data: sessionsData, isLoading: loadingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['supportSessions', user?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('supportChat', { action: 'get_sessions' });
      return res.data?.sessions || [];
    },
    enabled: !!user?.id,
  });
  const sessions = sessionsData || [];

  // 問い合わせチケット一覧（Inquiryエンティティ - system_supportカテゴリ）
  const { data: inquiries = [] } = useQuery({
    queryKey: ['mySystemInquiries', user?.id],
    queryFn: () =>
      user?.id
        ? base44.entities.Inquiry.filter({ user_id: user.id, category: 'system_support' }, '-created_date')
        : Promise.resolve([]),
    enabled: !!user?.id,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 新規セッション開始
  const startSessionMutation = useMutation({
    mutationFn: async (question) => {
      const res = await base44.functions.invoke('supportChat', {
        action: 'start_session',
        initial_question: question,
      });
      return res.data?.session;
    },
    onSuccess: (session) => {
      setCurrentSessionId(session.id);
      setSessionStatus('active');
      setMessages([]);
      refetchSessions();
    },
  });

  // メッセージ送信
  const sendMutation = useMutation({
    mutationFn: async ({ message, attachmentUrls }) => {
      const res = await base44.functions.invoke('supportChat', {
        action: 'send_message',
        session_id: currentSessionId,
        message,
        attachment_urls: attachmentUrls,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        data.user_message,
        data.ai_message,
      ]);
      setInputText('');
    },
    onError: () => toast.error('送信に失敗しました'),
  });

  // 解決マーク
  const resolveMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('supportChat', {
        action: 'resolve',
        session_id: currentSessionId,
      });
    },
    onSuccess: () => {
      setSessionStatus('resolved');
      toast.success('解決済みとしてマークしました');
      refetchSessions();
    },
  });

  // 管理者へエスカレーション
  const escalateMutation = useMutation({
    mutationFn: async () => {
      const uploadedUrls = [];
      for (const file of escalateForm.attachments) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      const res = await base44.functions.invoke('supportChat', {
        action: 'escalate',
        session_id: currentSessionId,
        subject: escalateForm.subject,
        body: escalateForm.body,
        priority: escalateForm.priority,
        attachment_urls: uploadedUrls,
      });
      return res.data;
    },
    onSuccess: () => {
      setSessionStatus('escalated');
      setShowEscalateForm(false);
      setEscalateForm({ subject: '', body: '', priority: 'normal', attachments: [] });
      toast.success('管理者へ問い合わせを送信しました');
      refetchSessions();
      queryClient.invalidateQueries({ queryKey: ['mySystemInquiries'] });
      // システムメッセージを表示
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender_type: 'system',
        message: '管理者へ問い合わせを送信しました。回答をお待ちください。',
        created_date: new Date().toISOString(),
      }]);
    },
    onError: () => toast.error('送信に失敗しました'),
  });

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const question = inputText.trim();

    if (!currentSessionId) {
      // 新規セッション開始してから送信
      const session = await startSessionMutation.mutateAsync(question);
      if (session) {
        // セッション作成後に送信
        const res = await base44.functions.invoke('supportChat', {
          action: 'send_message',
          session_id: session.id,
          message: question,
          attachment_urls: [],
        });
        setMessages([res.data.user_message, res.data.ai_message]);
        setInputText('');
      }
    } else {
      sendMutation.mutate({ message: question, attachmentUrls: [] });
    }
  };

  const handleSessionSelect = async (session) => {
    setCurrentSessionId(session.id);
    setSessionStatus(session.status);
    setShowEscalateForm(false);
    const res = await base44.functions.invoke('supportChat', {
      action: 'get_messages',
      session_id: session.id,
    });
    setMessages(res.data?.messages || []);
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setSessionStatus(null);
    setShowEscalateForm(false);
    setInputText('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setEscalateForm(p => ({ ...p, attachments: [...p.attachments, ...files] }));
  };

  const isActive = sessionStatus === 'active' || !sessionStatus;
  const canEscalate = messages.some(m => m.sender_type === 'ai') && sessionStatus !== 'escalated' && sessionStatus !== 'resolved' && sessionStatus !== 'closed';

  return (
    <UserLayout title="Q&A・サポート">
      <div className="max-w-5xl space-y-4">
        {/* タブ */}
        <div className="flex gap-2">
          <Button
            variant={tab === 'chat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('chat')}
            className={tab === 'chat' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <Bot className="w-4 h-4 mr-1.5" />AIチャット
          </Button>
          <Button
            variant={tab === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('history')}
            className={tab === 'history' ? 'bg-slate-700 hover:bg-slate-800' : ''}
          >
            <History className="w-4 h-4 mr-1.5" />履歴
            {inquiries.filter(i => i.status === 'new' || i.status === 'in_progress').length > 0 && (
              <Badge className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0">
                {inquiries.filter(i => i.status === 'new' || i.status === 'in_progress').length}
              </Badge>
            )}
          </Button>
        </div>

        {tab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* セッション一覧サイドバー */}
            <div className="lg:col-span-1 space-y-2">
              <Button
                onClick={handleNewSession}
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />新規質問
              </Button>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSessionSelect(s)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                      currentSessionId === s.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className="font-medium text-slate-800 truncate">{s.title || 'Q&Aセッション'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge className={`text-xs ${STATUS_COLORS[s.status]}`}>
                        {STATUS_LABELS[s.status]}
                      </Badge>
                    </div>
                    <p className="text-slate-400 mt-1">
                      {s.last_message_at ? format(new Date(s.last_message_at), 'MM/dd HH:mm') : ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* チャットエリア */}
            <div className="lg:col-span-3 flex flex-col">
              <Card className="flex-1">
                <CardContent className="p-0 flex flex-col h-full" style={{ minHeight: '480px' }}>
                  {/* チャット本文 */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '360px' }}>
                    {messages.length === 0 && !currentSessionId && (
                      <div className="text-center py-12 text-slate-400">
                        <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">何でもお気軽にご質問ください</p>
                        <p className="text-sm mt-1">AIがすぐに回答します</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <MessageBubble key={msg.id || i} message={msg} />
                    ))}
                    {(sendMutation.isPending || startSessionMutation.isPending) && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AIが回答を生成中...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* アクションボタン（AI回答後） */}
                  {canEscalate && !showEscalateForm && (
                    <div className="px-4 pb-2 flex gap-2 flex-wrap border-t pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-green-600 border-green-200"
                        onClick={() => resolveMutation.mutate()}
                        disabled={resolveMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4" />この回答で解決した
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-orange-600 border-orange-200"
                        onClick={() => setShowEscalateForm(true)}
                      >
                        <AlertTriangle className="w-4 h-4" />解決しない・管理者に問い合わせる
                      </Button>
                    </div>
                  )}

                  {/* 解決済み・対応中 表示 */}
                  {(sessionStatus === 'resolved' || sessionStatus === 'escalated' || sessionStatus === 'closed') && (
                    <div className={`mx-4 mb-3 p-3 rounded-lg text-sm text-center ${
                      sessionStatus === 'resolved' ? 'bg-green-50 text-green-700' :
                      sessionStatus === 'escalated' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {sessionStatus === 'resolved' && '✓ このセッションは解決済みです'}
                      {sessionStatus === 'escalated' && '📨 管理者へ問い合わせを送信しました。回答をお待ちください。'}
                      {sessionStatus === 'closed' && 'このセッションはクローズされました'}
                    </div>
                  )}

                  {/* 入力エリア */}
                  {(isActive || !currentSessionId) && !showEscalateForm && sessionStatus !== 'closed' && (
                    <div className="border-t p-3 flex gap-2">
                      <Input
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="質問を入力してください..."
                        className="flex-1"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        disabled={sendMutation.isPending || startSessionMutation.isPending}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!inputText.trim() || sendMutation.isPending || startSessionMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        size="icon"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* エスカレーションフォーム */}
              {showEscalateForm && (
                <Card className="mt-3 border-orange-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-orange-500" />
                        管理者へ問い合わせ
                      </h3>
                      <button onClick={() => setShowEscalateForm(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">件名 *</label>
                      <Input
                        value={escalateForm.subject}
                        onChange={e => setEscalateForm(p => ({ ...p, subject: e.target.value }))}
                        placeholder="例: ログインできない"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">問い合わせ内容 *</label>
                      <Textarea
                        value={escalateForm.body}
                        onChange={e => setEscalateForm(p => ({ ...p, body: e.target.value }))}
                        placeholder="詳しい状況をご記入ください"
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">優先度</label>
                        <Select value={escalateForm.priority} onValueChange={v => setEscalateForm(p => ({ ...p, priority: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="normal">通常</SelectItem>
                            <SelectItem value="high">高（緊急）</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">添付ファイル</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full gap-1"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="w-3.5 h-3.5" />ファイルを添付
                        </Button>
                        <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileChange} />
                      </div>
                    </div>
                    {escalateForm.attachments.length > 0 && (
                      <div className="space-y-1">
                        {escalateForm.attachments.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <Paperclip className="w-3 h-3" />
                            <span className="flex-1 truncate">{f.name}</span>
                            <button
                              onClick={() => setEscalateForm(p => ({ ...p, attachments: p.attachments.filter((_, j) => j !== i) }))}
                              className="text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowEscalateForm(false)} className="flex-1">
                        キャンセル
                      </Button>
                      <Button
                        onClick={() => escalateMutation.mutate()}
                        disabled={!escalateForm.subject.trim() || !escalateForm.body.trim() || escalateMutation.isPending}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 gap-1"
                      >
                        {escalateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        送信
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700">管理者への問い合わせ履歴</h3>
            {inquiries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-slate-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>問い合わせ履歴はありません</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {inquiries.map(inq => (
                  <Card key={inq.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800">{inq.subject}</p>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{inq.body}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(inq.created_date), 'yyyy/MM/dd HH:mm')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={STATUS_COLORS[inq.status]}>
                            {STATUS_LABELS[inq.status]}
                          </Badge>
                          {inq.priority === 'high' && (
                            <Badge className="bg-red-100 text-red-700 text-xs">緊急</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}

function MessageBubble({ message }) {
  const isUser = message.sender_type === 'user';
  const isAI = message.sender_type === 'ai';
  const isSystem = message.sender_type === 'system';
  const isAdmin = message.sender_type === 'admin';

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {message.message}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-emerald-100' : isAI ? 'bg-indigo-100' : 'bg-violet-100'
      }`}>
        {isUser ? <User className="w-4 h-4 text-emerald-600" /> :
         isAI ? <Bot className="w-4 h-4 text-indigo-600" /> :
         <User className="w-4 h-4 text-violet-600" />}
      </div>
      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
        isUser ? 'bg-emerald-600 text-white rounded-tr-sm' :
        isAI ? 'bg-slate-100 text-slate-800 rounded-tl-sm' :
        'bg-violet-100 text-violet-800 rounded-tl-sm'
      }`}>
        {!isUser && (
          <p className={`text-xs font-medium mb-1 ${isAI ? 'text-indigo-500' : 'text-violet-500'}`}>
            {isAI ? 'AI サポート' : '管理者'}
          </p>
        )}
        <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
        {message.attachment_urls?.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachment_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs underline opacity-80">
                <Paperclip className="w-3 h-3" />添付ファイル {i + 1}
              </a>
            ))}
          </div>
        )}
        {message.created_date && (
          <p className={`text-xs mt-1 ${isUser ? 'text-emerald-100' : 'text-slate-400'}`}>
            {format(new Date(message.created_date), 'HH:mm')}
          </p>
        )}
      </div>
    </div>
  );
}