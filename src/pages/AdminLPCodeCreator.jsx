import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { AlertCircle, Upload, Loader2, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ImageMappingUI from '@/components/lp/ImageMappingUI';

const TEMPLATE_OPTIONS = [
  { value: 'default', label: 'デフォルト' },
  { value: 'salon', label: 'サロン' },
  { value: 'beauty', label: 'ビューティー' },
  { value: 'custom', label: 'カスタム' },
];

// HTML事前クレンジング（フロント側で危険な要素を除去）
const preCleanHtml = (html = '') => {
  let cleaned = String(html);
  // script タグを完全除去
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // on[a-z]+ 属性を除去（onclick, onload, onerror, onmouseover, onsubmit など）
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*["']([^"']*)["']/gi, '');
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '');
  // javascript: スキームを除去
  cleaned = cleaned.replace(/javascript:/gi, '');
  return cleaned;
};

export default function AdminLPCodeCreator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const lpId = urlParams.get('id');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'draft',
    template_type: 'custom',
    html_code: '',
    css_code: '',
  });

  const [uploadedAssets, setUploadedAssets] = useState([]);
  const [extractedImages, setExtractedImages] = useState([]);
  const [imageReplacements, setImageReplacements] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // 既存LP読み込み
  const { data: existingLp } = useQuery({
    queryKey: ['lp', lpId],
    queryFn: () => base44.entities.LandingPage.filter({ id: lpId }),
    enabled: !!lpId,
  });

  // アップロード済み画像取得
  const { data: lpAssets = [] } = useQuery({
    queryKey: ['lpAssets', lpId],
    queryFn: () =>
      lpId
        ? base44.entities.LandingPageAsset.filter({ landing_page_id: lpId }, 'sort_order')
        : Promise.resolve([]),
    enabled: !!lpId,
  });

  useEffect(() => {
    if (existingLp && existingLp.length > 0) {
      const lp = existingLp[0];
      setForm({
        title: lp.title || '',
        slug: lp.slug || '',
        description: lp.description || '',
        status: lp.status || 'draft',
        template_type: lp.template_type || 'custom',
        html_code: lp.html_code || '',
        css_code: lp.css_code || '',
      });
      if (lp.extracted_image_urls) {
        setExtractedImages(lp.extracted_image_urls);
      }
    }
  }, [existingLp]);

  // 保存ミューテーション
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      try {
        // 0. フロント側の事前クレンジング（危険属性を先制的に除去）
        const preCleanedHtml = preCleanHtml(form.html_code);

        // 1. バックエンド側でサニタイズ（多重防御）
        const sanitizeRes = await base44.functions.invoke('sanitizeLandingPageHtml', {
          html_code: preCleanedHtml,
          css_code: form.css_code,
        });

        if (!sanitizeRes || !sanitizeRes.data) {
          throw new Error('Sanitize response is invalid');
        }

        // 2. 画像URL置換（DBから最新のマッピング取得）
        let finalHtml = sanitizeRes.data.sanitized_html || preCleanedHtml;
        if (lpId) {
          const mappingsData = await base44.entities.LandingPageImageMapping.filter({
            landing_page_id: lpId,
            status: 'mapped',
          }).catch(() => []);

          if (mappingsData.length > 0) {
            const replacements = mappingsData
              .filter(m => m.uploaded_url)
              .map(m => ({
                original_url: m.original_url,
                file_url: m.uploaded_url,
              }));

            if (replacements.length > 0) {
              const replaceRes = await base44.functions.invoke('replaceImageUrlsInHtml', {
                html_code: finalHtml,
                replacements,
              });
              finalHtml = replaceRes.data?.replaced_html || finalHtml;
            }
          }
        }

        // 3. LP保存
        const saveRes = await base44.functions.invoke('saveLandingPageFromCode', {
          lp_id: lpId,
          title: form.title,
          slug: form.slug,
          description: form.description,
          status: form.status,
          template_type: form.template_type,
          html_code: preCleanedHtml,
          css_code: form.css_code,
          sanitized_html: finalHtml,
          extracted_image_urls: sanitizeRes.data?.extracted_image_urls || [],
        });

        return saveRes;
      } catch (err) {
        console.error('Save mutation error:', err);
        throw err;
      }
    },
    onSuccess: async (res) => {
      // PlanUsage の lp_count をインクリメント（新規作成の場合）
      if (!lpId) {
        try {
          const user = await base44.auth.me();
          const currentMonth = new Date().toISOString().slice(0, 7);
          const usageList = await base44.entities.PlanUsage.filter({ user_id: user.id }).catch(() => []);
          const monthUsage = usageList.find(u => u.month_year === currentMonth);
          if (monthUsage) {
            await base44.entities.PlanUsage.update(monthUsage.id, { lp_count: (monthUsage.lp_count || 0) + 1 });
          } else {
            await base44.entities.PlanUsage.create({ user_id: user.id, month_year: currentMonth, lp_count: 1, ai_used: 0, storage_used: 0 });
          }
        } catch (err) {
          console.error('PlanUsage更新エラー:', err);
        }
      }

      toast({
        title: '保存しました',
        description: `LP「${form.title}」を保存しました`,
      });
      queryClient.invalidateQueries({ queryKey: ['lp'] });
      queryClient.invalidateQueries({ queryKey: ['planUsage'] });
      if (res.data.lp.id) {
        setPreviewUrl(res.data.preview_url);
        setPreviewData(res.data.lp);
      }
    },
    onError: (err) => {
      console.error('Save error details:', err);
      let errorMsg = '保存に失敗しました';
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 413) {
        errorMsg = data?.error || 'ファイルサイズが大きすぎます（10MBまで）';
      } else if (status === 400) {
        errorMsg = data?.error || '入力データが無効です';
      } else {
        errorMsg = data?.error || err.message || errorMsg;
      }

      toast({
        title: '保存エラー',
        description: errorMsg,
        variant: 'destructive',
      });
    },
  });

  // 画像アップロード
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const uploadRes = await base44.integrations.Core.UploadFile({ file });
        setUploadedAssets(prev => [...prev, {
          file_name: file.name,
          file_url: uploadRes.file_url,
          original_url: '',
        }]);
      } catch (err) {
        toast({
          title: 'アップロードエラー',
          description: `${file.name} のアップロードに失敗しました`,
          variant: 'destructive',
        });
      }
    }
  };

  // 画像自動抽出（HTMLから）
  const handleExtractImages = () => {
    const imgRegex = /src=["']([^"']+)["']/gi;
    const urls = [];
    let match;
    while ((match = imgRegex.exec(form.html_code)) !== null) {
      if (match[1] && !urls.includes(match[1])) {
        urls.push(match[1]);
      }
    }
    setExtractedImages(urls);
    toast({
      title: '抽出完了',
      description: `${urls.length}個の画像URLを抽出しました`,
    });
  };

  // 画像置換を追加
  const handleAddReplacement = (originalUrl, fileUrl) => {
    setImageReplacements(prev => {
      const exists = prev.find(r => r.original_url === originalUrl);
      if (exists) {
        return prev.map(r => r.original_url === originalUrl ? { ...r, file_url: fileUrl } : r);
      }
      return [...prev, { original_url: originalUrl, file_url: fileUrl }];
    });
  };

  // プレビュー
  const handlePreview = async () => {
    try {
      // フロント側の事前クレンジング
      const preCleanedHtml = preCleanHtml(form.html_code);

      const sanitizeRes = await base44.functions.invoke('sanitizeLandingPageHtml', {
        html_code: preCleanedHtml,
        css_code: form.css_code,
      });

      if (!sanitizeRes || !sanitizeRes.data) {
        throw new Error('Sanitize response is invalid');
      }

      // マッピング適用
      let htmlToPreview = sanitizeRes.data.sanitized_html || preCleanedHtml;
      if (lpId) {
        const mappingsData = await base44.entities.LandingPageImageMapping.filter({
          landing_page_id: lpId,
          status: 'mapped',
        }).catch(() => []);

        if (mappingsData.length > 0) {
          const replacements = mappingsData
            .filter(m => m.uploaded_url)
            .map(m => ({
              original_url: m.original_url,
              file_url: m.uploaded_url,
            }));

          if (replacements.length > 0) {
            const replaceRes = await base44.functions.invoke('replaceImageUrlsInHtml', {
              html_code: htmlToPreview,
              replacements,
            });
            htmlToPreview = replaceRes.data?.replaced_html || htmlToPreview;
          }
        }
      }

      setPreviewData({
        sanitized_html: htmlToPreview,
        css_code: form.css_code,
      });

      toast({
        title: 'プレビュー準備完了',
        description: 'プレビューが表示されました',
      });
    } catch (err) {
      console.error('Preview error:', err);
      toast({
        title: 'プレビューエラー',
        description: err.message || 'プレビューの生成に失敗しました',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {lpId ? 'LP編集' : 'コード貼り付けLP作成'}
          </h1>
          <p className="text-slate-600 mt-2">
            HTML/CSSを貼り付けてLPを作成・管理します
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左：フォーム */}
          <div className="space-y-6">
            {/* 基本情報 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">基本情報</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    LPタイトル *
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="例：新サービス LP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    スラッグ *
                  </label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="例：new-service"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    説明
                  </label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="LP の説明やメモ"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      テンプレート種別
                    </label>
                    <Select value={form.template_type} onValueChange={(v) => setForm(f => ({ ...f, template_type: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      公開状態
                    </label>
                    <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">下書き</SelectItem>
                        <SelectItem value="published">公開</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* コード欄 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">コード</h2>
              <Tabs defaultValue="html" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="mt-4">
                  <Textarea
                    value={form.html_code}
                    onChange={(e) => setForm(f => ({ ...f, html_code: e.target.value }))}
                    placeholder="<div>...</div>"
                    rows={12}
                    className="font-mono text-xs"
                  />
                </TabsContent>
                <TabsContent value="css" className="mt-4">
                  <Textarea
                    value={form.css_code}
                    onChange={(e) => setForm(f => ({ ...f, css_code: e.target.value }))}
                    placeholder="body { ... }"
                    rows={12}
                    className="font-mono text-xs"
                  />
                </TabsContent>
              </Tabs>
            </Card>

            {/* 画像管理 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">画像管理</h2>

              <div className="space-y-4">
                {/* アップロード */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      クリックして画像を選択
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* アップロード済み画像 */}
                {uploadedAssets.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-slate-900 mb-3">
                      アップロード済み画像
                    </h3>
                    <div className="space-y-2">
                      {uploadedAssets.map((asset, i) => (
                        <div key={i} className="text-xs text-slate-600 truncate">
                          <span className="font-medium">{asset.file_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 自動抽出 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExtractImages}
                  className="w-full"
                >
                  HTML から画像URL を抽出
                </Button>

                {/* 抽出済み画像 */}
                {extractedImages.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-slate-900 mb-3">
                      抽出された画像URL（{extractedImages.length}個）
                    </h3>
                    <div className="space-y-2">
                      {extractedImages.map((url, i) => (
                        <div key={i} className="text-xs bg-white rounded p-2">
                          <p className="font-mono text-slate-600 truncate">{url}</p>
                          <select
                            className="mt-2 w-full text-xs border border-slate-200 rounded px-2 py-1"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddReplacement(url, e.target.value);
                              }
                            }}
                          >
                            <option value="">置換画像を選択</option>
                            {uploadedAssets.map((asset, j) => (
                              <option key={j} value={asset.file_url}>
                                {asset.file_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 置換設定 */}
                {imageReplacements.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-slate-900 mb-3">
                      置換設定（{imageReplacements.length}個）
                    </h3>
                    <div className="space-y-2">
                      {imageReplacements.map((rep, i) => (
                        <div key={i} className="text-xs bg-white rounded p-2 flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-slate-600 truncate text-xs">
                              {rep.original_url}
                            </p>
                            <p className="text-slate-400 mt-1">↓</p>
                            <p className="font-mono text-green-700 truncate text-xs">
                              {rep.file_url}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* ボタン群 */}
            <div className="flex gap-2">
              <Button
                onClick={handlePreview}
                variant="outline"
                className="flex-1"
              >
                プレビュー
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.title || !form.slug}
                className="flex-1"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                保存
              </Button>
            </div>

            {/* 画像マッピングUI */}
            {lpId && (
              <ImageMappingUI
                lpId={lpId}
                htmlCode={form.html_code}
                uploadedAssets={lpAssets}
                onMappingChange={() => {
                  // マッピング変更時の処理（必要に応じて）
                }}
              />
            )}

            {previewUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-2">
                  プレビューURL
                </p>
                <code className="text-xs text-green-700 block break-all">
                  {previewUrl}
                </code>
              </div>
            )}
          </div>

          {/* 右：プレビュー */}
          <div className="sticky top-4">
            <Card className="p-6 h-full min-h-96">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">プレビュー</h2>
              {previewData ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="UTF-8">
                        <style>
                          * { margin: 0; padding: 0; }
                          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                          ${previewData.css_code || ''}
                        </style>
                      </head>
                      <body>
                        ${previewData.sanitized_html || previewData.html_code || ''}
                      </body>
                      </html>
                    `}
                    className="w-full h-96 border-0"
                    title="LP Preview"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p className="mb-2">プレビューを表示するには</p>
                  <p className="text-sm">「プレビュー」ボタンをクリック</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}