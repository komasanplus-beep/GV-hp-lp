import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BlockImageEdit({ block, onChange }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange({ image_url: res.file_url });
      toast.success('画像をアップロードしました');
    } catch (err) {
      toast.error('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {block.image_url && (
        <div className="border rounded-lg overflow-hidden">
          <img src={block.image_url} alt="preview" className="w-full h-32 object-cover" />
        </div>
      )}
      <div>
        <Label className="text-xs mb-1.5">画像URL / アップロード</Label>
        <div className="flex gap-2">
          <Input
            value={block.image_url || ''}
            onChange={(e) => onChange({ image_url: e.target.value })}
            placeholder="画像URL..."
            className="text-sm"
          />
          <label className="cursor-pointer">
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="relative"
              asChild
            >
              <span>
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1.5">altテキスト（SEO重要）</Label>
        <Input
          value={block.alt_text || ''}
          onChange={(e) => onChange({ alt_text: e.target.value })}
          placeholder="画像説明..."
          className="text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1.5">幅（%）</Label>
          <Input
            type="number"
            value={block.width || 100}
            onChange={(e) => onChange({ width: parseInt(e.target.value) })}
            min="10"
            max="100"
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs mb-1.5">配置</Label>
          <Select
            value={block.align || 'center'}
            onValueChange={(v) => onChange({ align: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">左</SelectItem>
              <SelectItem value="center">中央</SelectItem>
              <SelectItem value="right">右</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}