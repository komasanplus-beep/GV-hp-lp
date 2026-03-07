import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { 
  Plus,
  Pencil,
  Trash2,
  Image,
  MessageSquare,
  Sparkles,
  FileText,
  Loader2,
  Upload,
  X,
  Star
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const defaultContent = {
  section: 'about',
  title: '',
  content: '',
  image_url: '',
  icon: '',
  rating: 5,
  author: '',
  order: 0,
  is_active: true
};

const iconOptions = ['wifi', 'parking', 'restaurant', 'pool', 'gym', 'spa', 'coffee', 'security', '24h', 'airport'];

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState('about');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [deleteContent, setDeleteContent] = useState(null);
  const [formData, setFormData] = useState(defaultContent);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: content = [], isLoading } = useQuery({
    queryKey: ['hotelContent'],
    queryFn: () => base44.entities.HotelContent.list('order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HotelContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelContent'] });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HotelContent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelContent'] });
      handleCloseModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HotelContent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotelContent'] });
      setDeleteContent(null);
    },
  });

  const handleOpenModal = (item = null, section = null) => {
    if (item) {
      setEditingContent(item);
      setFormData(item);
    } else {
      setEditingContent(null);
      setFormData({ ...defaultContent, section: section || activeTab });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContent(null);
    setFormData(defaultContent);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getContentBySection = (section) => content.filter(c => c.section === section);

  const sectionConfig = {
    about: { icon: FileText, label: 'About（紹介）', fields: ['title', 'content'] },
    facility: { icon: Sparkles, label: '施設', fields: ['title', 'content', 'icon'] },
    gallery: { icon: Image, label: 'ギャラリー', fields: ['title', 'image_url'] },
    testimonial: { icon: MessageSquare, label: '口コミ', fields: ['author', 'content', 'rating'] },
  };

  return (
    <ProtectedRoute>
      <AdminLayout title="Content Management">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-slate-100">
            {Object.entries(sectionConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <config.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <Button 
            onClick={() => handleOpenModal(null, activeTab)} 
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {sectionConfig[activeTab]?.label}
          </Button>
        </div>

        {Object.keys(sectionConfig).map((section) => (
          <TabsContent key={section} value={section}>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              </div>
            ) : getContentBySection(section).length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl">
                {React.createElement(sectionConfig[section].icon, {
                  className: "w-12 h-12 mx-auto text-slate-300 mb-4"
                })}
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No {sectionConfig[section].label.toLowerCase()} yet
                </h3>
                <Button 
                  onClick={() => handleOpenModal(null, section)} 
                  className="bg-amber-600 hover:bg-amber-700 mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First {sectionConfig[section].label}
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {getContentBySection(section).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`overflow-hidden ${!item.is_active ? 'opacity-60' : ''}`}>
                      {item.image_url && (
                        <div className="h-40 bg-slate-100">
                          <img 
                            src={item.image_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {item.title && (
                              <h3 className="font-semibold text-slate-900">{item.title}</h3>
                            )}
                            {item.author && (
                              <h3 className="font-semibold text-slate-900">{item.author}</h3>
                            )}
                            {item.rating && (
                              <div className="flex gap-0.5 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          {!item.is_active && (
                            <Badge variant="secondary">非公開</Badge>
                          )}
                        </div>
                        
                        {item.content && (
                          <div 
                            className="text-sm text-slate-600 line-clamp-3 mb-3 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                          />
                        )}

                        {item.icon && (
                          <Badge variant="outline" className="mb-3">
                            Icon: {item.icon}
                          </Badge>
                        )}

                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleOpenModal(item)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            編集
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteContent(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContent ? 'コンテンツを編集' : 'コンテンツを追加'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">セクション</label>
              <Select 
                value={formData.section} 
                onValueChange={(val) => handleChange('section', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sectionConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.section === 'about' || formData.section === 'facility' || formData.section === 'gallery') && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">タイトル</label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>
            )}

            {formData.section === 'testimonial' && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">投稿者名</label>
                <Input
                  value={formData.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                />
              </div>
            )}

            {(formData.section === 'about' || formData.section === 'facility' || formData.section === 'testimonial') && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">本文</label>
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(val) => handleChange('content', val)}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      [{ font: [] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ color: [] }, { background: [] }],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      [{ align: [] }],
                      ['link'],
                      ['clean'],
                    ]
                  }}
                  className="bg-white"
                  style={{ minHeight: '200px' }}
                />
              </div>
            )}

            {formData.section === 'facility' && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">アイコン</label>
                <Select 
                  value={formData.icon} 
                  onValueChange={(val) => handleChange('icon', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="アイコンを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.section === 'testimonial' && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">評価</label>
                <Select 
                  value={String(formData.rating)} 
                  onValueChange={(val) => handleChange('rating', parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <SelectItem key={r} value={String(r)}>{r} 星</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.section === 'gallery' || formData.section === 'about') && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">画像</label>
                {formData.image_url ? (
                  <div className="relative">
                    <img 
                      src={formData.image_url} 
                      alt="" 
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('image_url', '')}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-amber-400">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">クリックしてアップロード</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">表示順</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => handleChange('order', parseInt(e.target.value))}
                min={0}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">公開する</label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(val) => handleChange('is_active', val)}
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
                {editingContent ? '更新する' : '作成する'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteContent} onOpenChange={() => setDeleteContent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>コンテンツを削除</AlertDialogTitle>
            <AlertDialogDescription>
              このコンテンツを削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteContent.id)}
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