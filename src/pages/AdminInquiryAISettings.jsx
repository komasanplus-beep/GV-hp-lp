import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Save, Brain, BookOpen, Plus, Trash2, ToggleLeft, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MODEL_OPTIONS = [
  { value: 'gpt_5_mini', label: 'GPT-4o mini（高速・低コスト）' },
  { value: 'gpt_5', label: 'GPT-4o（高精度）' },
  { value: 'claude_sonnet_4_6', label: 'Claude Sonnet（高品質）' },
];

const SOURCE_LABEL = { manual: '手動', inquiry: '問い合わせ', answer: '回答', qa_pair: 'Q&Aペア' };
const SOURCE_COLOR = {
  manual: 'bg-blue-100 text-blue-700',
  inquiry: 'bg-purple-100 text-purple-700',
  answer: 'bg-green-100 text-green-700',
  qa_pair: 'bg-amber-100 text-amber-700',
};

export default function AdminInquiryAISettings() {
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    is_enabled: true,
    auto_reply_enabled: false,
    require_admin_approval: true,
    model_name: 'gpt_5_mini',
    system_prompt: '',
    qa_prompt: '',
    ng_rules: '',
    knowledge_enabled: true,
    auto_knowledge_from_inquiries: false,
    auto_knowledge_from_answers: false,
    similar_qa_reference: true,
    response_tone: 'friendly',
    max_answer_length: 1000,
  });

  const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '', tags: '' });
  const [showNewKnowledge, setShowNewKnowledge] = useState(false);

  // AI設定取得
  const { data: aiSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['inquiryAISettings'],
    queryFn: () => base44.entities.InquiryAISetting.filter({ scope_type: 'global' }).then(r => r[0] || null),
  });

  useEffect(() => {
    if (aiSettings) setSettings(prev => ({ ...prev, ...aiSettings }));
  }, [aiSettings?.id]);

  // ナレッジ一覧取得
  const { data: knowledgeList = [], isLoading: knowledgeLoading } = useQuery({
    queryKey: ['inquiryKnowledge'],
    queryFn: () => base44.entities.InquiryAIKnowledge.list('-created_date'),
  });

  // 解決済み問い合わせ（ナレッジ化候補）
  const { data: resolvedInquiries = [] } = useQuery({
    queryKey: ['resolvedInquiries'],
    queryFn: () => base44.entities.Inquiry.filter({ status: 'resolved' }, '-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.functions.invoke('saveInquiryAISettings', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiryAISettings'] });
      toast.success('AI設定を保存しました');
    },
  });

  const addKnowledgeMutation = useMutation({
    mutationFn: () => base44.entities.InquiryAIKnowledge.create({
      title: newKnowledge.title,
      content: newKnowledge.content,
      source_type: 'manual',
      is_active: true,
      tags: newKnowledge.tags.split(',').map(t => t.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiryKnowledge'] });
      setNewKnowledge({ title: '', content: '', tags: '' });
      setShowNewKnowledge(false);
      toast.success('ナレッジを追加しました');
    },
  });

  const toggleKnowledgeMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.InquiryAIKnowledge.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquiryKnowledge'] }),
  });

  const deleteKnowledgeMutation = useMutation({
    mutationFn: (id) => base44.entities.InquiryAIKnowledge.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiryKnowledge'] });
      toast.success('削除しました');
    },
  });

  const createFromInquiryMutation = useMutation({
    mutationFn: (inquiry_id) => base44.functions.invoke('createKnowledgeFromQAPair', { inquiry_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiryKnowledge'] });
      toast.success('ナレッジ化しました');
    },
  });

  const ToggleRow = ({ label, desc, field }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <Switch
        checked={!!settings[field]}
        onCheckedChange={v => setSettings(p => ({ ...p, [field]: v }))}
      />
    </div>
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="Q&A AI設定">
        <div className="max-w-4xl space-y-6">
          <Tabs defaultValue="settings">
            <TabsList>
              <TabsTrigger value="settings">AI設定</TabsTrigger>
              <TabsTrigger value="knowledge">ナレッジ管理</TabsTrigger>
              <TabsTrigger value="candidates">ナレッジ候補</TabsTrigger>
            </TabsList>

            {/* AI設定タブ */}
            <TabsContent value="settings" className="space-y-5 mt-4">
              {settingsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : (
                <>
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Brain className="w-4 h-4 text-amber-500" />動作設定</CardTitle></CardHeader>
                    <CardContent>
                      <ToggleRow label="AI有効" desc="問い合わせにAIを使用する" field="is_enabled" />
                      <ToggleRow label="自動回答" desc="問い合わせ受信時に自動でAI回答を生成" field="auto_reply_enabled" />
                      <ToggleRow label="管理者承認後送信" desc="生成した回答は管理者が確認・承認してから送信" field="require_admin_approval" />
                      <div className="py-3 border-b last:border-0 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700">WEB検索</p>
                          <p className="text-xs text-slate-400">Q&A対応ではWEB検索は使用しません（固定）</p>
                        </div>
                        <Switch checked={false} disabled className="opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-base">モデル設定</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">使用モデル</label>
                        <Select value={settings.model_name} onValueChange={v => setSettings(p => ({ ...p, model_name: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MODEL_OPTIONS.map(m => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">回答トーン</label>
                        <Select value={settings.response_tone} onValueChange={v => setSettings(p => ({ ...p, response_tone: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="formal">丁寧・フォーマル</SelectItem>
                            <SelectItem value="friendly">親しみやすい</SelectItem>
                            <SelectItem value="casual">カジュアル</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">回答最大文字数</label>
                        <Input
                          type="number" value={settings.max_answer_length}
                          onChange={e => setSettings(p => ({ ...p, max_answer_length: parseInt(e.target.value) || 1000 }))}
                          className="w-32"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-base">プロンプト設定</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">システムプロンプト</label>
                        <Textarea
                          value={settings.system_prompt || ''}
                          onChange={e => setSettings(p => ({ ...p, system_prompt: e.target.value }))}
                          placeholder="AIの役割・振る舞いを定義するプロンプト"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Q&A専用プロンプト</label>
                        <Textarea
                          value={settings.qa_prompt || ''}
                          onChange={e => setSettings(p => ({ ...p, qa_prompt: e.target.value }))}
                          placeholder="問い合わせ回答時の追加指示"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">NGルール</label>
                        <Textarea
                          value={settings.ng_rules || ''}
                          onChange={e => setSettings(p => ({ ...p, ng_rules: e.target.value }))}
                          placeholder="回答してはいけない内容・禁止事項"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-base">ナレッジ活用設定</CardTitle></CardHeader>
                    <CardContent>
                      <ToggleRow label="ナレッジ利用" desc="登録ナレッジをAI回答に活用" field="knowledge_enabled" />
                      <ToggleRow label="類似Q&A参照" desc="過去の問い合わせ・回答を参照" field="similar_qa_reference" />
                      <ToggleRow label="問い合わせから自動ナレッジ化" desc="解決済み問い合わせを自動でナレッジに追加" field="auto_knowledge_from_inquiries" />
                      <ToggleRow label="回答から自動ナレッジ化" desc="承認済み回答を自動でナレッジに追加" field="auto_knowledge_from_answers" />
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-700 gap-2"
                    >
                      {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      設定を保存
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* ナレッジ管理タブ */}
            <TabsContent value="knowledge" className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setShowNewKnowledge(!showNewKnowledge)}
                  className="bg-amber-600 hover:bg-amber-700 gap-2"
                >
                  <Plus className="w-4 h-4" />手動追加
                </Button>
              </div>

              {showNewKnowledge && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4 space-y-3">
                    <Input
                      value={newKnowledge.title}
                      onChange={e => setNewKnowledge(p => ({ ...p, title: e.target.value }))}
                      placeholder="ナレッジタイトル"
                    />
                    <Textarea
                      value={newKnowledge.content}
                      onChange={e => setNewKnowledge(p => ({ ...p, content: e.target.value }))}
                      placeholder="ナレッジ本文（Q&A形式や手順書など）"
                      rows={5}
                    />
                    <Input
                      value={newKnowledge.tags}
                      onChange={e => setNewKnowledge(p => ({ ...p, tags: e.target.value }))}
                      placeholder="タグ（カンマ区切り）"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setShowNewKnowledge(false)}>キャンセル</Button>
                      <Button
                        size="sm"
                        onClick={() => addKnowledgeMutation.mutate()}
                        disabled={!newKnowledge.title || !newKnowledge.content || addKnowledgeMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {addKnowledgeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '追加'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {knowledgeLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : knowledgeList.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">ナレッジが登録されていません</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {knowledgeList.map(k => (
                    <Card key={k.id} className={!k.is_active ? 'opacity-50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge className={`${SOURCE_COLOR[k.source_type]} text-xs`}>
                                {SOURCE_LABEL[k.source_type]}
                              </Badge>
                              {!k.is_active && <Badge className="bg-slate-100 text-slate-500 text-xs">無効</Badge>}
                              <span className="font-medium text-slate-800 text-sm truncate">{k.title}</span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{k.content}</p>
                            {k.tags?.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {k.tags.map(t => (
                                  <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {k.updated_date && format(new Date(k.updated_date), 'yyyy/MM/dd HH:mm')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm" variant="ghost"
                              title={k.is_active ? '無効化' : '有効化'}
                              onClick={() => toggleKnowledgeMutation.mutate({ id: k.id, is_active: !k.is_active })}
                            >
                              <ToggleLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('削除しますか？')) deleteKnowledgeMutation.mutate(k.id); }}
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
            </TabsContent>

            {/* ナレッジ候補タブ */}
            <TabsContent value="candidates" className="mt-4 space-y-4">
              <p className="text-sm text-slate-500">解決済み問い合わせからQ&Aペアとしてナレッジを生成できます。</p>
              {resolvedInquiries.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-slate-400 text-sm">
                    解決済みの問い合わせがありません
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {resolvedInquiries.map(inq => (
                    <Card key={inq.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{inq.subject}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {inq.category && <span className="mr-2">{inq.category}</span>}
                              {inq.created_date && format(new Date(inq.created_date), 'yyyy/MM/dd')}
                              {inq.knowledge_candidate_created && (
                                <span className="ml-2 text-green-600">✓ ナレッジ化済</span>
                              )}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={inq.knowledge_candidate_created || createFromInquiryMutation.isPending}
                            onClick={() => createFromInquiryMutation.mutate(inq.id)}
                            className="gap-1 shrink-0"
                          >
                            {createFromInquiryMutation.isPending
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <RefreshCw className="w-3 h-3" />
                            }
                            ナレッジ化
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}