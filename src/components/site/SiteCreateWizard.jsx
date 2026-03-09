import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TEMPLATES = [
  { key: 'beauty', label: 'ビューティー', desc: '美容室・エステ・ネイル向け', color: 'bg-pink-50 border-pink-200', icon: '💅' },
  { key: 'health', label: 'ヘルス・ボディ', desc: 'ジム・整体・クリニック向け', color: 'bg-green-50 border-green-200', icon: '💪' },
  { key: 'school', label: 'スクール', desc: '教室・スクール・習い事向け', color: 'bg-blue-50 border-blue-200', icon: '📚' },
  { key: 'general', label: 'ビジネス汎用', desc: 'どの業種にも対応', color: 'bg-slate-50 border-slate-200', icon: '🏢' },
];

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

const DEFAULT_PAGES = [
  { title: 'HOME', slug: 'home', page_type: 'home', sort_order: 0 },
  { title: 'MENU', slug: 'menu', page_type: 'menu', sort_order: 1 },
  { title: 'STAFF', slug: 'staff', page_type: 'staff', sort_order: 2 },
  { title: 'GALLERY', slug: 'gallery', page_type: 'gallery', sort_order: 3 },
  { title: 'CONTACT', slug: 'contact', page_type: 'contact', sort_order: 4 },
];

const DEFAULT_BLOCKS = {
  home: ['Hero', 'About', 'Feature', 'Voice', 'CTA'],
  menu: ['Hero', 'Menu'],
  staff: ['Hero', 'Staff'],
  gallery: ['Hero', 'Gallery'],
  contact: ['Hero', 'Contact', 'Access'],
};

const STEPS = ['テンプレート選択', '業種選択', 'サイト名入力', 'ページ生成'];

export default function SiteCreateWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const site = await base44.entities.Site.create({
      site_name: siteName,
      business_type: businessType,
      user_id: user.id,
      status: 'draft',
    });

    for (const pageDef of DEFAULT_PAGES) {
      const page = await base44.entities.SitePage.create({
        site_id: site.id,
        ...pageDef,
        status: 'draft',
      });
      const blocks = DEFAULT_BLOCKS[pageDef.page_type] || ['Hero'];
      for (let i = 0; i < blocks.length; i++) {
        await base44.entities.SiteBlock.create({
          site_id: site.id,
          page_id: page.id,
          block_type: blocks[i],
          sort_order: i,
          data: {},
          user_id: user.id,
        });
      }
    }

    setLoading(false);
    setDone(true);
    toast.success('サイトを作成しました！');
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

      {/* Step 0: Template */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">テンプレートを選んでください</p>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.key}
                onClick={() => setTemplate(t.key)}
                className={cn(
                  "border-2 rounded-xl p-4 text-left transition-all hover:shadow-md",
                  t.color,
                  template === t.key ? "ring-2 ring-amber-500 ring-offset-1" : ""
                )}
              >
                <div className="text-2xl mb-2">{t.icon}</div>
                <p className="font-semibold text-sm text-slate-800">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>キャンセル</Button>
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={!template} onClick={() => setStep(1)}>次へ</Button>
          </div>
        </div>
      )}

      {/* Step 1: Business type */}
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

      {/* Step 2: Site name */}
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

      {/* Step 3: Auto page generation */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">以下のページが自動生成されます</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            {DEFAULT_PAGES.map(p => (
              <div key={p.slug} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700">{p.title}</span>
                  <span className="text-xs text-slate-400 ml-2">
                    ({(DEFAULT_BLOCKS[p.page_type] || []).join(', ')})
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="border rounded-xl p-4 bg-amber-50 border-amber-200">
            <p className="text-xs text-amber-700"><strong>サイト名:</strong> {siteName}</p>
            <p className="text-xs text-amber-700 mt-0.5"><strong>業種:</strong> {BUSINESS_TYPES.find(t => t.value === businessType)?.label}</p>
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