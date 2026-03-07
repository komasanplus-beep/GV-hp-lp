import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Briefcase,
  DollarSign,
  X,
  Upload,
  Loader2
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const defaultService = {
  name: '',
  description: '',
  price_per_night: 0,
  capacity: 0,
  status: 'available',
  images: [],
  amenities: [],
  size: 0,
  bed_type: ''
};

export default function AdminRooms() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteService, setDeleteService] = useState(null);
  const [formData, setFormData] = useState(defaultService);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Room.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Room.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      handleCloseModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Room.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setDeleteService(null);
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, images: [...(prev.images || []), file_url] }));
    setIsUploading(false);
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout title="サービス管理">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-slate-500">提供サービスを管理する</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            サービスを追加
          </Button>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl">
            <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">サービスがまだありません</h3>
            <p className="text-slate-500 mb-6">最初のサービスを追加してください</p>
            <Button onClick={() => handleOpenModal()} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              サービスを追加
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100"
              >
                <div className="relative h-48 bg-slate-100">
                  {service.images?.[0] ? (
                    <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Briefcase className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{service.name}</h3>
                  {service.bed_type && (
                    <p className="text-sm text-slate-500 mb-2">{service.bed_type}</p>
                  )}
                  {service.price_per_night > 0 && (
                    <span className="flex items-center gap-1 text-sm text-slate-600 mb-3">
                      <DollarSign className="w-4 h-4" />
                      ¥{service.price_per_night.toLocaleString()}
                    </span>
                  )}
                  {service.description && (
                    <div
                      className="text-sm text-slate-500 line-clamp-2 mb-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: service.description }}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenModal(service)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteService(service)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'サービスを編集' : 'サービスを追加'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">サービス名</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="例：ヘッドスパ、フェイシャルトリートメント"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">概要</label>
                <Input
                  value={formData.bed_type}
                  onChange={(e) => handleChange('bed_type', e.target.value)}
                  placeholder="例：60分 / リラクゼーション向け"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">料金 (¥)</label>
                <Input
                  type="number"
                  value={formData.price_per_night}
                  onChange={(e) => handleChange('price_per_night', parseFloat(e.target.value))}
                  min={0}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">内容</label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(val) => handleChange('description', val)}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      [{ font: [] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ color: [] }, { background: [] }],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link'],
                      ['clean'],
                    ]
                  }}
                  className="bg-white"
                  style={{ minHeight: '180px' }}
                />
              </div>

              {/* Images */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">写真画像</label>
                <div className="grid grid-cols-4 gap-3">
                  {formData.images?.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-400">アップロード</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
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
                  {editingService ? '更新する' : '作成する'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>サービスを削除</AlertDialogTitle>
              <AlertDialogDescription>
                「{deleteService?.name}」を削除してもよろしいですか？この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deleteService.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </ProtectedRoute>
  );
}