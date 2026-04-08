import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Save, Upload, Loader2, Store, X } from 'lucide-react';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const defaultSettings = {
  logo_url: '',
};

export default function AdminSettings() {
  const [formData, setFormData] = useState(defaultSettings);
  const [isUploading, setIsUploading] = useState(false);
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

          {/* ロゴのみ */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" />ロゴ</CardTitle>
               <CardDescription>サイトに表示するロゴを設定してください</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
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
               <p className="text-xs text-slate-500">連絡先情報はサイト構築の「Contact」で設定してください</p>
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