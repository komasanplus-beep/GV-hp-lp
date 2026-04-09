import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import UserLayout from '@/components/user/UserLayout';
import { createPageUrl } from '@/utils';
import { Plus, Pencil, Trash2, Loader2, ImageIcon } from 'lucide-react';
import { getServiceLabel, getPriceLabel, getDurationLabel, getCapacityLabel, BUSINESS_TYPE_LABELS } from '@/lib/businessTypeLabels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { toast } from 'sonner';

const defaultService = {
  name: '',
  description: '',
  price: 0,
  duration: '',
  image_url: '',
  status: 'available',
};

export default function AdminServices() {
  const urlParams = new URLSearchParams(window.location.search);
  let siteId = urlParams.get('site_id');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteService, setDeleteService] = useState(null);
  const [formData, setFormData] = useState(defaultService);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // 全サイト取得 → site_id未指定時に自動選択
  const { data: allSites = [] } = useQuery({
    queryKey: ['allSites'],
    queryFn: () => base44.entities.Site.list('-created_date'),
  });

  // site_idが未指定なら最初のサイトを自動選択
  if (!siteId && allSites.length > 0) {
    siteId = allSites[0].id;
  }

  const { data: site } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => base44.entities.Site.filter({ id: siteId }).then(r => r[0]),
    enabled: !!siteId,
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', siteId],
    queryFn: () => base44.entities.Service.filter({ site_id: siteId }, 'sort_order'),
    enabled: !!siteId,
  });

  const typeInfo = site ? (BUSINESS_TYPE_LABELS[site.business_type] || BUSINESS_TYPE_LABELS.other) : BUSINESS_TYPE_LABELS.other;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create({ ...data, site_id: siteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', siteId] });
      handleCloseModal();
      toast.success('サービスを追加しました');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', siteId] });
      handleCloseModal();
      toast.success('更新しました');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', siteId] });
      setDeleteService(null);
      toast.success('削除しました');
    },
  });

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData(defaultService);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData(defaultService);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, image_url: file_url }));
    setIsUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('サービス名は必須です');
      return;
    }
    if (!siteId) {
      toast.error('サイトが選択されていません。URLにsite_idを指定してください。');
      return;
    }
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!siteId) {
    return (
      <ProtectedRoute requiredRole="admin">
        <UserLayout title="サービス管理">
          <Card>
            <CardContent className="py-16 text-center text-slate-400">
              <p className="text-3xl mb-2">🏢</p>
              <p className="font-medium">サイトを選択してください</p>
              <p className="text-sm mt-3 mb-6">サービスを管理するサイトを選んでください</p>
              {allSites.length === 0 ? (
                <p className="text-sm text-slate-400">サイトがありません。先にサイトを作成してください</p>
              ) : (
                <div className="space-y-2">
                  {allSites.map(s => (
                    <button
                      key={s.id}
                      onClick={() => window.location.href = `${createPageUrl('AdminServices')}?site_id=${s.id}`}
                      className="w-full px-4 py-2.5 text-left bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-colors text-slate-700 font-medium text-sm"
                    >
                      {s.site_name}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <UserLayout title="サービス管理">
        <div className="max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{typeInfo.service_label}一覧</h2>
              <p className="text-sm text-slate-500 mt-0.5">{services.length} 件 {typeInfo.icon}</p>
            </div>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-amber-600 hover:bg-amber-700 gap-2"
            >
              <Plus className="w-4 h-4" />新規{typeInfo.service_label}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-slate-400">
                <p className="text-3xl mb-2">{typeInfo.icon}</p>
                <p className="font-medium">{typeInfo.service_label}がありません</p>
                <p className="text-sm mt-1 mb-4">最初の{typeInfo.service_label}を追加してください</p>
                <Button onClick={() => handleOpenModal()} className="bg-amber-600 hover:bg-amber-700 gap-2">
                  <Plus className="w-4 h-4" />{typeInfo.service_label}を追加
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(service => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {service.image_url && (
                      <img src={service.image_url} alt={service.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                    )}
                    <h3 className="font-semibold text-slate-800">{service.name}</h3>
                    {service.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{service.description}</p>}
                    <div className="flex flex-col gap-1 mt-3 text-xs text-slate-600">
                      {service.price > 0 && <div><span className="text-slate-500">{getPriceLabel(site?.business_type)}</span>: ¥{service.price.toLocaleString()}</div>}
                      {service.duration && <div><span className="text-slate-500">{getDurationLabel(site?.business_type)}</span>: {service.duration}</div>}
                      {service.capacity && <div><span className="text-slate-500">{getCapacityLabel(site?.business_type)}</span>: {service.capacity}名</div>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenModal(service)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" />編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteService(service)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingService ? `${typeInfo.service_label}を編集` : `${typeInfo.service_label}を追加`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">{typeInfo.service_label}名 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`例: ${typeInfo.service_label}`}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">説明</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="サービスの説明..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{getPriceLabel(site?.business_type)} (¥)</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{getDurationLabel(site?.business_type)}</label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="例: 60分"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">画像</label>
                {formData.image_url && (
                  <img src={formData.image_url} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                )}
                <label className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-3 cursor-pointer hover:border-amber-300 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />アップロード
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>キャンセル</Button>
                <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingService ? '更新' : `${typeInfo.service_label}を追加`}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{typeInfo.service_label}を削除</AlertDialogTitle>
              <AlertDialogDescription>
                「{deleteService?.name}」を削除してもよろしいですか？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deleteService.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </UserLayout>
    </ProtectedRoute>
  );
}