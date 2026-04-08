/**
 * AIBlogGeneratorPanel
 * WordPressレベルのAI記事生成
 * AI→記事挿入まで一気通貫
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, ChevronUp, Sparkles, Loader2, CheckCircle, Upload, Wand2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const TONES = [
  { value: 'polite', label: '丁寧' },
  { value: 'casual', label: 'カジュアル' },
  { value: 'expert', label: '専門的' },
];

export default function AIBlogGeneratorPanel({ siteId, onArticleInsert }) {
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState({
    prompt: '',
    max_chars: 2000,
    tone: 'polite',
    seo_keywords: '',
    region: '',
    use_web_search: false,
  });
  const [fileUrls, setFileUrls] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(f => base44.integrations.Core.UploadFile({ file: f }))
      );
      setFileUrls(prev => [...prev, ...uploaded.map(r => r.file_url)]);
      toast.success(`${files.length}件添付しました`);
    } catch {
      toast.error('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!form.prompt.trim()) {
      toast.error('記事のテーマを入力してください');
      return;
    }

    setIsGenerating(true);
    setGenerated(null);
    try {
      const res = await base44.functions.invoke('generateBlogArticleAI', {
        site_id: siteId,
        prompt: form.prompt,
        max_chars: form.max_chars,
        tone: form.tone,
        seo_keywords: form.seo_keywords,
        region: form.region,
        use_web_search: form.use_web_search,
        file_urls: fileUrls,
      });

      if (res.data?.blocked || res.status === 429) {
        toast.error('AI生成回数の上限に達しました');
        return;
      }

      setGenerated(res.data?.data);
      toast.success('記事を生成しました！');
    } catch (err) {
      toast.error('生成に失敗しました: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-200 overflow-hidden">
      {/* ━━━ ヘッダ ━━━ */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 transition-all"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <div className="text-left">
            <h3 className="font-bold">AIで記事を作成</h3>
            <p className="text-xs opacity-90">プロンプト入力で記事を自動生成</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {/* ━━━ メイン入力 ━━━ */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              📝 テーマ・内容指定
            </label>
            <Textarea
              value={form.prompt}
              onChange={(e) => setForm(p => ({ ...p, prompt: e.target.value }))}
              placeholder="例：30代女性向けに、肩こり改善のセルフケア方法を紹介したい"
              rows={3}
              className="text-sm resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{form.prompt.length}字</p>
          </div>

          {/* ━━━ オプション ━━━ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                文字数
              </label>
              <Input
                type="number"
                value={form.max_chars}
                onChange={(e) => setForm(p => ({ ...p, max_chars: parseInt(e.target.value) }))}
                min={500}
                max={3000}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                トーン
              </label>
              <Select
                value={form.tone}
                onValueChange={(v) => setForm(p => ({ ...p, tone: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ━━━ SEO設定 ━━━ */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              🔍 SEOキーワード
            </label>
            <Input
              value={form.seo_keywords}
              onChange={(e) => setForm(p => ({ ...p, seo_keywords: e.target.value }))}
              placeholder="例：肩こり, セルフケア, 改善方法"
              className="text-sm"
            />
          </div>

          {/* ━━━ ローカルSEO ━━━ */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              📍 地域（ローカルSEO）
            </label>
            <Input
              value={form.region}
              onChange={(e) => setForm(p => ({ ...p, region: e.target.value }))}
              placeholder="例：渋谷, 東京"
              className="text-sm"
            />
          </div>

          {/* ━━━ 参考資料 ━━━ */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              📎 参考資料（PDF/URL）
            </label>
            <label className="flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-violet-300 rounded-lg cursor-pointer hover:bg-violet-100 transition-colors">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              ) : (
                <Upload className="w-4 h-4 text-violet-600" />
              )}
              <span className="text-xs text-slate-600">PDFやスクリーンショットをアップロード</span>
              <input
                type="file"
                accept=".pdf,image/*"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            {fileUrls.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">{fileUrls.length}個の参考資料が添付されています</p>
            )}
          </div>

          {/* ━━━ Web検索 ━━━ */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.use_web_search}
              onChange={(e) => setForm(p => ({ ...p, use_web_search: e.target.checked }))}
              className="w-4 h-4 accent-violet-600"
            />
            <span className="text-xs text-slate-700">Web検索を使用する（最新情報を含める）</span>
          </label>

          {/* ━━━ 生成ボタン ━━━ */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !form.prompt.trim()}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2 h-10"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                AIで記事作成
              </>
            )}
          </Button>

          {/* ━━━ 生成結果 ━━━ */}
          {generated && (
            <GeneratedBlogPreview
              generated={generated}
              onInsert={onArticleInsert}
              onRegenerate={handleGenerate}
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 生成結果プレビュー
 */
function GeneratedBlogPreview({ generated, onInsert, onRegenerate }) {
  return (
    <div className="border-2 border-green-300 rounded-lg overflow-hidden bg-white mt-4">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">生成完了</span>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {generated.title && (
          <div>
            <p className="text-xs text-slate-400 mb-1">タイトル</p>
            <p className="font-bold text-lg text-slate-800">{generated.title}</p>
          </div>
        )}
        {generated.excerpt && (
          <div>
            <p className="text-xs text-slate-400 mb-1">抜粋</p>
            <p className="text-sm text-slate-600 leading-relaxed">{generated.excerpt}</p>
          </div>
        )}
        {generated.blocks && (
          <div>
            <p className="text-xs text-slate-400 mb-2">ブロック構成（{generated.blocks.length}個）</p>
            <div className="space-y-1 text-xs">
              {generated.blocks.slice(0, 5).map((b, i) => (
                <div key={i} className="text-slate-600">
                  • {b.type === 'heading' ? `見出しH${b.level}: ` : '段落: '}
                  {(b.content || '').substring(0, 50)}...
                </div>
              ))}
              {generated.blocks.length > 5 && (
                <p className="text-slate-500">ほか {generated.blocks.length - 5} ブロック</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-2">
        <Button
          onClick={() => onInsert(generated)}
          className="w-full bg-green-600 hover:bg-green-700 gap-2 text-white"
        >
          <CheckCircle className="w-4 h-4" />
          この記事をエディタに挿入
        </Button>
        <Button
          onClick={onRegenerate}
          variant="outline"
          className="w-full gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          再生成
        </Button>
      </div>
    </div>
  );
}