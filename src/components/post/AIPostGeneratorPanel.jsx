/**
 * AIPostGeneratorPanel
 * プロ水準のAI記事生成パネル
 * 右サイドバーに常設表示（AdminPostEdit 2カラムレイアウト）
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import AILimitUpgradeModal from '@/components/ai/AILimitUpgradeModal';
import {
  Loader2, Sparkles, Globe, FileText, Upload, X, RefreshCw,
  ChevronDown, ChevronUp, CheckCircle2, Wand2, Copy
} from 'lucide-react';
import { toast } from 'sonner';

const POST_TYPES = [
  { value: 'news',       label: 'お知らせ' },
  { value: 'blog',       label: 'ブログ' },
  { value: 'staff_blog', label: 'スタッフブログ' },
  { value: 'column',     label: 'コラム' },
  { value: 'campaign',   label: 'キャンペーン' },
];

const TONES = [
  { value: 'polite',     label: '丁寧' },
  { value: 'casual',     label: 'カジュアル' },
  { value: 'luxury',     label: '高級感' },
  { value: 'friendly',   label: '親しみやすい' },
];

const LENGTHS = [
  { value: 'short',   label: '短め（600字）' },
  { value: 'medium',  label: '普通（1200字）' },
  { value: 'long',    label: '長め（2000字）' },
];

const AUDIENCE_CHIPS = [
  '新規客向け', 'リピーター向け', '宿泊検討者', '美容初心者',
  '女性向け', 'シニア向け', '保護者向け', 'ビジネス層向け',
];

const DEFAULT_FORM = {
  post_type: 'blog',
  target_audience: '新規客向け',
  content_instruction: '',
  tone: 'friendly',
  length: 'medium',
  reference_text: '',
  reference_url: '',
  // sources
  use_input: true,
  use_attachments: false,
  use_web_search: false,
  use_url: false,
  // seo
  seo_enabled: false,
  seo_keywords: '',
  seo_optimize_title: false,
};

export default function AIPostGeneratorPanel({ siteId, onApplyAll, onApplyTitle, canUseAI }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [fileUrls, setFileUrls]   = useState([]);
  const [fileNames, setFileNames] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated]       = useState(null);
  const [usedWebSearch, setUsedWebSearch] = useState(false);
  const [openSection, setOpenSection]   = useState({ basic: true, content: true, refs: false, sources: false, seo: false });

  // ━━━ AI利用上限到達時の課金モーダル ━━━
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitData, setLimitData] = useState(null);

  const toggle = (key) => setOpenSection(p => ({ ...p, [key]: !p[key] }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f })));
      setFileUrls(prev => [...prev, ...uploaded.map(r => r.file_url)]);
      setFileNames(prev => [...prev, ...files.map(f => f.name)]);
      setForm(p => ({ ...p, use_attachments: true }));
      toast.success(`${files.length}件添付しました`);
    } catch {
      toast.error('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = (i) => {
    setFileUrls(prev => prev.filter((_, j) => j !== i));
    setFileNames(prev => prev.filter((_, j) => j !== i));
    if (fileUrls.length <= 1) setForm(p => ({ ...p, use_attachments: false }));
  };

  const handleGenerate = async () => {
    if (!form.content_instruction.trim()) {
      toast.error('記事の内容を入力してください');
      return;
    }
    setIsGenerating(true);
    setGenerated(null);
    setUsedWebSearch(false);
    try {
      const res = await base44.functions.invoke('generatePostWithAI', {
        site_id: siteId,
        post_type: form.post_type,
        target_audience: form.target_audience,
        content_instruction: form.content_instruction,
        tone: form.tone,
        length: form.length,
        reference_text: form.use_input ? form.reference_text : '',
        reference_url: form.use_url ? form.reference_url : '',
        file_urls: form.use_attachments ? fileUrls : [],
        use_web_search: form.use_web_search,
        seo_enabled: form.seo_enabled,
        seo_keywords: form.seo_enabled ? form.seo_keywords : '',
        seo_optimize_title: form.seo_enabled && form.seo_optimize_title,
      });

      if (res.data?.blocked) {
        toast.error(res.data?.error || 'AI記事生成が利用できません');
        return;
      }

      // 利用上限到達時：課金誘導モーダル表示
      if (res.data?.source === 'limit_exceeded' || res.status === 429) {
        setLimitData(res.data?.limitData || {
          used: res.data?.used,
          limit: res.data?.limit,
          remaining: res.data?.remaining,
          plan_code: res.data?.plan_code,
        });
        setLimitModalOpen(true);
        return;
      }

      const data = res.data?.data;
      if (!data) throw new Error('生成結果が空です');

      setGenerated(data);
      setUsedWebSearch(res.data?.used_web_search === true);
      toast.success('生成完了！');
    } catch (err) {
      toast.error('生成に失敗しました: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = form.content_instruction.trim().length > 0 && !isGenerating;

  // ── ロック表示 ──
  if (!canUseAI) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-3">
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">AI記事生成</p>
        <p className="text-xs text-slate-400">ご利用のプランではAI記事生成機能が利用できません。</p>
        <Badge variant="outline" className="text-xs">プランをアップグレード</Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm leading-none">AI記事生成</h3>
            <p className="text-xs text-slate-400 mt-0.5">3分で高品質なSEO記事を作成</p>
          </div>
        </div>
        {generated?.used !== undefined && generated?.limit && (
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            残り <span className="font-bold text-violet-600">{generated.limit - (generated.used || 0)}</span> / {generated.limit}回
          </Badge>
        )}
      </div>

      {/* ━━━ ① 基本設定 ━━━ */}
      <SectionBlock title="① 基本設定" open={openSection.basic} onToggle={() => toggle('basic')}>
        <div className="space-y-3">
          <div>
            <label className="label-xs">記事タイプ</label>
            <Select value={form.post_type} onValueChange={v => setForm(p => ({ ...p, post_type: v }))}>
              <SelectTrigger className="h-8 text-sm bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-xs">ターゲット読者</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {AUDIENCE_CHIPS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, target_audience: a }))}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    form.target_audience === a
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <Input
              value={form.target_audience}
              onChange={e => setForm(p => ({ ...p, target_audience: e.target.value }))}
              placeholder="自由入力も可"
              className="h-8 text-xs mt-2 bg-white"
            />
          </div>
        </div>
      </SectionBlock>

      {/* ━━━ ② 内容指示 ━━━ */}
      <SectionBlock title="② 内容指示" open={openSection.content} onToggle={() => toggle('content')}>
        <div className="space-y-3">
          <div>
            <label className="label-xs">
              記事の内容 <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={form.content_instruction}
              onChange={e => setForm(p => ({ ...p, content_instruction: e.target.value }))}
              placeholder={"どんな記事を書きたいか具体的に入力\n\n例：\n・新メニューの紹介\n・夏キャンペーンの告知\n・髪質改善のメリット"}
              rows={4}
              className="text-sm resize-none bg-white mt-1"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.content_instruction.length}字</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label-xs">トーン</label>
              <Select value={form.tone} onValueChange={v => setForm(p => ({ ...p, tone: v }))}>
                <SelectTrigger className="h-8 text-xs bg-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="label-xs">文章量</label>
              <Select value={form.length} onValueChange={v => setForm(p => ({ ...p, length: v }))}>
                <SelectTrigger className="h-8 text-xs bg-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTHS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </SectionBlock>

      {/* ━━━ ③ 参考情報 ━━━ */}
      <SectionBlock title="③ 参考情報（任意）" open={openSection.refs} onToggle={() => toggle('refs')}>
        <div className="space-y-2">
          <Textarea
            value={form.reference_text}
            onChange={e => setForm(p => ({ ...p, reference_text: e.target.value }))}
            placeholder="参考テキスト（サービス詳細、ブランドの声、PRポイントなど）"
            rows={3}
            className="text-xs resize-none bg-white"
          />
          <Input
            value={form.reference_url}
            onChange={e => setForm(p => ({ ...p, reference_url: e.target.value }))}
            placeholder="参考URL（https://...）"
            className="h-8 text-xs bg-white"
          />
          {/* ファイルアップロード */}
          <label className="flex items-center gap-2 cursor-pointer w-full border border-dashed border-slate-300 bg-white rounded-lg px-3 py-2.5 hover:border-violet-400 transition-colors">
            {isUploading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              : <Upload className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-xs text-slate-500">画像・PDFを添付（複数可）</span>
            <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
          {fileNames.length > 0 && (
            <div className="flex flex-col gap-1">
              {fileNames.map((name, i) => (
                <div key={i} className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-violet-700 truncate">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate">{name}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-400 ml-1 shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionBlock>

      {/* ━━━ ④ 情報ソース ━━━ */}
      <SectionBlock title="④ 情報ソース" open={openSection.sources} onToggle={() => toggle('sources')}>
        <div className="space-y-2">
          {[
            { key: 'use_input',       label: '入力内容をベースにする',     icon: '📝' },
            { key: 'use_attachments', label: '添付ファイルを参考にする',   icon: '📎', disabled: fileUrls.length === 0 },
            { key: 'use_web_search',  label: 'Web検索を使用する',          icon: '🌐' },
            { key: 'use_url',         label: 'URLの情報を使用する',        icon: '🔗', disabled: !form.reference_url },
          ].map(({ key, label, icon, disabled }) => (
            <label key={key} className={`flex items-center gap-2.5 cursor-pointer ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <input
                type="checkbox"
                checked={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                className="w-3.5 h-3.5 accent-violet-600 shrink-0"
                disabled={disabled}
              />
              <span className="text-xs">{icon}</span>
              <span className="text-xs text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </SectionBlock>

      {/* ━━━ ⑤ SEO設定 ━━━ */}
      <SectionBlock title="⑤ SEO設定" open={openSection.seo} onToggle={() => toggle('seo')}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700">SEOを意識する</span>
            <Switch
              checked={form.seo_enabled}
              onCheckedChange={v => setForm(p => ({ ...p, seo_enabled: v }))}
            />
          </div>
          {form.seo_enabled && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Input
                value={form.seo_keywords}
                onChange={e => setForm(p => ({ ...p, seo_keywords: e.target.value }))}
                placeholder="狙いたいキーワード（例：縮毛矯正 渋谷 安い）"
                className="h-8 text-xs bg-white"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.seo_optimize_title}
                  onChange={e => setForm(p => ({ ...p, seo_optimize_title: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-violet-600"
                />
                <span className="text-xs text-slate-700">タイトルをSEO最適化する</span>
              </label>
            </div>
          )}
        </div>
      </SectionBlock>

      {/* ━━━ ⑥ 生成ボタン ━━━ */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md gap-2 h-10"
      >
        {isGenerating
          ? <><Loader2 className="w-4 h-4 animate-spin" />AI生成中...</>
          : <><Wand2 className="w-4 h-4" />AIで記事を生成</>
        }
      </Button>

      {isGenerating && (
        <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500 mx-auto mb-1.5" />
          <p className="text-xs text-violet-600 font-medium">記事を生成しています...</p>
          <p className="text-xs text-violet-400 mt-0.5">通常15〜30秒かかります</p>
        </div>
      )}

      {/* ━━━ ⑦ 生成結果 ━━━ */}
      {generated && !isGenerating && (
        <GeneratedPreview
          generated={generated}
          usedWebSearch={usedWebSearch}
          onApplyAll={onApplyAll}
          onApplyTitle={onApplyTitle}
          onRegenerate={handleGenerate}
        />
      )}

      {/* ━━━ AI利用上限到達時の課金誘導モーダル ━━━ */}
      <AILimitUpgradeModal
        open={limitModalOpen}
        onOpenChange={setLimitModalOpen}
        limitData={limitData}
        onConfirm={() => {
          setLimitData(null);
        }}
      />
    </div>
  );
}

// ── セクションブロック ──
function SectionBlock({ title, open, onToggle, children }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-xs font-semibold text-slate-700">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

// ── 生成結果プレビュー ──
function GeneratedPreview({ generated, usedWebSearch, onApplyAll, onApplyTitle, onRegenerate }) {
  const [copied, setCopied] = useState(false);

  const copyContent = () => {
    navigator.clipboard.writeText(generated.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-2 border-violet-300 rounded-xl overflow-hidden bg-white shadow-md">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-semibold">生成完了</span>
          {usedWebSearch && (
            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Globe className="w-3 h-3" />Web参照
            </span>
          )}
        </div>
        <button type="button" onClick={copyContent} className="text-white/70 hover:text-white transition-colors">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* プレビュー */}
      <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
        {generated.title && (
          <div>
            <p className="text-xs text-slate-400 mb-0.5">タイトル</p>
            <p className="text-sm font-bold text-slate-800 leading-snug">{generated.title}</p>
          </div>
        )}
        {generated.excerpt && (
          <div>
            <p className="text-xs text-slate-400 mb-0.5">抜粋</p>
            <p className="text-xs text-slate-600 leading-relaxed">{generated.excerpt}</p>
          </div>
        )}
        {generated.content && (
          <div>
            <p className="text-xs text-slate-400 mb-0.5">本文プレビュー</p>
            <div
              className="text-xs text-slate-700 leading-relaxed prose prose-sm max-w-none [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mt-2 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-slate-700 [&_p]:mt-1"
              dangerouslySetInnerHTML={{ __html: generated.content.slice(0, 1000) + (generated.content.length > 1000 ? '...' : '') }}
            />
          </div>
        )}
        {generated.seo_title && (
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-xs text-slate-400 mb-0.5">SEOタイトル</p>
            <p className="text-xs text-slate-700">{generated.seo_title}</p>
          </div>
        )}
      </div>

      {/* 操作ボタン */}
      <div className="border-t border-slate-100 p-3 space-y-2">
        <Button
          onClick={() => onApplyAll(generated)}
          className="w-full bg-violet-600 hover:bg-violet-700 h-9 text-sm gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />本文に反映
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => onApplyTitle(generated)}
            className="h-8 text-xs gap-1 border-slate-300"
          >
            タイトルだけ反映
          </Button>
          <Button
            variant="outline"
            onClick={onRegenerate}
            className="h-8 text-xs gap-1 border-slate-300"
          >
            <RefreshCw className="w-3 h-3" />再生成
          </Button>
        </div>
      </div>
    </div>
  );
}