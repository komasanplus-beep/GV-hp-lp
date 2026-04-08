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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, Plus, Trash2, Loader2, Eye, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { toast } from 'sonner';
import ManualNavigationLinkForm from '@/components/site/ManualNavigationLinkForm';
import ManualNavigationLinkList from '@/components/site/ManualNavigationLinkList';

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

const OTHER_SNS = [
  { key: 'other_1', label: 'その他1', type: 'other' },
  { key: 'other_2', label: 'その他2', type: 'other' },
  { key: 'other_3', label: 'その他3', type: 'other' },
];

export default function SiteHeaderSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');
  const queryClient = useQueryClient();

  const [logoFile, setLogoFile] = useState(null);
  const [formData, setFormData] = useState({
    logo_url: '',
    logo_image_url: '',
    logo_alt: '',
    site_name_text: '',
    booking_button_text: 'ご予約',
    booking_button_url: '#booking',
    show_admin_link: false,
    menu_items: [],
    auto_menu_pages: [],
    social_links: [],
  });
  const [pages, setPages] = useState([]);
  const [newMenuItem, setNewMenuItem] = useState({ label: '', href: '', target: '_self', is_visible: true });
  const [newOtherSns, setNewOtherSns] = useState({ name: '', url: '' });
  const [showNavLinkDialog, setShowNavLinkDialog] = useState(false);
  const [editingNavLink, setEditingNavLink] = useState(null);

  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => siteId ? base44.entities.Site.filter({ id: siteId }).then(r => r[0]) : null,
    enabled: !!siteId,
  });

  const { data: sitePages = [] } = useQuery({
    queryKey: ['sitePages', siteId],
    queryFn: () => siteId ? base44.entities.SitePage.filter({ site_id: siteId }, 'sort_order') : Promise.resolve([]),
    enabled: !!siteId,
  });

  const { data: navLinks = [] } = useQuery({
    queryKey: ['navigationLinks', siteId],
    queryFn: () => siteId ? base44.entities.NavigationLink.filter({ site_id: siteId }, 'sort_order') : Promise.resolve([]),
    enabled: !!siteId,
  });

  useEffect(() => {
    if (sitePages.length > 0) {
      setPages(sitePages);
    }
  }, [sitePages]);

  useEffect(() => {
    if (site) {
      const navConfig = site.navigation_config || {};
      setFormData({
        logo_url: navConfig.logo_url || '',
        logo_image_url: navConfig.logo_image_url || '',
        logo_alt: navConfig.logo_alt || '',
        site_name_text: navConfig.site_name_text || site.site_name || '',
        booking_button_text: navConfig.booking_button_text || 'ご予約',
        booking_button_url: navConfig.booking_button_url || '#booking',
        show_admin_link: navConfig.show_admin_link ?? false,
        menu_items: navConfig.menu_items || [],
        auto_menu_pages: navConfig.auto_menu_pages || [],
        social_links: navConfig.social_links || [],
      });
    }
  }, [site]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let finalData = { ...formData };

      // ロゴ画像がアップロードされている場合は保存
      if (logoFile) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: logoFile });
        finalData.logo_image_url = uploadRes.file_url;
      }

      // alt テキストが空の場合はサイト名を使用
      if (!finalData.logo_alt) {
        finalData.logo_alt = formData.site_name_text || site.site_name;
      }

      const navConfig = {
        logo_url: finalData.logo_url,
        logo_image_url: finalData.logo_image_url,
        logo_alt: finalData.logo_alt,
        site_name_text: finalData.site_name_text,
        booking_button_text: finalData.booking_button_text,
        booking_button_url: finalData.booking_button_url,
        show_admin_link: finalData.show_admin_link,
        menu_items: finalData.menu_items,
        auto_menu_pages: finalData.auto_menu_pages,
        social_links: finalData.social_links,
      };

      return base44.entities.Site.update(siteId, { navigation_config: navConfig });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      queryClient.invalidateQueries({ queryKey: ['siteViewData'] });
      setLogoFile(null);
      toast.success('ヘッダー設定を保存しました');
    },
    onError: (err) => {
      toast.error(`保存エラー: ${err.message}`);
    },
  });

  const navLinkCreateMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.NavigationLink.create({
        site_id: siteId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigationLinks', siteId] });
      queryClient.invalidateQueries({ queryKey: ['siteViewData'] });
      setShowNavLinkDialog(false);
      toast.success('リンクを追加しました');
    },
  });

  const navLinkUpdateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.NavigationLink.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigationLinks', siteId] });
      queryClient.invalidateQueries({ queryKey: ['siteViewData'] });
      setShowNavLinkDialog(false);
      setEditingNavLink(null);
      toast.success('リンクを更新しました');
    },
  });

  const navLinkDeleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NavigationLink.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigationLinks', siteId] });
      queryClient.invalidateQueries({ queryKey: ['siteViewData'] });
      toast.success('リンクを削除しました');
    },
  });

  const handleNavLinkSave = (data) => {
    if (editingNavLink) {
      navLinkUpdateMutation.mutate({ id: editingNavLink.id, data });
    } else {
      const maxSort = navLinks.length > 0 ? Math.max(...navLinks.map(l => l.sort_order || 0)) : 0;
      navLinkCreateMutation.mutate({ ...data, sort_order: data.sort_order || maxSort + 1 });
    }
  };

  const handleNavLinkMove = async (id, direction) => {
    const sorted = [...navLinks].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(l => l.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    
    await base44.entities.NavigationLink.update(sorted[idx].id, { sort_order: sorted[swapIdx].sort_order });
    await base44.entities.NavigationLink.update(sorted[swapIdx].id, { sort_order: sorted[idx].sort_order });
    queryClient.invalidateQueries({ queryKey: ['navigationLinks', siteId] });
  };

  const addMenuItem = () => {
    if (!newMenuItem.label || !newMenuItem.href) return;
    setFormData(p => ({
      ...p,
      menu_items: [...p.menu_items, { ...newMenuItem, sort_order: p.menu_items.length }]
    }));
    setNewMenuItem({ label: '', href: '', target: '_self', is_visible: true });
  };

  const addOtherSns = () => {
    if (!newOtherSns.name || !newOtherSns.url) return;
    setFormData(p => ({
      ...p,
      social_links: [...p.social_links, {
        platform: `other_${Date.now()}`,
        name: newOtherSns.name,
        url: newOtherSns.url,
        show_in_header: false,
        show_in_footer: false,
        open_new_tab: true,
      }]
    }));
    setNewOtherSns({ name: '', url: '' });
  };

  const deleteOtherSns = (platform) => {
    setFormData(p => ({
      ...p,
      social_links: p.social_links.filter(s => s.platform !== platform)
    }));
  };

  const updateMenuItem = (idx, field, value) => {
    setFormData(p => ({
      ...p,
      menu_items: p.menu_items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }));
  };

  const deleteMenuItem = (idx) => {
    setFormData(p => ({
      ...p,
      menu_items: p.menu_items.filter((_, i) => i !== idx)
    }));
  };

  const moveMenuItem = (idx, direction) => {
    const items = [...formData.menu_items];
    if (direction === -1 && idx === 0) return;
    if (direction === 1 && idx === items.length - 1) return;
    [items[idx], items[idx + direction]] = [items[idx + direction], items[idx]];
    setFormData(p => ({
      ...p,
      menu_items: items.map((item, i) => ({ ...item, sort_order: i }))
    }));
  };

  const toggleAutoMenuPage = (pageId, enabled) => {
    setFormData(p => {
      if (enabled) {
        return {
          ...p,
          auto_menu_pages: p.auto_menu_pages.filter(m => m.page_id !== pageId)
        };
      } else {
        return {
          ...p,
          auto_menu_pages: [...p.auto_menu_pages, { page_id: pageId, show_in_header: true, sort_order: p.auto_menu_pages.length }]
        };
      }
    });
  };

  const updateSocialLink = (platform, field, value) => {
    setFormData(p => {
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

  if (!siteId || siteLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="ヘッダー設定">
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  const publishedPages = pages.filter(p => p.status === 'published');

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="ヘッダー設定">
        <div className="max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <Link to={`${createPageUrl('SitePageManager')}?site_id=${siteId}`}>
              <Button variant="outline" size="icon">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800">ヘッダー設定</h2>
              <p className="text-sm text-slate-500 mt-0.5">{site?.site_name}</p>
            </div>
            <div className="ml-auto">
              <a href={`/site/${siteId}?preview=true`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye className="w-4 h-4" />プレビュー
                </Button>
              </a>
            </div>
          </div>

          {/* ロゴ・サイト名 */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">ロゴ・サイト名</h3>
            <div className="space-y-4">
              {/* ロゴアップロード */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">ロゴ画像</label>
                <div className="text-xs text-slate-500 mb-2">推奨サイズ: 240×80px | 推奨形式: PNG / SVG</div>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                  {formData.logo_image_url ? (
                    <div className="space-y-3">
                      <img src={formData.logo_image_url} alt="ロゴプレビュー" className="h-16 mx-auto" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setFormData(p => ({ ...p, logo_image_url: '' }))}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />削除
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-slate-400" />
                      <span className="text-sm text-slate-600">クリックしてアップロード</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* ロゴURL */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ロゴ URL（アップロード未使用時）</label>
                <Input
                  value={formData.logo_url}
                  onChange={e => setFormData(p => ({ ...p, logo_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              {/* ロゴAlt */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ロゴ alt テキスト</label>
                <Input
                  value={formData.logo_alt}
                  onChange={e => setFormData(p => ({ ...p, logo_alt: e.target.value }))}
                  placeholder="空白の場合はサイト名を使用"
                />
              </div>

              {/* サイト名 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">サイト名</label>
                <Input
                  value={formData.site_name_text}
                  onChange={e => setFormData(p => ({ ...p, site_name_text: e.target.value }))}
                  placeholder="例: サロン名"
                />
              </div>
            </div>
          </Card>

          {/* ページ連動メニュー */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-800">ページ連動メニュー</h3>
              <p className="text-xs text-slate-500 mt-1">公開中のページが自動で上部メニューに反映されます</p>
            </div>
            <div className="space-y-2">
              {publishedPages.length === 0 ? (
                <p className="text-sm text-slate-500">公開済みページがありません</p>
              ) : (
                publishedPages.map(page => {
                  const isIncluded = formData.auto_menu_pages.some(m => m.page_id === page.id);
                  return (
                    <label key={page.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={(e) => toggleAutoMenuPage(page.id, isIncluded)}
                        className="w-4 h-4 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-700">{page.title}</p>
                        <p className="text-xs text-slate-400">/{page.slug}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </Card>

          {/* 手動リンク */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">手動追加リンク</h3>
                <p className="text-xs text-slate-500 mt-1">外部サイトや任意のURLをメニューに追加できます。ページ連動メニューとは別に、独自リンクを追加できます。</p>
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                onClick={() => {
                  setEditingNavLink(null);
                  setShowNavLinkDialog(true);
                }}
              >
                <Plus className="w-4 h-4" />追加
              </Button>
            </div>
            <ManualNavigationLinkList
              links={navLinks}
              onEdit={(link) => {
                setEditingNavLink(link);
                setShowNavLinkDialog(true);
              }}
              onDelete={(id) => navLinkDeleteMutation.mutate(id)}
              onMove={handleNavLinkMove}
              isLoading={navLinkDeleteMutation.isPending}
            />
          </Card>

          {/* SNS設定 */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">SNS リンク</h3>
            <div className="space-y-4">
              {SNS_PLATFORMS.map(platform => {
                const link = formData.social_links.find(s => s.platform === platform.key) || {
                  platform: platform.key,
                  url: '',
                  show_in_header: false,
                  show_in_footer: false,
                  open_new_tab: true,
                };
                return (
                  <div key={platform.key} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-slate-700">{platform.label}</h4>
                    <Input
                      value={link.url}
                      onChange={e => updateSocialLink(platform.key, 'url', e.target.value)}
                      placeholder={`${platform.label} URL`}
                    />
                    <div className="flex items-center gap-6 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={link.show_in_header}
                          onChange={e => updateSocialLink(platform.key, 'show_in_header', e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        ヘッダーに表示
                      </label>
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

              {/* その他 */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-slate-700 mb-3">その他のSNS</h4>
                <div className="space-y-3">
                  {formData.social_links.filter(s => s.platform.startsWith('other_')).map((link) => (
                    <div key={link.platform} className="border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">サービス名</label>
                          <Input
                            value={link.name || ''}
                            onChange={e => {
                              setFormData(p => ({
                                ...p,
                                social_links: p.social_links.map(s => s.platform === link.platform ? { ...s, name: e.target.value } : s)
                              }));
                            }}
                            placeholder="例: YouTube"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">URL</label>
                          <Input
                            value={link.url || ''}
                            onChange={e => {
                              setFormData(p => ({
                                ...p,
                                social_links: p.social_links.map(s => s.platform === link.platform ? { ...s, url: e.target.value } : s)
                              }));
                            }}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={link.show_in_header}
                            onChange={e => {
                              setFormData(p => ({
                                ...p,
                                social_links: p.social_links.map(s => s.platform === link.platform ? { ...s, show_in_header: e.target.checked } : s)
                              }));
                            }}
                            className="w-4 h-4 rounded"
                          />
                          ヘッダーに表示
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={link.show_in_footer}
                            onChange={e => {
                              setFormData(p => ({
                                ...p,
                                social_links: p.social_links.map(s => s.platform === link.platform ? { ...s, show_in_footer: e.target.checked } : s)
                              }));
                            }}
                            className="w-4 h-4 rounded"
                          />
                          フッターに表示
                        </label>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="ml-auto w-7 h-7 text-red-500"
                          onClick={() => deleteOtherSns(link.platform)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 space-y-3 bg-slate-50">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">サービス名</label>
                        <Input
                          value={newOtherSns.name}
                          onChange={e => setNewOtherSns(p => ({ ...p, name: e.target.value }))}
                          placeholder="例: YouTube"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">URL</label>
                        <Input
                          value={newOtherSns.url}
                          onChange={e => setNewOtherSns(p => ({ ...p, url: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 gap-1 w-full"
                      onClick={addOtherSns}
                    >
                      <Plus className="w-4 h-4" />追加
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 予約ボタン */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">予約ボタン</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ボタンテキスト</label>
                <Input
                  value={formData.booking_button_text}
                  onChange={e => setFormData(p => ({ ...p, booking_button_text: e.target.value }))}
                  placeholder="ご予約"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">リンク URL</label>
                <Input
                  value={formData.booking_button_url}
                  onChange={e => setFormData(p => ({ ...p, booking_button_url: e.target.value }))}
                  placeholder="#booking"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_admin_link}
                  onChange={e => setFormData(p => ({ ...p, show_admin_link: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-slate-600">管理者ログインリンクを表示</span>
              </label>
            </div>
          </Card>

          {/* 保存ボタン */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>キャンセル</Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : '保存'}
            </Button>
          </div>
          </div>

          {/* Manual Link Dialog */}
          <Dialog open={showNavLinkDialog} onOpenChange={setShowNavLinkDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingNavLink ? 'リンクを編集' : '新しいリンクを追加'}
              </DialogTitle>
            </DialogHeader>
            <ManualNavigationLinkForm
              initialData={editingNavLink ? {
                label: editingNavLink.label,
                url: editingNavLink.url,
                target: editingNavLink.target,
                placement: editingNavLink.placement,
                sort_order: editingNavLink.sort_order,
              } : null}
              onSave={handleNavLinkSave}
              onCancel={() => {
                setShowNavLinkDialog(false);
                setEditingNavLink(null);
              }}
              isLoading={navLinkCreateMutation.isPending || navLinkUpdateMutation.isPending}
            />
          </DialogContent>
          </Dialog>
          </UserLayout>
          </ProtectedRoute>
          );
          }