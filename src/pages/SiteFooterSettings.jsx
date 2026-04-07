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
import { ChevronLeft, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function SiteFooterSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');

  const [form, setForm] = useState({
    copyright_text: '',
    show_site_name: true,
    show_year: true,
    footer_links: [],
  });
  const [newLink, setNewLink] = useState({ label: '', href: '' });

  const queryClient = useQueryClient();

  const { data: site, isLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => siteId
      ? base44.entities.Site.filter({ id: siteId }).then(r => r[0])
      : null,
    enabled: !!siteId,
  });

  useEffect(() => {
    if (site?.footer_config) {
      setForm({
        copyright_text: site.footer_config.copyright_text || '',
        show_site_name: site.footer_config.show_site_name !== false,
        show_year: site.footer_config.show_year !== false,
        footer_links: site.footer_config.footer_links || [],
      });
    }
  }, [site]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Site.update(siteId, { footer_config: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
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

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="フッター設定">
        <div className="max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link to={`${createPageUrl('SitePageManager')}?site_id=${siteId}`}>
              <Button variant="outline" size="icon">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800">フッター設定</h2>
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
              {/* Copyright Text */}
              <Card>
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">著作権表記</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    value={form.copyright_text}
                    onChange={e => setForm(f => ({ ...f, copyright_text: e.target.value }))}
                    placeholder="例: © 2026 マイホテル. All rights reserved."
                    rows={3}
                  />
                  <p className="text-xs text-slate-400 mt-2">未入力の場合、デフォルト表記が使用されます</p>
                </CardContent>
              </Card>

              {/* Display Options */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.show_year}
                      onChange={e => setForm(f => ({ ...f, show_year: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">年号を表示</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.show_site_name}
                      onChange={e => setForm(f => ({ ...f, show_site_name: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">サイト名を表示</span>
                  </label>
                </CardContent>
              </Card>

              {/* Footer Links */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-slate-800 text-sm">フッターリンク</h3>

                  {form.footer_links.length > 0 && (
                    <div className="space-y-2">
                      {form.footer_links.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                          <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700">{link.label}</p>
                            <p className="text-xs text-slate-400 truncate">{link.href}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLink(idx)}
                            className="w-8 h-8 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Link Form */}
                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <Input
                      placeholder="リンクラベル（例: プライバシーポリシー）"
                      value={newLink.label}
                      onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))}
                      className="text-sm"
                    />
                    <Input
                      placeholder="URL（例: /privacy）"
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