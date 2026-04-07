import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Save, Globe, ExternalLink, Info } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function SeoSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');

  const queryClient = useQueryClient();

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-created_date'),
  });

  const selectedSiteId = siteId || sites[0]?.id;
  const selectedSite = sites.find(s => s.id === selectedSiteId);

  const { data: seoData, isLoading } = useQuery({
    queryKey: ['lpSeoData', selectedSiteId],
    queryFn: () => base44.entities.LPSeoData.filter({ lp_id: selectedSiteId, target_type: 'site' }).then(r => r[0] || null),
    enabled: !!selectedSiteId,
  });

  const [form, setForm] = useState({
    meta_title: '',
    meta_description: '',
    keywords: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
  });

  useEffect(() => {
    if (seoData) {
      setForm({
        meta_title: seoData.meta_title || '',
        meta_description: seoData.meta_description || '',
        keywords: (seoData.seo_keywords || []).join(', '),
        og_title: seoData.og_title || '',
        og_description: seoData.og_description || '',
        og_image_url: seoData.og_image_url || '',
      });
    }
  }, [seoData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        lp_id: selectedSiteId,
        target_type: 'site',
        seo_keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean),
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        og_title: form.og_title,
        og_description: form.og_description,
        og_image_url: form.og_image_url,
      };
      return seoData?.id
        ? base44.entities.LPSeoData.update(seoData.id, payload)
        : base44.entities.LPSeoData.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpSeoData', selectedSiteId] });
      toast.success('SEO設定を保存しました');
    },
  });

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="SEO設定">
        <div className="max-w-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">SEO設定</h2>
              <p className="text-sm text-slate-500 mt-0.5">検索エンジン最適化の設定を行います</p>
            </div>
            {sites.length > 1 && (
              <Select
                value={selectedSiteId || ''}
                onValueChange={id => window.location.href = createPageUrl('SeoSettings') + '?site_id=' + id}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="サイトを選択" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* スコープ説明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-sm text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <div>
              <span className="font-medium">SEO範囲：</span> ここで設定するSEOはサイト全体（ホームページ）に適用されます。
              LP固有のSEOはLP管理 → 各LP編集画面から設定できます。
            </div>
          </div>

          {!selectedSiteId ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>サイトがありません</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Search className="w-4 h-4" />基本SEO設定</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">メタタイトル</label>
                    <Input
                      value={form.meta_title}
                      onChange={e => setForm(p => ({ ...p, meta_title: e.target.value }))}
                      placeholder="例: Beauty Salon Yuki | 渋谷の美容室"
                      maxLength={60}
                    />
                    <p className="text-xs text-slate-400 mt-1">{form.meta_title.length}/60文字</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">メタディスクリプション</label>
                    <Textarea
                      value={form.meta_description}
                      onChange={e => setForm(p => ({ ...p, meta_description: e.target.value }))}
                      placeholder="例: 渋谷のヘアサロン。カラー・トリートメント専門。ご予約はLINEまたはWebから。"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-slate-400 mt-1">{form.meta_description.length}/160文字</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">キーワード（カンマ区切り）</label>
                    <Input
                      value={form.keywords}
                      onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))}
                      placeholder="例: 美容室, 渋谷, ヘアカラー, トリートメント"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">OGP設定（SNSシェア用）</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">OGタイトル</label>
                    <Input
                      value={form.og_title}
                      onChange={e => setForm(p => ({ ...p, og_title: e.target.value }))}
                      placeholder="SNSでシェアされたときのタイトル"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">OG説明文</label>
                    <Textarea
                      value={form.og_description}
                      onChange={e => setForm(p => ({ ...p, og_description: e.target.value }))}
                      placeholder="SNSでシェアされたときの説明文"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">OG画像URL</label>
                    <Input
                      value={form.og_image_url}
                      onChange={e => setForm(p => ({ ...p, og_image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    {form.og_image_url && (
                      <img src={form.og_image_url} alt="OG" className="mt-2 h-24 object-cover rounded border" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Google Search Preview */}
              {(form.meta_title || form.meta_description) && (
                <Card className="bg-slate-50">
                  <CardHeader><CardTitle className="text-sm text-slate-500">Google検索プレビュー</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-0.5">
                      <p className="text-blue-700 text-base font-medium truncate">{form.meta_title || 'ページタイトル'}</p>
                      <p className="text-emerald-700 text-xs">https://yoursite.com</p>
                      <p className="text-slate-600 text-sm leading-snug line-clamp-2">{form.meta_description || 'メタディスクリプションが表示されます'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700 gap-2"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  SEO設定を保存
                </Button>
                <a
                  href={`${createPageUrl('SiteView')}?site_id=${selectedSiteId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" className="gap-1">
                    <ExternalLink className="w-4 h-4" />プレビュー
                  </Button>
                </a>
              </div>
            </>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}