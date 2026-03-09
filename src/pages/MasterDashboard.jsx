import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Users, ToggleLeft, Settings, BookOpen, FileText, ArrowRight, CreditCard, Globe, Layout, Layers, LayoutDashboard, Plus, Pencil, Trash2, StickyNote, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

const cards = [
  { name: 'ユーザー管理', desc: 'ユーザーアカウント・停止', icon: Users, page: 'MasterUsers', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { name: '機能制御', desc: '機能ON/OFF・使用制限設定', icon: ToggleLeft, page: 'MasterFeatureControl', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'プラン管理', desc: 'サブスクリプションプラン', icon: CreditCard, page: 'MasterPlans', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { name: 'サイト一覧', desc: '全ユーザーのサイト管理', icon: Layout, page: 'MasterSiteList', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { name: 'LP一覧', desc: '全ユーザーのLP管理', icon: Layers, page: 'MasterLPList', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { name: 'ドメイン一覧', desc: 'ドメイン設定・検証管理', icon: Globe, page: 'MasterDomainList', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { name: 'テンプレート', desc: 'サイトテンプレート管理', icon: LayoutDashboard, page: 'MasterTemplates', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { name: 'AI設定', desc: 'AIモデル・プロンプト設定', icon: Settings, page: 'MasterAISettings', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'AIナレッジ', desc: 'ナレッジ登録・管理', icon: BookOpen, page: 'MasterAIKnowledge', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { name: 'システムログ', desc: 'システムログの確認', icon: FileText, page: 'MasterSystemLogs', color: 'bg-slate-50 border-slate-200 text-slate-700' },
];

export default function MasterDashboard() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newMemo, setNewMemo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const { data: memos = [] } = useQuery({
    queryKey: ['masterMemos'],
    queryFn: () => base44.entities.MasterMemo.list('-created_date'),
  });

  const addMutation = useMutation({
    mutationFn: (text) => base44.entities.MasterMemo.create({ memo_text: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterMemos'] });
      setNewMemo('');
      setShowAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, text }) => base44.entities.MasterMemo.update(id, { memo_text: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterMemos'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MasterMemo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterMemos'] }),
  });

  const startEdit = (memo) => {
    setEditingId(memo.id);
    setEditText(memo.memo_text);
  };

  return (
    <MasterLayout title="システム管理">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Master管理画面</h2>
          <p className="text-violet-200 text-sm">ユーザー管理・AI設定・ナレッジ登録・使用制限の管理ができます</p>
        </div>

        {/* 管理メモ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <StickyNote className="w-4 h-4" />管理メモ
            </h3>
            <Button size="sm" onClick={() => setShowAdd(v => !v)} className="bg-violet-600 hover:bg-violet-700 gap-1">
              <Plus className="w-3.5 h-3.5" />メモ追加
            </Button>
          </div>

          {showAdd && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-3">
              <Textarea
                value={newMemo}
                onChange={e => setNewMemo(e.target.value)}
                placeholder="メモを入力..."
                rows={3}
                className="mb-3"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setNewMemo(''); }}>
                  <X className="w-3.5 h-3.5 mr-1" />キャンセル
                </Button>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700" disabled={!newMemo.trim() || addMutation.isPending} onClick={() => addMutation.mutate(newMemo.trim())}>
                  <Check className="w-3.5 h-3.5 mr-1" />保存
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {memos.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">メモがありません</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">日付</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">メモ内容</th>
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {memos.map(memo => (
                    <tr key={memo.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {memo.created_date ? format(new Date(memo.created_date), 'yyyy-MM-dd') : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {editingId === memo.id ? (
                          <div className="flex gap-2 items-start">
                            <Textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              rows={2}
                              className="flex-1 text-sm"
                              autoFocus
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateMutation.mutate({ id: memo.id, text: editText })}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => setEditingId(null)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap">{memo.memo_text}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId !== memo.id && (
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(memo)}>
                              <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(memo.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 機能カード */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">管理メニュー</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cards.map((card) => (
              <Link
                key={card.name}
                to={createPageUrl(card.page)}
                className={`border rounded-xl p-4 hover:shadow-md transition-all group ${card.color}`}
              >
                <card.icon className="w-6 h-6 mb-2" />
                <p className="font-semibold text-sm">{card.name}</p>
                <p className="text-xs opacity-70 mt-0.5 leading-tight">{card.desc}</p>
                <div className="flex justify-end mt-2">
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}