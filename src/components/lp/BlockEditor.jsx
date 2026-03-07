import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, Image } from 'lucide-react';

// ブロックごとのフィールド定義
const BLOCK_FIELDS = {
  Hero: [
    { key: 'eyebrow', label: 'アイキャッチテキスト', type: 'text', placeholder: '例: 期間限定キャンペーン' },
    { key: 'headline', label: 'メインキャッチコピー', type: 'text', placeholder: '例: 頭皮から変わる、あなたの美しさ' },
    { key: 'subheadline', label: 'サブヘッドライン', type: 'textarea', placeholder: '補足テキスト' },
    { key: 'cta_text', label: 'CTAボタンテキスト', type: 'text', placeholder: '例: 今すぐ予約する' },
    { key: 'cta_url', label: 'CTAボタンURL', type: 'text', placeholder: 'https://...' },
    { key: 'image_url', label: '背景画像', type: 'image' },
  ],
  Problem: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: こんなお悩みありませんか？' },
    { key: 'items', label: 'お悩みリスト（1行1件）', type: 'textarea', placeholder: '頭皮がかゆい\n髪が細くなってきた\n抜け毛が増えた' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
  Solution: [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: '例: Shinが選ばれる理由' },
    { key: 'body', label: '本文（HTML可）', type: 'html', placeholder: '<p>解決策の説明...</p>' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
  Feature: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: サービスの特徴' },
    { key: 'features', label: '特徴リスト（1行1件）', type: 'textarea', placeholder: '完全個室プライベート空間\nオーダーメイド施術\n頭浸浴（とうしんよく）' },
    { key: 'body', label: '詳細説明（HTML可）', type: 'html' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
  Evidence: [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: '例: 実績・メディア掲載' },
    { key: 'body', label: '実績内容（HTML可）', type: 'html' },
    { key: 'stats', label: '数字実績（1行: ラベル|数値）', type: 'textarea', placeholder: '満足度|98%\n施術数|1000+\n継続率|92%' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
  Voice: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: お客様の声' },
    { key: 'voices', label: '声リスト（1件ずつ: 名前|内容）', type: 'textarea', placeholder: '山田様 30代|施術後、頭がスッキリしました\n鈴木様 40代|リラックスできて最高です' },
  ],
  Flow: [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: '例: 施術の流れ' },
    { key: 'steps', label: 'ステップ（1行1件）', type: 'textarea', placeholder: 'ご予約\nカウンセリング\n頭皮診断\n施術\nアフターケア' },
  ],
  Comparison: [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: '例: 他店との違い' },
    { key: 'our_points', label: '当店の強み（1行1件）', type: 'textarea', placeholder: '完全個室\nオーダーメイド\n頭浸浴あり' },
    { key: 'other_points', label: '他店（1行1件）', type: 'textarea', placeholder: '半個室\n固定メニュー\n頭浸浴なし' },
  ],
  FAQ: [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: 'よくある質問' },
    { key: 'faqs', label: 'Q&A（1行: Q|A）', type: 'textarea', placeholder: '初めてでも大丈夫ですか？|はい、丁寧にご説明します\n予約方法は？|電話またはLINEにて' },
  ],
  Future: [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: '例: これからのビジョン' },
    { key: 'body', label: '本文（HTML可）', type: 'html' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
  CTA: [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: '例: まずはお気軽にご相談ください' },
    { key: 'body', label: '補足テキスト', type: 'textarea' },
    { key: 'cta_text', label: 'ボタンテキスト', type: 'text', placeholder: '今すぐ予約する' },
    { key: 'cta_url', label: 'ボタンURL', type: 'text', placeholder: 'https://...' },
    { key: 'background_color', label: '背景色（hex）', type: 'text', placeholder: '#1a1a2e' },
  ],
};

export default function BlockEditor({ block, onSave, onCancel }) {
  const [data, setData] = useState(block.data || {});
  const [uploading, setUploading] = useState(false);

  const fields = BLOCK_FIELDS[block.block_type] || [];

  const handleUpload = async (key, file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setData(d => ({ ...d, [key]: file_url }));
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800 text-lg">{block.block_type} ブロックを編集</h3>
      {fields.map(field => (
        <div key={field.key}>
          <Label className="mb-1 block">{field.label}</Label>
          {field.type === 'text' && (
            <Input value={data[field.key] || ''} onChange={e => setData(d => ({ ...d, [field.key]: e.target.value }))} placeholder={field.placeholder} />
          )}
          {(field.type === 'textarea' || field.type === 'html') && (
            <Textarea value={data[field.key] || ''} onChange={e => setData(d => ({ ...d, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={5} className="font-mono text-sm" />
          )}
          {field.type === 'image' && (
            <div className="space-y-2">
              {data[field.key] && <img src={data[field.key]} alt="" className="h-32 object-cover rounded border" />}
              <label className="flex items-center gap-2 cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Image className="w-4 h-4 mr-1" />}
                    画像をアップロード
                  </span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(field.key, e.target.files[0])} />
              </label>
              <Input value={data[field.key] || ''} onChange={e => setData(d => ({ ...d, [field.key]: e.target.value }))} placeholder="または画像URLを直接入力" className="text-sm" />
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => onSave(data)}>保存</Button>
        <Button variant="outline" onClick={onCancel}>キャンセル</Button>
      </div>
    </div>
  );
}