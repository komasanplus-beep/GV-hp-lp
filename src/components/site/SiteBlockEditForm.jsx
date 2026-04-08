import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Loader2, ImageIcon, GripVertical } from 'lucide-react';
import SiteBlockAnimationForm from './SiteBlockAnimationForm';
import HeroEditForm from './HeroEditForm';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const SITE_BLOCK_FIELDS = {
  Hero: [],
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
    { key: 'subtitle', label: 'サブタイトル', type: 'text', placeholder: '当店で提供するサービスをご紹介します' },
    { key: 'layout_type', label: 'レイアウト', type: 'text', placeholder: 'grid' },
    { key: 'show_price', label: '価格表示', type: 'checkbox' },
    { key: 'show_duration', label: '所要時間表示', type: 'checkbox' },
  ],
  Staff: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: スタッフ紹介' },
    { key: 'items', label: 'スタッフ（1行: 名前|役職|一言）', type: 'textarea', placeholder: '山田 花子|ディレクター|お客様の魅力を引き出します\n鈴木 太郎|スタイリスト|丁寧な施術が得意です' },
  ],
  Gallery: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: ギャラリー' },
    { key: 'image_urls', label: '画像URL（1行: 1URL）', type: 'image_list' },
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
  Booking: [
    { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: ご予約' },
    { key: 'body', label: '説明文', type: 'textarea', placeholder: 'ご希望の日時をお選びください' },
    { key: 'button_text', label: 'ボタンテキスト', type: 'text', placeholder: 'ご予約する' },
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

// データソース参照可能なブロック
const CONTENT_REFERABLE_BLOCKS = ['Service', 'Contact', 'Feature', 'CTA', 'Hero'];

export default function SiteBlockEditForm({ block, onSave, onCancel }) {
  const [data, setData] = useState(block.data || {});
  const [uploading, setUploading] = useState({});
  const [sourceMode, setSourceMode] = useState(block.source_mode || 'manual');
  const [contentSourceType, setContentSourceType] = useState(block.content_source_type || null);
  const [contentSourceIds, setContentSourceIds] = useState(block.content_source_ids || []);
  const [animationSettings, setAnimationSettings] = useState({
    animation_type: block.animation_type || 'fade-up',
    animation_trigger: block.animation_trigger || 'on-scroll',
    animation_delay: block.animation_delay || 0,
    animation_duration: block.animation_duration || 600,
    animation_once: block.animation_once !== false,
  });

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

  const canUseContentReference = CONTENT_REFERABLE_BLOCKS.includes(block.block_type);

  return (
    <div className="space-y-4">
      <div className="border-b pb-3 mb-4">
        <h3 className="font-semibold text-slate-800 text-lg">{block.block_type} ブロックを編集</h3>
        <p className="text-xs text-slate-400 mt-0.5">各フィールドを入力してください</p>
        {block.block_type === 'Service' && (
          <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
            💡 サービス内容・価格・説明は「サービス管理」で編集してください。ここは見出しと表示設定のみです。
          </p>
        )}
      </div>

      {/* データソース選択（参照可能なブロック） */}
      {canUseContentReference && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
          <Label className="text-sm font-semibold text-blue-900">データソース</Label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={sourceMode === 'manual'}
                onChange={() => {
                  setSourceMode('manual');
                  setContentSourceType(null);
                  setContentSourceIds([]);
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-blue-800">手入力</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={sourceMode === 'content'}
                onChange={() => setSourceMode('content')}
                className="w-4 h-4"
              />
              <span className="text-sm text-blue-800">コンテンツ選択</span>
            </label>
          </div>

          {sourceMode === 'content' && (
            <div className="mt-3 pt-3 border-t border-blue-200 space-y-2">
              <Select value={contentSourceType || ''} onValueChange={setContentSourceType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="コンテンツ種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">サービス管理</SelectItem>
                  <SelectItem value="article">記事管理</SelectItem>
                  <SelectItem value="shared_content">共通コンテンツ</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-blue-700">
                選択したコンテンツ種別から、このブロックに表示する項目を選びます。
              </p>
            </div>
          )}
        </div>
      )}

      {block.block_type === 'Hero' && (
        <HeroEditForm
          data={data}
          onDataChange={setData}
          uploading={uploading}
          onUpload={handleUpload}
        />
      )}

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
          {field.type === 'checkbox' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data[field.key] ?? false}
                onChange={e => setData(d => ({ ...d, [field.key]: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label className="text-sm text-slate-600">{field.label}</label>
            </div>
          )}
          {field.type === 'image_list' && (
            <div className="space-y-3">
              {Array.isArray(data[field.key]) && data[field.key].length > 0 && (
                <DragDropContext
                  onDragEnd={(result) => {
                    const { source, destination } = result;
                    if (!destination) return;
                    if (source.index === destination.index) return;

                    const items = Array.from(data[field.key]);
                    const [movedItem] = items.splice(source.index, 1);
                    items.splice(destination.index, 0, movedItem);
                    setData(d => ({ ...d, [field.key]: items }));
                  }}
                >
                  <Droppable droppableId="gallery-images" direction="horizontal">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-50"
                      >
                        {data[field.key].map((url, i) => (
                          <Draggable key={`image-${i}`} draggableId={`image-${i}`} index={i}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative group rounded-lg overflow-hidden cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-lg ring-2 ring-amber-400' : ''}`}
                              >
                                <img src={url} alt="" className="w-full h-20 object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-between px-2">
                                  <div {...provided.dragHandleProps} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-4 h-4 text-white" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setData(d => ({ ...d, [field.key]: d[field.key].filter((_, idx) => idx !== i) }))}
                                    className="bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="absolute bottom-1 left-1 bg-slate-800/70 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  #{i + 1}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
              <label className="cursor-pointer block">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    {uploading[field.key]
                      ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      : <ImageIcon className="w-4 h-4 mr-1" />}
                      画像を追加
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files[0]) {
                        const key = field.key;
                        setUploading(u => ({ ...u, [key]: true }));
                        base44.integrations.Core.UploadFile({ file: e.target.files[0] }).then(({ file_url }) => {
                          setData(d => ({
                            ...d,
                            [key]: Array.isArray(d[key]) ? [...d[key], file_url] : [file_url]
                          }));
                          setUploading(u => ({ ...u, [key]: false }));
                        });
                      }
                    }}
                  />
                </label>
            </div>
          )}
        </div>
      ))}

      <SiteBlockAnimationForm data={animationSettings} onChange={setAnimationSettings} />

      <div className="flex gap-2 pt-3 border-t">
        <Button
          className="bg-amber-600 hover:bg-amber-700"
          onClick={() => onSave({
            ...data,
            ...animationSettings,
            source_mode: sourceMode,
            content_source_type: contentSourceType,
            content_source_ids: contentSourceIds,
          })}
        >
          保存
        </Button>
        <Button variant="outline" onClick={onCancel}>キャンセル</Button>
      </div>
    </div>
  );
}