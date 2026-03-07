import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const TYPE_LABELS = { copy: 'コピー', cta: 'CTA', structure: '構造' };
const TYPE_COLORS = { copy: 'bg-blue-100 text-blue-800', cta: 'bg-amber-100 text-amber-800', structure: 'bg-green-100 text-green-800' };

export default function MasterAIKnowledge() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ type: 'copy', title: '', content: '' });

  const { data: items = [] } = useQuery({
    queryKey: ['aiKnowledge'],
    queryFn: () => base44.entities.AIKnowledge.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editItem) return base44.entities.AIKnowledge.update(editItem.id, data);
      return base44.entities.AIKnowledge.create({ user_id: 'global', ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiKnowledge'] });
      setShowForm(false); setEditItem(null); setForm({ type: 'copy', title: '', content: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AIKnowledge.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aiKnowledge'] }),
  });

  const openEdit = (item) => { setEditItem(item); setForm({ type: item.type, title: item.title, content: item.content }); setShowForm(true); };
  const openCreate = () => { setEditItem(null); setForm({ type: 'copy', title: '', content: '' }); setShowForm(true); };

  return (
    <MasterLayout title="AIナレッジ">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">AIナレッジ管理</h2>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />追加
        </Button>
      </div>

      <div className="grid gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${TYPE_COLORS[item.type]}`}>{TYPE_LABELS[item.type]}</span>
                <span className="font-medium text-slate-800">{item.title}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{item.content}</p>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-12 text-slate-400">ナレッジがありません</div>}
      </div>

      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditItem(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'ナレッジ編集' : 'ナレッジ追加'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-slate-500">種類</Label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">タイトル</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">内容</Label>
              <Textarea rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>キャンセル</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" disabled={!form.title || saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}>
              {saveMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MasterLayout>
  );
}