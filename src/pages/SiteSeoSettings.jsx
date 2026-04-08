import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Loader2, ImageIcon, Globe, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SiteSeoSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');

  const [form, setForm] = useState({
    meta_title: '',
    meta_description: '',
    og_image_url: '',
    analytics_code: '',
    tag_manager_code: '',
    head_script: '',
    body_script: '',
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: site, isLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => siteId
      ? base44.entities.Site.filter({ id: siteId }).then(r => r[0])
      : null,
    enabled: !!siteId,
  });

  useEffect(() => {
    if (site?.seo_config) {
      setForm({
        meta_title: site.seo_config.meta_title || '',
        meta_description: site.seo_config.meta_description || '',
        og_image_url: site.seo_config.og_image_url || '',
        analytics_code: site.seo_config.analytics_code || '',
        tag_manager_code: site.seo_config.tag_manager_code || '',
        head_script: site.seo_config.head_script || '',
        body_script: site.seo_config.body_script || '',
      });
    }
  }, [site]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Site.update(siteId, { seo_config: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      toast.success('SEO設定を保存しました');
    },
  });

  const handleImageUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, og_image_url: file_url }));
    setUploading(false);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="SEO設定">
        <div className="max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link to={`${createPageUrl('SitePageManager')}?site_id=${siteId}`}>
              <Button variant="outline" size="icon">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800">SEO設定</h2>
              <p className="text-sm text-slate-400 mt-0.5">{site?.site_name}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-6"
            >
              {/* Meta Title */}
              <Card>
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">ページタイトル</label>
                  <Input
                    value={form.meta_title}
                    onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                    placeholder="例: 美容室 Yuki | 渋谷の最新トレンドサロン"
                    className="mb-2"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <p className="text-slate-400">検索結果に表示されるタイトル</p>
                    <span className={`${form.meta_title.length > 60 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {form.meta_title.length}/60
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Meta Description */}
              <Card>
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">メタディスクリプション</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                    value={form.meta_description}
                    onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                    placeholder="例: 渋谷にある最新トレンドを取り入れた美容室。経験豊富なスタイリストが、あなたの魅力を引き出します。"
                    rows={3}
                  />
                  <div className="flex justify-between items-center text-xs mt-2">
                    <p className="text-slate-400">検索結果の説明文（160文字以内推奨）</p>
                    <span className={`${form.meta_description.length > 160 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {form.meta_description.length}/160
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* OG Image */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <label className="text-sm font-medium text-slate-700 block">OGP画像</label>
                  {form.og_image_url && (
                    <div className="relative">
                      <img src={form.og_image_url} alt="OGP" className="w-full h-40 object-cover rounded-lg border" />
                      <p className="text-xs text-slate-400 mt-2">SNS共有時に表示される画像</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="cursor-pointer block">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          {uploading
                            ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            : <ImageIcon className="w-4 h-4 mr-1" />}
                          画像をアップロード
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])}
                        disabled={uploading}
                      />
                    </label>
                    <Input
                      type="text"
                      value={form.og_image_url}
                      onChange={e => setForm(f => ({ ...f, og_image_url: e.target.value }))}
                      placeholder="またはURLを直接入力"
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Google Analytics Code */}
              <Card>
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Google Analytics コード</label>
                  <Textarea
                    value={form.analytics_code}
                    onChange={e => setForm(f => ({ ...f, analytics_code: e.target.value }))}
                    placeholder="Google AnalyticsのGTAG スクリプトをここに貼り付けます"
                    rows={3}
                    className="resize-none font-mono text-xs"
                  />
                  <p className="text-xs text-slate-400 mt-2">例: &lt;script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"&gt;&lt;/script&gt;</p>
                </CardContent>
              </Card>

              {/* Google Tag Manager Code */}
              <Card>
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Google Tag Manager コード</label>
                  <Textarea
                    value={form.tag_manager_code}
                    onChange={e => setForm(f => ({ ...f, tag_manager_code: e.target.value }))}
                    placeholder="Google Tag ManagerのコードをHTMLのhead内に埋め込みます"
                    rows={3}
                    className="resize-none font-mono text-xs"
                  />
                  <p className="text-xs text-slate-400 mt-2">例: &lt;script&gt;(function(w,d)...&lt;/script&gt;</p>
                </CardContent>
              </Card>

              {/* Head Scripts */}
              <Card>
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">head内スクリプト</label>
                  <Textarea
                    value={form.head_script}
                    onChange={e => setForm(f => ({ ...f, head_script: e.target.value }))}
                    placeholder="ページのhead内に埋め込みたいスクリプトを記述（メタタグ、link タグなど）"
                    rows={4}
                    className="resize-none font-mono text-xs"
                  />
                  <p className="text-xs text-slate-400 mt-2">コード例: &lt;meta property="og:url" content="..."&gt;</p>
                </CardContent>
              </Card>

              {/* Body Scripts */}
              <Card>
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">body 末尾スクリプト</label>
                  <Textarea
                    value={form.body_script}
                    onChange={e => setForm(f => ({ ...f, body_script: e.target.value }))}
                    placeholder="ページのbody末尾に埋め込みたいスクリプトを記述"
                    rows={4}
                    className="resize-none font-mono text-xs"
                  />
                  <p className="text-xs text-slate-400 mt-2">コード例: &lt;script&gt;...&lt;/script&gt;</p>
                </CardContent>
              </Card>

              {/* Warning */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">スクリプト埋め込みについて</p>
                      <p>外部スクリプトの埋め込みには注意が必要です。信頼できるサービスのコードのみを使用してください。悪意のあるコードはサイトを破損する可能性があります。</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">SEO設定の反映</p>
                      <p>このサイトのプレビュー・公開表示に上記の設定が反映されます。</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex gap-3 pt-4">
                <Link to={`${createPageUrl('SitePageManager')}?site_id=${siteId}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    キャンセル
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}