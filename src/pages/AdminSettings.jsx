import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { 
  Save,
  Upload,
  Loader2,
  Hotel,
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  X,
  Image,
  Navigation,
  Layout
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const defaultSettings = {
  hotel_name: 'Bawi Hotel',
  tagline: 'Experience Luxury Redefined',
  address: '',
  phone: '',
  email: '',
  logo_url: '',
  about_text: '',
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  map_embed_url: '',
  hero_eyebrow: 'Welcome to',
  hero_title: '',
  hero_subtitle: '',
  hero_button_text: '予約する',
  hero_button_url: '',
  hero_image_url: '',
  nav_about: 'About',
  nav_services: 'Services',
  nav_facilities: 'Facilities',
  nav_gallery: 'Gallery',
  nav_contact: 'Contact',
  nav_book_button: 'Book Now',
};

export default function AdminSettings() {
  const [formData, setFormData] = useState(defaultSettings);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['hotelSettings'],
    queryFn: () => base44.entities.HotelSettings.list(),
  });

  const currentSettings = settings[0];

  useEffect(() => {
    if (currentSettings) {
      setFormData({ ...defaultSettings, ...currentSettings });
    }
  }, [currentSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (currentSettings?.id) {
        return base44.entities.HotelSettings.update(currentSettings.id, data);
      } else {
        return base44.entities.HotelSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelSettings'] });
      toast.success('設定を保存しました');
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, logo_url: file_url }));
    setIsUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AdminLayout title="Settings">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout title="Settings">
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Hotel Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              店舗基本情報
            </CardTitle>
            <CardDescription>店舗の基本情報を設定してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">店舗名</label>
                <Input
                  value={formData.hotel_name}
                  onChange={(e) => handleChange('hotel_name', e.target.value)}
                  placeholder="店舗名"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">キャッチコピー</label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="ホテルのキャッチコピー"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">ロゴ</label>
              <div className="flex items-center gap-4">
                {formData.logo_url ? (
                  <div className="relative">
                    <img 
                      src={formData.logo_url} 
                      alt="Logo" 
                      className="h-20 w-auto object-contain bg-slate-100 rounded-lg p-2"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('logo_url', '')}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-20 w-40 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-amber-400">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs text-slate-500">ロゴをアップロード</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">店舗紹介文</label>
              <Textarea
                value={formData.about_text}
                onChange={(e) => handleChange('about_text', e.target.value)}
                rows={4}
                placeholder="店舗の紹介文を入力してください..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              連絡先情報
            </CardTitle>
            <CardDescription>ゲストが連絡できる情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                住所
                </label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Paradise Avenue, Bali, Indonesia"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  電話番号
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+62 361 123 4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  メールアドレス
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="info@bawihotel.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Google マップ埋め込みURL
                </label>
                <Input
                value={formData.map_embed_url}
                onChange={(e) => handleChange('map_embed_url', e.target.value)}
                placeholder="https://www.google.com/maps/embed?..."
                />
                <p className="text-xs text-slate-500 mt-1">
                Google マップで「共有」→「地図を埋め込む」→ HTMLの src URL をコピーして貼り付けてください
                </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              ソーシャルメディア
            </CardTitle>
            <CardDescription>SNSアカウントのURLを入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                Facebook
              </label>
              <Input
                value={formData.social_facebook}
                onChange={(e) => handleChange('social_facebook', e.target.value)}
                placeholder="https://facebook.com/bawihotel"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram
              </label>
              <Input
                value={formData.social_instagram}
                onChange={(e) => handleChange('social_instagram', e.target.value)}
                placeholder="https://instagram.com/bawihotel"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </label>
              <Input
                value={formData.social_twitter}
                onChange={(e) => handleChange('social_twitter', e.target.value)}
                placeholder="https://twitter.com/bawihotel"
              />
            </div>
          </CardContent>
        </Card>

        {/* Hero Section Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5" />
              ヒーローセクション
            </CardTitle>
            <CardDescription>トップページのメインビジュアルエリアのテキストを設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">上部小テキスト（eyebrow）</label>
                <Input
                  value={formData.hero_eyebrow}
                  onChange={(e) => handleChange('hero_eyebrow', e.target.value)}
                  placeholder="Welcome to"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">メインタイトル</label>
                <Input
                  value={formData.hero_title}
                  onChange={(e) => handleChange('hero_title', e.target.value)}
                  placeholder="店舗名・キャッチタイトル"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">サブタイトル</label>
              <Textarea
                value={formData.hero_subtitle}
                onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                rows={2}
                placeholder="サブタイトルや説明文を入力..."
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ボタンテキスト</label>
                <Input
                  value={formData.hero_button_text}
                  onChange={(e) => handleChange('hero_button_text', e.target.value)}
                  placeholder="予約する"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  背景画像URL
                </label>
                <Input
                  value={formData.hero_image_url}
                  onChange={(e) => handleChange('hero_image_url', e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-slate-500 mt-1">空欄の場合はデフォルト画像が使用されます</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Menu Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              ナビゲーションメニュー
            </CardTitle>
            <CardDescription>ヘッダーメニューの各項目ラベルを設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">About（紹介）</label>
                <Input
                  value={formData.nav_about}
                  onChange={(e) => handleChange('nav_about', e.target.value)}
                  placeholder="About"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Services（サービス）</label>
                <Input
                  value={formData.nav_services}
                  onChange={(e) => handleChange('nav_services', e.target.value)}
                  placeholder="Services"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Facilities（設備）</label>
                <Input
                  value={formData.nav_facilities}
                  onChange={(e) => handleChange('nav_facilities', e.target.value)}
                  placeholder="Facilities"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Gallery（ギャラリー）</label>
                <Input
                  value={formData.nav_gallery}
                  onChange={(e) => handleChange('nav_gallery', e.target.value)}
                  placeholder="Gallery"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Contact（連絡先）</label>
                <Input
                  value={formData.nav_contact}
                  onChange={(e) => handleChange('nav_contact', e.target.value)}
                  placeholder="Contact"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">予約ボタン</label>
                <Input
                  value={formData.nav_book_button}
                  onChange={(e) => handleChange('nav_book_button', e.target.value)}
                  placeholder="Book Now"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-amber-600 hover:bg-amber-700 px-8"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            設定を保存
          </Button>
        </div>
      </form>
    </AdminLayout>
    </ProtectedRoute>
  );
}