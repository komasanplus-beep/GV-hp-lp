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
import { ChevronLeft, Plus, Trash2, Loader2, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

export default function SiteHeaderSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');

  const [headerConfig, setHeaderConfig] = useState(null);
  const [formData, setFormData] = useState({
    logo_url: '',
    site_name_text: '',
    booking_button_text: 'ご予約',
    booking_button_url: '#booking',
    show_admin_link: false,
    menu_items: [],
  });

  const queryClient = useQueryClient();

  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => siteId ? base44.entities.Site.filter({ id: siteId }).then(r => r[0]) : null,
    enabled: !!siteId,
  });

  useEffect(() => {
    if (site) {
      const navConfig = site.navigation_config || {};
      setFormData({
        logo_url: navConfig.logo_url || site.logo_url || '',
        site_name_text: navConfig.site_name_text || site.site_name || '',
        booking_button_text: navConfig.booking_button_text || 'ご予約',
        booking_button_url: navConfig.booking_button_url || '#booking',
        show_admin_link: navConfig.show_admin_link ?? false,
        menu_items: navConfig.menu_items || [],
      });
    }
  }, [site]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const navConfig = {
        logo_url: formData.logo_url,
        site_name_text: formData.site_name_text,
        booking_button_text: formData.booking_button_text,
        booking_button_url: formData.booking_button_url,
        show_admin_link: formData.show_admin_link,
        menu_items: formData.menu_items,
      };
      return base44.entities.Site.update(siteId, { navigation_config: navConfig });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      queryClient.invalidateQueries({ queryKey: ['siteViewData'] });
      toast.success('ヘッダー設定を保存しました');
    },
  });

  const addMenuItem = () => {
    setFormData(p => ({
      ...p,
      menu_items: [...p.menu_items, { label: '新項目', href: '#', sort_order: p.menu_items.length, is_visible: true }]
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
    
    const newIdx = idx + direction;
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    
    setFormData(p => ({
      ...p,
      menu_items: items.map((item, i) => ({ ...item, sort_order: i }))
    }));
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

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="ヘッダー設定">
        <div className="max-w-3xl space-y-6">
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
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ロゴ URL</label>
                <Input
                  value={formData.logo_url}
                  onChange={e => setFormData(p => ({ ...p, logo_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
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

          {/* メニュー項目 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">メニュー項目</h3>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={addMenuItem}>
                <Plus className="w-4 h-4" />追加
              </Button>
            </div>
            <div className="space-y-3">
              {formData.menu_items.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">ラベル</label>
                      <Input
                        value={item.label}
                        onChange={e => updateMenuItem(idx, 'label', e.target.value)}
                        placeholder="例: About"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">リンク</label>
                      <Input
                        value={item.href}
                        onChange={e => updateMenuItem(idx, 'href', e.target.value)}
                        placeholder="例: #about or /page"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.is_visible}
                      onChange={e => updateMenuItem(idx, 'is_visible', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm text-slate-600">表示</label>
                    <div className="ml-auto flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveMenuItem(idx, -1)} disabled={idx === 0}>
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveMenuItem(idx, 1)} disabled={idx === formData.menu_items.length - 1}>
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteMenuItem(idx)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.show_admin_link}
                  onChange={e => setFormData(p => ({ ...p, show_admin_link: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm text-slate-600">管理者ログインリンクを表示</label>
              </div>
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
      </UserLayout>
    </ProtectedRoute>
  );
}