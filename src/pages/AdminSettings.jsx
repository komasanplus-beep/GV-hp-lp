import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Save, Upload, Loader2, Store, MapPin, Phone, Mail, Globe, Instagram, Image, X, Link } from 'lucide-react';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const defaultSettings = {
  salon_name: '',
  tagline: '',
  address: '',
  phone: '',
  email: '',
  logo_url: '',
  hero_title: '',
  hero_subtitle: '',
  hero_button_text: '今すぐ予約',
  hero_button_url: '',
  hero_image_url: '',
  instagram_url: '',
  line_url: '',
  booking_url: '',
  map_embed_url: '',
};

export default function AdminSettings() {
  const [formData, setFormData] = useState(defaultSettings);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['salonSettings'],
    queryFn: () => base44.entities.SalonSettings.list(),
  });
  const current = settings[0];

  useEffect(() => {
    if (current) setFormData({ ...defaultSettings, ...current });
  }, [current]);

  const saveMutation = useMutation({
    mutationFn: (data) => current?.id
      ? base44.entities.SalonSettings.update(current.id, data)
      : base44.entities.SalonSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salonSettings'] });
      toast.success('設定を保存しました');
    },
  });

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange('logo_url', file_url);
    setIsUploading(false);
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHero(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange('hero_image_url', file_url);
    setIsUploadingHero(false);
  };

  if (isLoading) return (
    <ProtectedRoute><UserLayout title="設定">
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    </UserLayout></ProtectedRoute>
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="設定">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="max-w-4xl space-y-6">

          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" />店舗基本情報</CardTitle>
              <CardDescription>店舗の基本情報を設定してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">店舗名</label>
                  <Input value={formData.salon_name} onChange={e => handleChange('salon_name', e.target.value)} placeholder="サロン名" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">キャッチコピー</label>
                  <Input value={formData.tagline} onChange={e => handleChange('tagline', e.target.value)} placeholder="あなたの美しさを引き出す" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">ロゴ</label>
                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <div className="relative">
                      <img src={formData.logo_url} alt="Logo" className="h-20 w-auto object-contain bg-slate-100 rounded-lg p-2" />
                      <button type="button" onClick={() => handleChange('logo_url', '')} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center h-20 w-40 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-amber-400">
                      {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (
                        <div className="text-center"><Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" /><span className="text-xs text-slate-500">ロゴをアップロード</span></div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploading} />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 連絡先 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" />連絡先情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><MapPin className="w-4 h-4" />住所</label>
                <Input value={formData.address} onChange={e => handleChange('address', e.target.value)} placeholder="東京都渋谷区..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><Phone className="w-4 h-4" />電話番号</label>
                  <Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="03-XXXX-XXXX" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><Mail className="w-4 h-4" />メール</label>
                  <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="info@salon.com" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><Link className="w-4 h-4" />予約URL</label>
                <Input value={formData.booking_url} onChange={e => handleChange('booking_url', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><Globe className="w-4 h-4" />Google マップ埋め込みURL</label>
                <Input value={formData.map_embed_url} onChange={e => handleChange('map_embed_url', e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
              </div>
            </CardContent>
          </Card>

          {/* SNS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />SNS・外部リンク</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><Instagram className="w-4 h-4" />Instagram URL</label>
                <Input value={formData.instagram_url} onChange={e => handleChange('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">LINE URL</label>
                <Input value={formData.line_url} onChange={e => handleChange('line_url', e.target.value)} placeholder="https://lin.ee/..." />
              </div>
            </CardContent>
          </Card>

          {/* Hero */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />ヒーローセクション</CardTitle>
              <CardDescription>トップページのメインビジュアルエリア</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">メインタイトル</label>
                  <Input value={formData.hero_title} onChange={e => handleChange('hero_title', e.target.value)} placeholder="あなたの美しさを引き出す" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">ボタンテキスト</label>
                  <Input value={formData.hero_button_text} onChange={e => handleChange('hero_button_text', e.target.value)} placeholder="今すぐ予約" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">サブタイトル</label>
                <Textarea value={formData.hero_subtitle} onChange={e => handleChange('hero_subtitle', e.target.value)} rows={2} placeholder="サブテキストを入力..." />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">背景画像</label>
                <div className="flex items-center gap-4">
                  {formData.hero_image_url ? (
                    <div className="relative">
                      <img src={formData.hero_image_url} alt="Hero" className="h-24 w-40 object-cover rounded-lg" />
                      <button type="button" onClick={() => handleChange('hero_image_url', '')} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center h-24 w-40 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-amber-400">
                      {isUploadingHero ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (
                        <div className="text-center"><Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" /><span className="text-xs text-slate-500">画像をアップロード</span></div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} disabled={isUploadingHero} />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 px-8" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              設定を保存
            </Button>
          </div>
        </form>
      </UserLayout>
    </ProtectedRoute>
  );
}