import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-3-5-sonnet', 'claude-3-haiku'];

export default function MasterAISettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId') || 'global';
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['masterUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const { data: settingsList = [] } = useQuery({
    queryKey: ['aiSettings', userId],
    queryFn: () => base44.entities.AISettings.filter({ user_id: userId }),
  });
  const setting = settingsList[0];

  const [form, setForm] = useState({
    model: 'gpt-4o', temperature: 0.7, max_tokens: 4096,
    system_prompt: '', knowledge: '', web_search: true, lmo_mode: true,
  });

  useEffect(() => {
    if (setting) setForm({ model: 'gpt-4o', temperature: 0.7, max_tokens: 4096, system_prompt: '', knowledge: '', web_search: true, lmo_mode: true, ...setting });
  }, [setting]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (setting) return base44.entities.AISettings.update(setting.id, data);
      return base44.entities.AISettings.create({ user_id: userId, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aiSettings', userId] }),
  });

  return (
    <MasterLayout title="AI設定">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">AI設定</h3>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-500">対象ユーザー</Label>
              <select
                className="border border-slate-200 rounded-md px-2 py-1 text-sm"
                value={userId}
                onChange={e => { const u = e.target.value; window.location.href = `?userId=${u}`; }}
              >
                <option value="global">グローバル設定</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.store_name || u.email}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500">モデル</Label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}>
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500">Temperature (0-1)</Label>
                <Input type="number" min={0} max={1} step={0.1} value={form.temperature}
                  onChange={e => setForm(f => ({ ...f, temperature: parseFloat(e.target.value) }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Max Tokens</Label>
                <Input type="number" value={form.max_tokens}
                  onChange={e => setForm(f => ({ ...f, max_tokens: parseInt(e.target.value) }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">システムプロンプト</Label>
              <Textarea rows={4} value={form.system_prompt}
                onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">ナレッジ（追加コンテキスト）</Label>
              <Textarea rows={3} value={form.knowledge}
                onChange={e => setForm(f => ({ ...f, knowledge: e.target.value }))} className="mt-1" />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <Label className="text-slate-700">Web検索を使用</Label>
              <Switch checked={form.web_search} onCheckedChange={val => setForm(f => ({ ...f, web_search: val }))} />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <Label className="text-slate-700">LMOモード（AI検索最適化）</Label>
              <Switch checked={form.lmo_mode} onCheckedChange={val => setForm(f => ({ ...f, lmo_mode: val }))} />
            </div>
          </div>
          <Button className="mt-4 bg-violet-600 hover:bg-violet-700 w-full" disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate(form)}>
            {saveMutation.isPending ? '保存中...' : '設定を保存'}
          </Button>
        </div>
      </div>
    </MasterLayout>
  );
}