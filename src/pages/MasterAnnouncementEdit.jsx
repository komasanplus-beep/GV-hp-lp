import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save, Send, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PLAN_OPTIONS = ['free', 'starter', 'business', 'enterprise'];
const CATEGORY_OPTIONS = ['salon', 'beauty', 'clinic', 'fitness', 'school', 'general'];

const INITIAL = {
  title: '',
  body: '',
  status: 'draft',
  is_important: false,
  target_mode: 'all',
  target_filters: { site_type: [], template_categories: [], plans: [] },
  target_user_ids: [],
  attachment_urls: [],
  publish_start_at: '',
  publish_end_at: '',
};

export default function MasterAnnouncementEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  const [form, setForm] = useState(INITIAL);
  const [uploading, setUploading] = useState(false);
  const [targetUserInput, setTargetUserInput] = useState('');

  const { data: existing, isLoading } = useQuery({
    queryKey: ['announcement', editId],
    queryFn: () => editId
      ? base44.entities.MasterAnnouncement.filter({ id: editId }).then(r => r[0])
      : Promise.resolve(null),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        ...INITIAL,
        ...existing,
        target_filters: existing.target_filters || { site_type: [], template_categories: [], plans: [] },
        target_user_ids: existing.target_user_ids || [],
        attachment_urls: existing.attachment_urls || [],
        publish_start_at: existing.publish_start_at
          ? new Date(existing.publish_start_at).toISOString().slice(0, 16) : '',
        publish_end_at: existing.publish_end_at
          ? new Date(existing.publish_end_at).toISOString().slice(0, 16) : '',
      });
      setTargetUserInput((existing.target_user_ids || []).join('\n'));
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async (status) => {
      const data = {
        ...form,
        status,
        target_user_ids: targetUserInput.split('\n').map(s => s.trim()).filter(Boolean),
        publish_start_at: form.publish_start_at ? new Date(form.publish_start_at).toISOString() : null,
        publish_end_at: form.publish_end_at ? new Date(form.publish_end_at).toISOString() : null,
        web_search_enabled: false,
      };
      if (editId) {
        return base44.entities.MasterAnnouncement.update(editId, data);
      } else {
        return base44.entities.MasterAnnouncement.create(data);
      }
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['masterAnnouncements'] });
      toast.success(status === 'published' ? '公開しました' : '下書き保存しました');
      navigate('/MasterAnnouncements');
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, attachment_urls: [...prev.attachment_urls, res.file_url] }));
    setUploading(false);
    toast.success('ファイルをアップロードしました');
  };

  const toggleFilter = (key, value) => {
    setForm(prev => {
      const arr = prev.target_filters[key] || [];
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      return { ...prev, target_filters: { ...prev.target_filters, [key]: next } };
    });
  };

  if (isLoading) return (
    <MasterLayout currentPageName="MasterAnnouncementEdit">
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    </MasterLayout>
  );

  return (
    <MasterLayout currentPageName="MasterAnnouncementEdit">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/MasterAnnouncements">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-800">{editId ? 'お知らせ編集' : '新規お知らせ作成'}</h1>
        </div>

        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle className="text-base">基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">件名 *</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="件名を入力" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">本文</label>
              <Textarea
                value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="お知らせ本文を入力" rows={8}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_important}
                onCheckedChange={v => setForm(p => ({ ...p, is_important: v }))}
              />
              <label className="text-sm font-medium text-slate-700">重要通知として表示</label>
            </div>
          </CardContent>
        </Card>

        {/* 添付ファイル */}
        <Card>
          <CardHeader><CardTitle className="text-base">添付ファイル</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 hover:text-blue-800">
              <Upload className="w-4 h-4" />
              {uploading ? 'アップロード中...' : 'ファイルを追加'}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
            {form.attachment_urls.map((url, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                  添付ファイル {i + 1}
                </a>
                <button
                  onClick={() => setForm(p => ({ ...p, attachment_urls: p.attachment_urls.filter((_, j) => j !== i) }))}
                  className="text-red-400 hover:text-red-600 text-xs"
                >削除</button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 公開期間 */}
        <Card>
          <CardHeader><CardTitle className="text-base">公開期間</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">公開開始日時</label>
              <Input type="datetime-local" value={form.publish_start_at} onChange={e => setForm(p => ({ ...p, publish_start_at: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">公開終了日時</label>
              <Input type="datetime-local" value={form.publish_end_at} onChange={e => setForm(p => ({ ...p, publish_end_at: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        {/* 配信対象 */}
        <Card>
          <CardHeader><CardTitle className="text-base">配信対象</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={form.target_mode} onValueChange={v => setForm(p => ({ ...p, target_mode: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全利用ユーザー</SelectItem>
                <SelectItem value="filter">条件フィルター</SelectItem>
                <SelectItem value="selected_users">個別ユーザー指定</SelectItem>
              </SelectContent>
            </Select>

            {form.target_mode === 'filter' && (
              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">サービス種別</p>
                  <div className="flex gap-2">
                    {['homepage', 'lp'].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleFilter('site_type', v)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
                          (form.target_filters.site_type || []).includes(v)
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-slate-200 text-slate-600 hover:border-amber-300'
                        }`}
                      >
                        {v === 'homepage' ? 'ホームページ' : 'LP'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">テンプレートカテゴリ</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleFilter('template_categories', v)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
                          (form.target_filters.template_categories || []).includes(v)
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-slate-200 text-slate-600 hover:border-amber-300'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">プラン</p>
                  <div className="flex flex-wrap gap-2">
                    {PLAN_OPTIONS.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleFilter('plans', v)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
                          (form.target_filters.plans || []).includes(v)
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-slate-200 text-slate-600 hover:border-amber-300'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.target_mode === 'selected_users' && (
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">ユーザーID（1行に1件）</label>
                <Textarea
                  value={targetUserInput}
                  onChange={e => setTargetUserInput(e.target.value)}
                  placeholder="user_id1&#10;user_id2"
                  rows={4}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex gap-3 justify-end pb-8">
          <Button variant="outline" onClick={() => saveMutation.mutate('draft')} disabled={saveMutation.isPending || !form.title}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            下書き保存
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 gap-2"
            onClick={() => saveMutation.mutate('published')}
            disabled={saveMutation.isPending || !form.title}
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            公開する
          </Button>
          {form.status === 'published' && (
            <Button variant="outline" className="text-red-600 border-red-200" onClick={() => saveMutation.mutate('archived')}>
              公開停止
            </Button>
          )}
        </div>
      </div>
    </MasterLayout>
  );
}