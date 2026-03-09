import React, { useState } from 'react';
import UserLayout from '@/components/user/UserLayout';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import LimitGuard from '@/components/plan/LimitGuard';

const BUSINESS_TYPES = [
  { value: 'hair_salon', label: 'ヘアサロン' },
  { value: 'beauty_salon', label: '美容サロン' },
  { value: 'nail_salon', label: 'ネイルサロン' },
  { value: 'esthetic', label: 'エステ' },
  { value: 'relaxation', label: 'リラクゼーション' },
  { value: 'gym', label: 'ジム・フィットネス' },
  { value: 'clinic', label: 'クリニック' },
  { value: 'school', label: 'スクール' },
  { value: 'other', label: 'その他' },
];

const CONTENT_TYPES = [
  { value: 'site_title', label: 'サイトタイトル' },
  { value: 'catchcopy', label: 'キャッチコピー' },
  { value: 'hero_text', label: 'ヒーローテキスト' },
  { value: 'service_desc', label: 'サービス説明' },
  { value: 'menu_desc', label: 'メニュー説明' },
  { value: 'staff_intro', label: 'スタッフ紹介' },
  { value: 'cta', label: 'CTA' },
  { value: 'faq', label: 'FAQ' },
  { value: 'seo_title', label: 'SEOタイトル' },
  { value: 'seo_description', label: 'SEO説明文' },
];

export default function AdminAIGenerate() {
  const [form, setForm] = useState({
    business_type: 'hair_salon',
    service: '',
    target: '',
    region: '',
    features: '',
  });
  const [selectedType, setSelectedType] = useState('catchcopy');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke('aiGenerate', {
      ...form,
      content_type: selectedType,
    });
    setResult(res.data);
    setLoading(false);
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderResults = () => {
    if (!result?.data) return null;
    const data = result.data;
    const items = data.results || [];

    if (items.length === 0 && data.raw_text) {
      return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg whitespace-pre-wrap text-sm text-slate-700">
          {data.raw_text}
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-3">
        {items.map((item, idx) => {
          const text = typeof item === 'string' ? item : JSON.stringify(item, null, 2);
          return (
            <div key={idx} className="relative p-4 bg-slate-50 rounded-lg border border-slate-200">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{text}</pre>
              <button
                onClick={() => handleCopy(text, idx)}
                className="absolute top-2 right-2 p-1.5 rounded hover:bg-slate-200 text-slate-500"
              >
                {copied === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="AIコンテンツ生成">
        <LimitGuard type="ai">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ビジネス情報入力 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                ビジネス情報を入力
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">業種</label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map(bt => (
                    <button
                      key={bt.value}
                      onClick={() => setForm(f => ({ ...f, business_type: bt.value }))}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        form.business_type === bt.value
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-amber-400'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">サービス内容</label>
                  <Input
                    placeholder="例: カット・カラー・トリートメント"
                    value={form.service}
                    onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ターゲット</label>
                  <Input
                    placeholder="例: 30〜40代の働く女性"
                    value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">地域</label>
                  <Input
                    placeholder="例: 東京都渋谷区"
                    value={form.region}
                    onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">特徴・強み</label>
                  <Input
                    placeholder="例: 完全個室・オーガニック薬剤使用"
                    value={form.features}
                    onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 生成コンテンツ選択 */}
          <Card>
            <CardHeader>
              <CardTitle>生成するコンテンツを選択</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map(ct => (
                  <button
                    key={ct.value}
                    onClick={() => setSelectedType(ct.value)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedType === ct.value
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-white w-full"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />生成中...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />AIで生成する</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 生成結果 */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  生成結果
                  <Badge className="bg-green-100 text-green-700">完了</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderResults()}
              </CardContent>
            </Card>
          )}
        </div>
        </LimitGuard>
      </UserLayout>
    </ProtectedRoute>
  );
}