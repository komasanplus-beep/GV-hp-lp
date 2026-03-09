import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, ImageIcon } from 'lucide-react';

const SITE_BLOCK_FIELDS = {
  Hero: [
    { key: 'headline', label: 'メインキャッチコピー', type: 'text', placeholder: '例: あなたの美しさを引き出す' },
    { key: 'subheadline', label: 'サブテキスト', type: 'textarea', placeholder: '例: 渋谷のヘアサロン' },
    { key: 'cta_text', label: 'ボタンテキスト', type: 'text', placeholder: '例: 予約する' },
    { key: 'cta_url', label: 'ボタンURL', type: 'text', placeholder: 'https://...' },
    { key: 'image_url', label: '背景画像', type: 'image' },
  ],
  About: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: 私たちについて' },
    { key: 'body', label: '本文', type: 'textarea', placeholder: 'サロンの紹介文...' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
  Menu: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: メニュー' },
    { key: 'items', label: 'メニュー（1行: メニュー名|価格|説明）', type: 'textarea', placeholder: 'カット|5,500円|丁寧なカウンセリング\nカラー|8,800円〜|豊富なカラーバリエーション' },
    { key: 'note', label: '備考', type: 'text', placeholder: '例: 税込み価格' },
  ],
  Service: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: サービス' },
    { key: 'items', label: 'サービス（1行: タイトル|説明）', type: 'textarea', placeholder: '完全個室|プライベートな空間でご提供\nオーダーメイド|お客様に合わせた施術' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
  Staff: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: スタッフ紹介' },
    { key: 'items', label: 'スタッフ（1行: 名前|役職|一言）', type: 'textarea', placeholder: '山田 花子|ディレクター|お客様の魅力を引き出します\n鈴木 太郎|スタイリスト|丁寧な施術が得意です' },
  ],
  Gallery: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: ギャラリー' },
    { key: 'image_url_1', label: '画像1', type: 'image' },
    { key: 'image_url_2', label: '画像2', type: 'image' },
    { key: 'image_url_3', label: '画像3', type: 'image' },
    { key: 'image_url_4', label: '画像4', type: 'image' },
  ],
  Voice: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: お客様の声' },
    { key: 'items', label: '口コミ（1行: お名前|内容）', type: 'textarea', placeholder: 'A様 30代|とても丁寧で大満足です\nB様 40代|また来たいと思いました' },
  ],
  Feature: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: 当店の特徴' },
    { key: 'items', label: '特徴（1行: タイトル|説明）', type: 'textarea', placeholder: '完全個室|落ち着いた空間で施術\n豊富な経験|10年以上のキャリア' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
  FAQ: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: 'よくある質問' },
    { key: 'items', label: 'Q&A（1行: Q|A）', type: 'textarea', placeholder: '予約は必要ですか？|はい、事前予約をお願いしています\n駐車場はありますか？|近隣にコインパーキングがあります' },
  ],
  Access: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: 'アクセス' },
    { key: 'address', label: '住所', type: 'text', placeholder: '東京都渋谷区...' },
    { key: 'access_info', label: 'アクセス情報', type: 'textarea', placeholder: '渋谷駅から徒歩5分...' },
    { key: 'hours', label: '営業時間', type: 'text', placeholder: '10:00〜20:00（火曜定休）' },
    { key: 'phone', label: '電話番号', type: 'text', placeholder: '03-xxxx-xxxx' },
    { key: 'map_embed_url', label: 'Googleマップ埋め込みURL', type: 'text', placeholder: 'https://www.google.com/maps/embed?...' },
  ],
  Contact: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: 'お問い合わせ' },
    { key: 'body', label: '説明文', type: 'textarea', placeholder: 'お気軽にお問い合わせください' },
    { key: 'email', label: 'メールアドレス', type: 'text', placeholder: 'info@example.com' },
    { key: 'phone', label: '電話番号', type: 'text', placeholder: '03-xxxx-xxxx' },
    { key: 'line_url', label: 'LINE URL', type: 'text', placeholder: 'https://line.me/...' },
    { key: 'booking_url', label: '予約URL', type: 'text', placeholder: 'https://...' },
  ],
  CTA: [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: '例: まずはお気軽にご相談ください' },
    { key: 'body', label: '補足テキスト', type: 'textarea', placeholder: '' },
    { key: 'cta_text', label: 'ボタンテキスト', type: 'text', placeholder: '今すぐ予約する' },
    { key: 'cta_url', label: 'ボタンURL', type: 'text', placeholder: 'https://...' },
  ],
  Campaign: [
    { key: 'title', label: 'キャンペーン名', type: 'text', placeholder: '例: 初回限定20%OFF' },
    { key: 'body', label: '詳細', type: 'textarea', placeholder: '詳細内容...' },
    { key: 'expiry', label: '有効期限', type: 'text', placeholder: '例: 2026年3月31日まで' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
  Custom: [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: '' },
    { key: 'body', label: '本文（HTML可）', type: 'textarea', placeholder: '<p>カスタムコンテンツ...</p>' },
    { key: 'image_url', label: '画像', type: 'image' },
  ],
};

export default function SiteBlockEditForm({ block, onSave, onCancel }) {
  const [data, setData] = useState(block.data || {});
  const [uploading, setUploading] = useState({});

  const fields = SITE_BLOCK_FIELDS[block.block_type] || [
    { key: 'title', label: 'タイトル', type: 'text', placeholder: '' },
    { key: 'body', label: '本文', type: 'textarea', placeholder: '' },
  ];

  const handleUpload = async (key, file) => {
    setUploading(u => ({ ...u, [key]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setData(d => ({ ...d, [key]: file_url }));
    setUploading(u => ({ ...u, [key]: false }));
  };

  return (
    <div className="space-y-4">
      <div className="border-b pb-3 mb-4">
        <h3 className="font-semibold text-slate-800 text-lg">{block.block_type} ブロックを編集</h3>
        <p className="text-xs text-slate-400 mt-0.5">各フィールドを入力してください</p>
      </div>

      {fields.map(field => (
        <div key={field.key}>
          <Label className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}</Label>
          {field.type === 'text' && (
            <Input
              value={data[field.key] || ''}
              onChange={e => setData(d => ({ ...d, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
            />
          )}
          {field.type === 'textarea' && (
            <Textarea
              value={data[field.key] || ''}
              onChange={e => setData(d => ({ ...d, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              rows={4}
              className="text-sm"
            />
          )}
          {field.type === 'image' && (
            <div className="space-y-2">
              {data[field.key] && (
                <img src={data[field.key]} alt="" className="h-28 w-full object-cover rounded-lg border" />
              )}
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      {uploading[field.key]
                        ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        : <ImageIcon className="w-4 h-4 mr-1" />}
                      画像をアップロード
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files[0] && handleUpload(field.key, e.target.files[0])}
                  />
                </label>
              </div>
              <Input
                value={data[field.key] || ''}
                onChange={e => setData(d => ({ ...d, [field.key]: e.target.value }))}
                placeholder="またはURLを直接入力"
                className="text-xs"
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-3 border-t">
        <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => onSave(data)}>保存</Button>
        <Button variant="outline" onClick={onCancel}>キャンセル</Button>
      </div>
    </div>
  );
}