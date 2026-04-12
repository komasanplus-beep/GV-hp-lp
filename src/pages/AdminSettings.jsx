import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = {
  account_name: '',
  user_name: '',
  contact_name: '',
  email: '',
  phone: '',
  company_name: '',
  address: '',
  notes: '',
};

export default function AdminSettings() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId') || null;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // isFetching でなく isLoading(初回のみ)を使用して、再フェッチ時にローディング画面へ切り替わらないようにする
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['accountProfile', targetUserId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getAccountProfile', targetUserId ? { user_id: targetUserId } : {});
      return res.data || {};
    },
  });

  // プロファイルデータをフォームに反映（編集中は上書きしない）
  useEffect(() => {
    if (!isEditing) {
      const p = profile || {};
      const u = currentUser || {};
      setForm({
        account_name: p.account_name || '',
        user_name: p.user_name || '',
        contact_name: p.contact_name || u.full_name || '',
        email: p.email || u.email || '',
        phone: p.phone || '',
        company_name: p.company_name || '',
        address: p.address || '',
        notes: p.notes || '',
      });
    }
  }, [profile, currentUser, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('saveAccountProfile', { profile: data });
      if (!res.data?.success) throw new Error(res.data?.error || '保存に失敗しました');
      return res.data;
    },
    onSuccess: (data) => {
      setSaveError('');
      // 保存成功時はサーバー返却値でフォームを更新（再フェッチで画面が壊れるのを防ぐ）
      if (data?.profile) {
        const p = data.profile;
        setForm({
          account_name: p.account_name || '',
          user_name: p.user_name || '',
          contact_name: p.contact_name || '',
          email: p.email || '',
          phone: p.phone || '',
          company_name: p.company_name || '',
          address: p.address || '',
          notes: p.notes || '',
        });
        // キャッシュを手動更新（再フェッチはしない）
        qc.setQueryData(['accountProfile'], p);
      }
      setIsEditing(false);
      toast.success('アカウント情報を保存しました');
    },
    onError: (err) => {
      setSaveError(err.message || '保存に失敗しました');
      toast.error('保存に失敗しました: ' + err.message);
    },
  });

  const handleSave = () => {
    if (saveMutation.isPending) return;
    if (!form.account_name?.trim() || !form.email?.trim()) {
      setSaveError('アカウント名とメールアドレスは必須です');
      return;
    }
    setSaveError('');
    saveMutation.mutate(form);
  };

  const handleCancelEdit = () => {
    // キャンセル時はキャッシュ済みのプロフィールに戻す
    const p = profile || {};
    const u = currentUser || {};
    setForm({
      account_name: p.account_name || '',
      user_name: p.user_name || '',
      contact_name: p.contact_name || u.full_name || '',
      email: p.email || u.email || '',
      phone: p.phone || '',
      company_name: p.company_name || '',
      address: p.address || '',
      notes: p.notes || '',
    });
    setSaveError('');
    setIsEditing(false);
  };

  // 初回ローディングのみスピナー表示
  if (isLoadingProfile) {
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

          {/* ログイン情報（読み取り専用） */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ログイン情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">ユーザー名</label>
                <Input value={(targetUserId ? profile?.contact_name : currentUser?.full_name) || '-'} disabled className="bg-slate-50" readOnly />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">ログインメール</label>
                <Input value={(targetUserId ? profile?.email : currentUser?.email) || '-'} disabled className="bg-slate-50" readOnly />
              </div>
            </CardContent>
          </Card>

          {/* アカウント情報（編集可能） */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">アカウント情報</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    編集
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={saveMutation.isPending}>
                    キャンセル
                  </Button>
                )}
              </div>
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

              {saveError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {saveError}
                </p>
              )}

              {isEditing && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 gap-2"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</>
                      : <><Save className="w-4 h-4" />保存</>
                    }
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