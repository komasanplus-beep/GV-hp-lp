import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { 
  Search,
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Pencil,
  Trash2,
  Loader2,
  X
} from 'lucide-react';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from '@/components/ui/card';

const defaultGuest = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  id_number: '',
  nationality: '',
  notes: '',
  vip_status: false
};

export default function AdminGuests() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [deleteGuest, setDeleteGuest] = useState(null);
  const [formData, setFormData] = useState(defaultGuest);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('site_id');

  // API レベルで顧客管理機能のアクセス権確認
  const { data: accessCheck, isLoading: isCheckingAccess } = useQuery({
    queryKey: ['featureAccess', 'customer_management'],
    queryFn: async () => {
      const res = await base44.functions.invoke('resolveFeatureAccess', {
        feature_code: 'customer_management',
        site_id: siteId,
      });
      return res.data;
    },
  });

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', siteId],
    queryFn: () => (siteId
      ? base44.entities.Guest.filter({ site_id: siteId }, '-created_date')
      : []),
    enabled: !!siteId,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', siteId],
    queryFn: () => siteId
      ? base44.entities.Booking.filter({ site_id: siteId }, '-created_date')
      : [],
    enabled: !!siteId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Guest.create({ ...data, site_id: siteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', siteId] });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Guest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', siteId] });
      handleCloseModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Guest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', siteId] });
      setDeleteGuest(null);
    },
  });

  const handleOpenModal = (guest = null) => {
    if (guest) {
      setEditingGuest(guest);
      setFormData(guest);
    } else {
      setEditingGuest(null);
      setFormData(defaultGuest);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGuest(null);
    setFormData(defaultGuest);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingGuest) {
      updateMutation.mutate({ id: editingGuest.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getGuestBookings = (guestEmail) => {
    return bookings.filter(b => b.email === guestEmail);
  };

  const filteredGuests = guests.filter(guest => 
    !searchQuery || 
    guest.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // アクセス拒否の場合
  if (!isCheckingAccess && accessCheck && accessCheck.allowed === false) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="ゲスト管理">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">アクセスできません</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              顧客管理機能はご利用のプランに含まれていません。<br />
              オプション「顧客管理」をご契約ください。
            </p>
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="ゲスト管理">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="ゲストを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          ゲストを追加
        </Button>
      </div>

      {/* Guests Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl">
          <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">ゲストが見つかりません</h3>
          <p className="text-slate-500 mb-6">
            {searchQuery ? '別の検索ワードをお試しください' : '最初のゲストを追加してください'}
          </p>
          {!searchQuery && (
            <Button onClick={() => handleOpenModal()} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              ゲストを追加
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuests.map((guest, index) => {
            const guestBookings = getGuestBookings(guest.email);
            return (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-600 font-semibold text-lg">
                            {guest.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            {guest.full_name}
                            {guest.vip_status && (
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            )}
                          </h3>
                          <p className="text-sm text-slate-500">{guest.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {guest.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {guest.phone}
                        </div>
                      )}
                      {guest.nationality && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {guest.nationality}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Badge variant="secondary" className="bg-slate-100">
                        {guestBookings.length} 件の予約
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(guest)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteGuest(guest)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGuest ? 'ゲストを編集' : 'ゲストを追加'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">氏名 *</label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">メールアドレス *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">電話番号</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">国籍</label>
              <Input
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">住所</label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">ID・パスポート番号</label>
              <Input
                value={formData.id_number}
                onChange={(e) => handleChange('id_number', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">メモ</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">VIPゲスト</label>
              <Switch
                checked={formData.vip_status}
                onCheckedChange={(val) => handleChange('vip_status', val)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                キャンセル
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingGuest ? '更新する' : '作成する'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGuest} onOpenChange={() => setDeleteGuest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ゲストを削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteGuest?.full_name}」を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteGuest.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UserLayout>
    </ProtectedRoute>
  );
}