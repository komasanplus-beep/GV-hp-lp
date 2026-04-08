/**
 * AIPostGeneratorPanel
 * AI記事生成パネル - AdminPostEdit に埋め込んで使用
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Globe, FileText, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

const TARGET_AUDIENCES = [
  '新規客向け',
  'リピーター向け',
  '保護者向け',
  '宿泊検討者向け',
  '女性向け',
  '男性向け',
  'シニア向け',
];

const POST_TYPES = [
  { value: 'news',       label: 'お知らせ' },
  { value: 'blog',       label: 'ブログ' },
  { value: 'staff_blog', label: 'スタッフブログ' },
  { value: 'column',     label: 'コラム' },
  { value: 'campaign',   label: 'キャンペーン' },
];

export default function AIPostGeneratorPanel({ siteId, onGenerated, onClose }) {
  const [form, setForm] = useState({
    target_audience: '新規客向け',
    post_type: 'blog',
    theme: '',
    reference_text: '',
    reference_url: '',
    use_web_search: false,
    seo_enabled: false,
    seo_keywords: '',
  });
  const [fileUrls, setFileUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedWebSearch, setUsedWebSearch] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(file => base44.integrations.Core.UploadFile({ file }))
      );
      setFileUrls(prev => [...prev, ...uploaded.map(r => r.file_url)]);
      toast.success(`${files.length}件のファイルを添付しました`);
    } catch (err) {
      toast.error('ファイルのアップロードに失敗しました');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!form.theme.trim()) {
      toast.error('どんな記事にしたいか を入力してください');
      return;
    }
    setIsGenerating(true);
    setUsedWebSearch(false);
    try {
      const res = await base44.functions.invoke('generatePostWithAI', {
        site_id: siteId,
        target_audience: form.target_audience,
        post_type: form.post_type,
        theme: form.theme,
        reference_text: form.reference_text,
        reference_url: form.reference_url,
        file_urls: fileUrls,
        use_web_search: form.use_web_search,
        seo_enabled: form.seo_enabled,
        seo_keywords: form.seo_keywords,
      });

      if (res.data?.blocked) {
        toast.error(res.data?.error || 'AI記事生成が利用できません');
        return;
      }

      const generated = res.data?.data;
      if (!generated) throw new Error('生成結果が空です');

      setUsedWebSearch(res.data?.used_web_search === true);
      onGenerated(generated);
      toast.success('AI記事を生成しました');
    } catch (err) {
      toast.error('生成に失敗しました: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">AI記事生成</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 対象 */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">対象読者</label>
        <div className="flex flex-wrap gap-1.5">
          {TARGET_AUDIENCES.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setForm(p => ({ ...p, target_audience: a }))}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                form.target_audience === a
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-violet-400'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* 記事種類 */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">記事の種類</label>
        <Select value={form.post_type} onValueChange={v => setForm(p => ({ ...p, post_type: v }))}>
          <SelectTrigger className="h-8 text-sm bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* テーマ */}
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">
          どんな記事にしたいか <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={form.theme}
          onChange={e => setForm(p => ({ ...p, theme: e.target.value }))}
          placeholder="例：梅雨に向けて縮毛矯正のキャンペーン告知。湿気で悩む女性に共感しつつ、割引情報をさりげなく伝えたい"
          rows={3}
          className="text-sm resize-none bg-white"
        />
      </div>

      {/* 参考情報 */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-600 block">参考情報（任意）</label>
        <Textarea
          value={form.reference_text}
          onChange={e => setForm(p => ({ ...p, reference_text: e.target.value }))}
          placeholder="参考テキスト（サービス詳細、ブランドの声など）"
          rows={2}
          className="text-xs resize-none bg-white"
        />
        <Input
          value={form.reference_url}
          onChange={e => setForm(p => ({ ...p, reference_url: e.target.value }))}
          placeholder="参考URL（任意）"
          className="text-xs h-8 bg-white"
        />

        {/* ファイル添付 */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer w-fit text-xs text-slate-600 border border-slate-300 bg-white rounded-lg px-3 py-1.5 hover:border-violet-400 transition-colors">
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            画像・PDFを添付
            <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
          {fileUrls.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {fileUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-1 bg-violet-100 text-violet-700 text-xs px-2 py-1 rounded-full">
                  <FileText className="w-3 h-3" />
                  <span>添付{i + 1}</span>
                  <button type="button" onClick={() => setFileUrls(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* オプション */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.use_web_search}
            onChange={e => setForm(p => ({ ...p, use_web_search: e.target.checked }))}
            className="w-3.5 h-3.5 accent-violet-600"
          />
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-600">Web検索を使う</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.seo_enabled}
            onChange={e => setForm(p => ({ ...p, seo_enabled: e.target.checked }))}
            className="w-3.5 h-3.5 accent-violet-600"
          />
          <span className="text-xs text-slate-600">SEOを意識する</span>
        </label>
      </div>

      {form.seo_enabled && (
        <Input
          value={form.seo_keywords}
          onChange={e => setForm(p => ({ ...p, seo_keywords: e.target.value }))}
          placeholder="狙いたいキーワード（例：縮毛矯正 渋谷 安い）"
          className="text-xs h-8 bg-white"
        />
      )}

      {usedWebSearch && (
        <p className="text-xs text-violet-600 flex items-center gap-1">
          <Globe className="w-3 h-3" />Web検索の情報を参考にして生成しました
        </p>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !form.theme.trim()}
        className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
      >
        {isGenerating
          ? <><Loader2 className="w-4 h-4 animate-spin" />生成中...</>
          : <><Sparkles className="w-4 h-4" />AIで記事を生成</>
        }
      </Button>
    </div>
  );
}