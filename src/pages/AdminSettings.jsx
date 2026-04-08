/**
 * AdminSettings - アカウント設定ページ（拡張版）
 * ユーザーアカウント情報の表示・編集機能付き
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // 現在のユーザー取得
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // アカウントプロファイル取得
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['accountProfile'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getAccountProfile', {});
      return res.data || {};
    },
  });

  const [form, setForm] = useState({
    account_name: '',
    user_name: '',
    contact_name: '',
    email: '',
    phone: '',
    company_name: '',
    address: '',
    notes: '',
  });

  // プロファイルデータをフォームに反映
  useEffect(() => {
    if (profile) {
      setForm({
        account_name: profile.account_name || '',
        user_name: profile.user_name || '',
        contact_name: profile.contact_name || currentUser?.full_name || '',
        email: profile.email || currentUser?.email || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
        address: profile.address || '',
        notes: profile.notes || '',
      });
    } else if (currentUser) {
      setForm(prev => ({
        ...prev,
        contact_name: currentUser.full_name || '',
        email: currentUser.email || '',
      }));
    }
  }, [profile, currentUser]);

  // 保存ミューテーション
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('saveAccountProfile', { profile: data });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accountProfile'] });
      setIsEditing(false);
      toast.success('アカウント情報を保存しました');
    },
    onError: (err) => {
      toast.error('保存に失敗しました: ' + err.message);
    },
  });

  const handleSave = () => {
    if (!form.account_name || !form.email) {
      toast.error('アカウント名とメールアドレスは必須です');
      return;
    }
    saveMutation.mutate(form);
  };

  if (isLoadingUser || isLoadingProfile) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="アカウント設定">
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="アカウント設定">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* 現在のユーザー情報（読み取り専用） */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ログイン情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">ユーザー名</label>
                <Input value={currentUser?.full_name || '-'} disabled className="bg-slate-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">ログインメール</label>
                <Input value={currentUser?.email || '-'} disabled className="bg-slate-50" />
              </div>
            </CardContent>
          </Card>

          {/* アカウント情報（編集可能） */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">アカウント情報</CardTitle>
              <Button
                variant={isEditing ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    setForm(prev => ({
                      ...prev,
                      account_name: profile?.account_name || '',
                      user_name: profile?.user_name || '',
                      contact_name: profile?.contact_name || currentUser?.full_name || '',
                      email: profile?.email || currentUser?.email || '',
                      phone: profile?.phone || '',
                      company_name: profile?.company_name || '',
                      address: profile?.address || '',
                      notes: profile?.notes || '',
                    }));
                  }
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? 'キャンセル' : '編集'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">アカウント名 *</label>
                  <Input
                    value={form.account_name}
                    onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))}
                    placeholder="例: 山田太郎"
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-slate-50' : ''}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">ユーザー名</label>
                  <Input
                    value={form.user_name}
                    onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))}
                    placeholder="例: yamada_taro"
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-slate-50' : ''}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">担当者名</label>
                <Input
                  value={form.contact_name}
                  onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))}
                  placeholder="例: 山田太郎"
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-slate-50' : ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">メールアドレス *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="例: yamada@example.com"
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-slate-50' : ''}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">電話番号</label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="例: 090-1234-5678"
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-slate-50' : ''}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">会社名 / 屋号</label>
                <Input
                  value={form.company_name}
                  onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="例: 株式会社○○"
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">住所</label>
                <Input
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="例: 東京都渋谷区○○"
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">備考</label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="その他の情報があれば入力"
                  disabled={!isEditing}
                  className={`resize-none ${!isEditing ? 'bg-slate-50' : ''}`}
                  rows={3}
                />
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 gap-2"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    保存
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 注意事項 */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">ログインメールアドレスの変更</p>
                <p className="text-xs">ログイン用メールアドレスを変更する場合は、サポートまでお問い合わせください。</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}