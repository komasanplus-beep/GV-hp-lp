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
import { ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SNS_PLATFORMS = [
  { key: 'x', label: 'X (Twitter)' },
  { key: 'threads', label: 'Threads' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'line', label: 'LINE' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'note', label: 'note' },
  { key: 'tiktok', label: 'TikTok' },
];

export default function SiteFooterSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    copyright_text: '',
    show_site_name: true,
    show_year: true,
    show_company_name: false,
    company_name: '',
    footer_links: [],
    social_links: [],
  });
  const [newLink, setNewLink] = useState({ label: '', href: '' });
  const [pages, setPages] = useState([]);

  const { data: site, isLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => siteId ? base44.entities.Site.filter({ id: siteId }).then(r => r[0]) : null,
    enabled: !!siteId,
  });

  const { data: sitePages = [] } = useQuery({
    queryKey: ['sitePages', siteId],
    queryFn: () => siteId ? base44.entities.SitePage.filter({ site_id: siteId }, 'sort_order') : Promise.resolve([]),
    enabled: !!siteId,
  });

  useEffect(() => {
    setPages(sitePages);
  }, [sitePages]);

  useEffect(() => {
    if (site?.footer_config) {
      setForm({
        copyright_text: site.footer_config.copyright_text || '',
        show_site_name: site.footer_config.show_site_name !== false,
        show_year: site.footer_config.show_year !== false,
        show_company_name: site.footer_config.show_company_name ?? false,
        company_name: site.footer_config.company_name || '',
        footer_links: site.footer_config.footer_links || [],
        social_links: site.footer_config.social_links || [],
      });
    }
  }, [site]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Site.update(siteId, { footer_config: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      queryClient.invalidateQueries({ queryKey: ['siteViewData'] });
      toast.success('フッター設定を保存しました');
    },
  });

  const addLink = () => {
    if (!newLink.label || !newLink.href) return;
    setForm(f => ({
      ...f,
      footer_links: [...f.footer_links, { ...newLink, sort_order: f.footer_links.length }],
    }));
    setNewLink({ label: '', href: '' });
  };

  const removeLink = (idx) => {
    setForm(f => ({
      ...f,
      footer_links: f.footer_links.filter((_, i) => i !== idx),
    }));
  };

  const updateSocialLink = (platform, field, value) => {
    setForm(p => {
      const existing = p.social_links.find(s => s.platform === platform);
      if (existing) {
        return {
          ...p,
          social_links: p.social_links.map(s => s.platform === platform ? { ...s, [field]: value } : s)
        };
      }
      return p;
    });
  };

  // 固定ページ（フッター対象）
  const fixedPages = pages.filter(p => p.page_category !== 'regular' && p.status === 'published');

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="フッター設定">
        <div className="max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
            <Link to={`${createPageUrl('SitePageManager')}?site_id=${siteId}`}>
              <Button variant="outline" size="icon">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800">フッター設定</h2>
              <p className="text-sm text-slate-500 mt-0.5">{site?.site_name}</p>
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
              {/* コピーライト */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-slate-800">コピーライト</h3>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    value={form.copyright_text}
                    onChange={e => setForm(f => ({ ...f, copyright_text: e.target.value }))}
                    placeholder="例: © 2026 マイサロン. All rights reserved."
                    rows={2}
                  />
                  <p className="text-xs text-slate-400">未入力の場合、デフォルト表記が使用されます</p>
                </CardContent>
              </Card>

              {/* 表示設定 */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold text-slate-800 mb-3">表示設定</h3>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.show_year}
                      onChange={e => setForm(f => ({ ...f, show_year: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-700">年号を表示</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.show_site_name}
                      onChange={e => setForm(f => ({ ...f, show_site_name: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-700">サイト名を表示</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.show_company_name}
                      onChange={e => setForm(f => ({ ...f, show_company_name: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-700">会社名/店舗名を表示</span>
                  </label>
                  {form.show_company_name && (
                    <Input
                      value={form.company_name}
                      onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                      placeholder="会社名または店舗名"
                      className="mt-2"
                    />
                  )}
                </CardContent>
              </Card>

              {/* 固定ページリンク */}
              {fixedPages.length > 0 && (
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <h3 className="font-semibold text-slate-800">固定ページリンク</h3>
                    <p className="text-xs text-slate-500">以下は自動的にフッターに表示されます</p>
                    <div className="space-y-2">
                      {fixedPages.map(page => (
                        <div key={page.id} className="text-sm text-slate-700 p-2 bg-slate-50 rounded">
                          • {page.title}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 手動リンク */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-slate-800">手動リンク</h3>

                  {form.footer_links.length > 0 && (
                    <div className="space-y-2">
                      {form.footer_links.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700">{link.label}</p>
                            <p className="text-xs text-slate-400 truncate">{link.href}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLink(idx)}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <Input
                      placeholder="リンクラベル（例: ブログ）"
                      value={newLink.label}
                      onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))}
                      className="text-sm"
                    />
                    <Input
                      placeholder="URL（例: /blog）"
                      value={newLink.href}
                      onChange={e => setNewLink(l => ({ ...l, href: e.target.value }))}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      onClick={addLink}
                      disabled={!newLink.label || !newLink.href}
                      className="w-full bg-amber-600 hover:bg-amber-700 gap-2"
                    >
                      <Plus className="w-4 h-4" />リンクを追加
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* SNS設定 */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-slate-800 mb-3">SNS リンク</h3>
                  <div className="space-y-3">
                    {SNS_PLATFORMS.map(platform => {
                      const link = form.social_links.find(s => s.platform === platform.key) || {
                        platform: platform.key,
                        url: '',
                        show_in_footer: false,
                        open_new_tab: true,
                      };
                      return (
                        <div key={platform.key} className="space-y-2 p-3 border border-slate-200 rounded-lg">
                          <h4 className="font-medium text-sm text-slate-700">{platform.label}</h4>
                          <Input
                            value={link.url}
                            onChange={e => updateSocialLink(platform.key, 'url', e.target.value)}
                            placeholder={`${platform.label} URL`}
                            className="text-sm"
                          />
                          <div className="flex items-center gap-4 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={link.show_in_footer}
                                onChange={e => updateSocialLink(platform.key, 'show_in_footer', e.target.checked)}
                                className="w-4 h-4 rounded"
                              />
                              フッターに表示
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={link.open_new_tab}
                                onChange={e => updateSocialLink(platform.key, 'open_new_tab', e.target.checked)}
                                className="w-4 h-4 rounded"
                              />
                              新規タブで開く
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 保存ボタン */}
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
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : '保存'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}