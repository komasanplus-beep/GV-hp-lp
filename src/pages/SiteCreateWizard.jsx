/**
 * SiteCreateWizard
 * 業種選択 → 完成サイト生成フロー
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

const TEMPLATES = [
  {
    type: 'hotel',
    name: 'ホテル・宿泊施設',
    description: '客室情報と予約機能、ラグジュアリーな高級感デザイン',
    icon: '🏨',
    color: 'from-amber-500 to-amber-600',
    image: 'https://images.unsplash.com/photo-1631049307038-da0ec89d4d0a?w=400&h=300&fit=crop',
  },
  {
    type: 'salon',
    name: 'サロン・美容室',
    description: 'メニュー情報とスタッフ紹介、洗練された上品デザイン',
    icon: '💇',
    color: 'from-rose-500 to-rose-600',
    image: 'https://images.unsplash.com/photo-1595361984547-3d41b5e34d25?w=400&h=300&fit=crop',
  },
];

export default function SiteCreateWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 業種選択, 2: サイト名入力
  const [selectedType, setSelectedType] = useState(null);
  const [siteName, setSiteName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectTemplate = (type) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedType(null);
    setSiteName('');
  };

  const handleCreate = async () => {
    if (!siteName.trim()) {
      alert('サイト名を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      // サイト基本情報作成
      const siteRes = await base44.functions.invoke('generateCompleteSite', {
        business_type: selectedType,
        site_name: siteName.trim(),
        template_type: selectedType, // テンプレートタイプを指定
      });

      if (siteRes.data.status !== 'success') {
        throw new Error(siteRes.data.error || 'Site creation failed');
      }

      const siteId = siteRes.data.site.id;

      // テンプレートに応じた初期ページを生成
      await base44.functions.invoke('createSiteWithTemplate', {
        site_id: siteId,
        template_type: selectedType,
      });

      // ページ管理画面へ遷移
      window.location.href = `/SitePageManager?site_id=${siteId}`;
    } catch (error) {
      console.error('Site creation failed:', error);
      alert(`エラー: ${error.response?.data?.error || error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-600" />
              <h1 className="text-2xl font-bold text-slate-900">新規サイト作成</h1>
            </div>
            <div className="text-sm text-slate-500">
              {step === 1 ? 'ステップ1: テンプレート選択' : 'ステップ2: サイト名入力'}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  業種を選択してください
                </h2>
                <p className="text-lg text-slate-600">
                  選択した業種に最適化されたテンプレートで<br />
                  完成サイトが自動生成されます
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {TEMPLATES.map((template) => (
                  <Card
                    key={template.type}
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group"
                    onClick={() => handleSelectTemplate(template.type)}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-200">
                      <img
                        src={template.image}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${template.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                    </div>

                    {/* Content */}
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{template.icon}</span>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{template.name}</h3>
                            <p className="text-sm text-slate-500">テンプレート</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                        {template.description}
                      </p>

                      <Button className={`w-full bg-gradient-to-r ${template.color} hover:opacity-90 text-white gap-2 group`}>
                        このテンプレートを使う
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Info Box */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">✨ 自動生成されるもの</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ 完全なLPサイト（7～8セクション）</li>
                    <li>✓ スムーススクロールナビゲーション</li>
                    <li>✓ 初期サンプルデータ（サービス3件）</li>
                    <li>✓ 業種別のデザイン自動切替</li>
                    <li>✓ モバイル対応レイアウト</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Site Name Input */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  サイト名を入力してください
                </h2>
                <p className="text-lg text-slate-600">
                  このサイト名はヘッダーなどに表示されます
                </p>
              </div>

              <Card className="p-8 bg-white">
                <div className="space-y-6">
                  {/* Template Preview */}
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <p className="text-sm text-slate-500 mb-2">選択されたテンプレート</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {TEMPLATES.find((t) => t.type === selectedType)?.icon}
                      </span>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {TEMPLATES.find((t) => t.type === selectedType)?.name}
                      </h3>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                      サイト名 *
                    </label>
                    <Input
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="例: Bawi Hotel"
                      className="text-lg h-12"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                          handleCreate();
                        }
                      }}
                      disabled={isLoading}
                      autoFocus
                    />
                    <p className="text-xs text-slate-500">
                      英数字とひらがな・カタカナ・漢字が使用できます（最大50文字）
                    </p>
                  </div>

                  {/* Info */}
                  <Card className="bg-green-50 border-green-200 p-4">
                    <p className="text-sm text-green-800">
                      <strong>⚡ クリック2回で完成！</strong><br />
                      テンプレート選択 → サイト名入力 → 完成サイトが自動生成されます
                    </p>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      戻る
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!siteName.trim() || isLoading}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          サイトを作成
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Feature List */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6 text-center">
                  <p className="text-3xl mb-2">⚡</p>
                  <h4 className="font-semibold text-purple-900 mb-1">高速生成</h4>
                  <p className="text-sm text-purple-700">
                    1秒以内に完成サイトが生成されます
                  </p>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6 text-center">
                  <p className="text-3xl mb-2">🎨</p>
                  <h4 className="font-semibold text-green-900 mb-1">プロデザイン</h4>
                  <p className="text-sm text-green-700">
                    業種別の高級感あるデザイン
                  </p>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6 text-center">
                  <p className="text-3xl mb-2">📱</p>
                  <h4 className="font-semibold text-blue-900 mb-1">モバイル対応</h4>
                  <p className="text-sm text-blue-700">
                    スマホとPCで最適表示
                  </p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}