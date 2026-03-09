import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const BUSINESS_TYPES = [
  { value: 'hair_salon', label: '美容室・ヘアサロン', icon: '✂️' },
  { value: 'beauty_salon', label: 'エステサロン', icon: '✨' },
  { value: 'nail_salon', label: 'ネイルサロン', icon: '💅' },
  { value: 'esthetic', label: 'アイラッシュ・ブロウ', icon: '👁' },
  { value: 'relaxation', label: 'リラクゼーション・整体', icon: '🤲' },
  { value: 'clinic', label: 'クリニック・医院', icon: '🏥' },
  { value: 'gym', label: 'パーソナルジム', icon: '🏋️' },
  { value: 'school', label: 'スクール・教室', icon: '📚' },
  { value: 'other', label: 'その他', icon: '🏢' },
];

const CATEGORY_ICON = {
  salon: '💅',
  beauty: '✨',
  clinic: '🏥',
  fitness: '💪',
  school: '📚',
  general: '🏢',
};

const STEPS = ['テンプレート選択', '業種選択', 'サイト名入力', '確認・生成'];

export default function SiteCreateWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [businessType, setBusinessType] = useState('');
  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // DBからテンプレート一覧を取得
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['siteTemplates'],
    queryFn: () => base44.entities.SiteTemplate.filter({ is_active: true }),
  });

  // テンプレートのページ・ブロックをプレビュー表示用に整形
  const previewPages = selectedTemplate?.default_pages || [];
  const previewBlocks = selectedTemplate?.default_blocks || [];

  const getBlocksForPage = (slug) =>
    previewBlocks
      .filter(b => b.page_slug === slug)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(b => b.block_type);

  const handleCreate = async () => {
    if (!selectedTemplate || !siteName.trim()) return;
    setLoading(true);

    const user = await base44.auth.me();

    // 1. Site作成
    const site = await base44.entities.Site.create({
      site_name: siteName,
      business_type: businessType,
      user_id: user.id,
      status: 'draft',
    });

    // 2. default_pages から SitePage 作成、slug→idのマップを保存
    const pageMap = {}; // slug → page.id
    for (const pageDef of (selectedTemplate.default_pages || [])) {
      const page = await base44.entities.SitePage.create({
        site_id: site.id,
        title: pageDef.title,
        slug: pageDef.slug,
        page_type: pageDef.page_type,
        sort_order: pageDef.sort_order ?? 0,
        status: 'draft',
      });
      pageMap[pageDef.slug] = page.id;
    }

    // 3. default_blocks から SiteBlock 作成
    for (const blockDef of (selectedTemplate.default_blocks || [])) {
      const pageId = pageMap[blockDef.page_slug];
      if (!pageId) continue;
      await base44.entities.SiteBlock.create({
        site_id: site.id,
        page_id: pageId,
        block_type: blockDef.block_type,
        sort_order: blockDef.sort_order ?? 0,
        data: {},
        user_id: user.id,
      });
    }

    setLoading(false);
    setDone(true);
    toast.success(`「${site.site_name}」を作成しました！`);
    setTimeout(() => onComplete(site), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-all",
              i === step ? "bg-amber-100 text-amber-700" :
              i < step ? "text-emerald-600" : "text-slate-400"
            )}>
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: テンプレート選択 */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">テンプレートを選んでください</p>
          {templatesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">テンプレートがありません</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={cn(
                    "border-2 rounded-xl p-4 text-left transition-all hover:shadow-md w-full",
                    "bg-pink-50 border-pink-200",
                    selectedTemplate?.id === t.id ? "ring-2 ring-amber-500 ring-offset-1" : ""
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{CATEGORY_ICON[t.category] || '🏢'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800">{t.name}</p>
                      {t.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(t.default_pages || []).map(p => (
                          <span key={p.slug} className="text-xs bg-white/70 border border-pink-200 rounded px-1.5 py-0.5 text-pink-700">{p.title}</span>
                        ))}
                      </div>
                    </div>
                    {selectedTemplate?.id === t.id && (
                      <Check className="w-4 h-4 text-amber-600 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>キャンセル</Button>
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={!selectedTemplate} onClick={() => setStep(1)}>次へ</Button>
          </div>
        </div>
      )}

      {/* Step 1: 業種選択 */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">業種を選んでください</p>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setBusinessType(t.value)}
                className={cn(
                  "border rounded-lg p-3 text-left text-sm transition-all hover:bg-slate-50",
                  businessType === t.value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-700"
                )}
              >
                <span className="mr-2">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>戻る</Button>
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={!businessType} onClick={() => setStep(2)}>次へ</Button>
          </div>
        </div>
      )}

      {/* Step 2: サイト名 */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">サイト名を入力してください</p>
          <Input
            value={siteName}
            onChange={e => setSiteName(e.target.value)}
            placeholder="例: Beauty Salon Yuki"
            className="text-lg h-12"
            autoFocus
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>戻る</Button>
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={!siteName.trim()} onClick={() => setStep(3)}>次へ</Button>
          </div>
        </div>
      )}

      {/* Step 3: 確認・生成 */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="border rounded-xl p-4 bg-amber-50 border-amber-200 space-y-1">
            <p className="text-xs text-amber-700"><strong>サイト名:</strong> {siteName}</p>
            <p className="text-xs text-amber-700"><strong>テンプレート:</strong> {selectedTemplate?.name}</p>
            <p className="text-xs text-amber-700"><strong>業種:</strong> {BUSINESS_TYPES.find(t => t.value === businessType)?.label}</p>
          </div>

          <p className="text-sm font-medium text-slate-700">生成されるページ構成</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            {previewPages.map(p => {
              const blocks = getBlocksForPage(p.slug);
              return (
                <div key={p.slug} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">{p.title}</span>
                    {blocks.length > 0 && (
                      <span className="text-xs text-slate-400 ml-2">({blocks.join(' → ')})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {done && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <Check className="w-4 h-4" /> 作成完了！
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={loading}>戻る</Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCreate}
              disabled={loading || done}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />生成中...</> : 'サイトを作成'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}