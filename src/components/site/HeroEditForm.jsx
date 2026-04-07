import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { Loader2, ImageIcon, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function HeroEditForm({ data, onDataChange, uploading, onUpload }) {
  const heroMode = data.hero_mode || 'single';
  const images = Array.isArray(data.image_urls) ? data.image_urls : [];
  const overlayType = data.overlay_type || 'none';

  return (
    <div className="space-y-6 border-b pb-6 mb-4">
      <div>
        <h4 className="font-semibold text-slate-800 mb-4">🎬 Hero ブロック詳細設定</h4>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本</TabsTrigger>
          <TabsTrigger value="image">画像</TabsTrigger>
          <TabsTrigger value="effect">効果</TabsTrigger>
          <TabsTrigger value="text">テキスト</TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label className="mb-2 block text-sm font-medium text-slate-700">モード</Label>
            <select
              value={heroMode}
              onChange={e => onDataChange({ ...data, hero_mode: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="single">単一画像</option>
              <option value="slider">スライダー</option>
            </select>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-slate-700">見出し</Label>
            <Input
              value={data.headline || ''}
              onChange={e => onDataChange({ ...data, headline: e.target.value })}
              placeholder="メインキャッチコピー"
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium text-slate-700">サブテキスト</Label>
            <Textarea
              value={data.subheadline || ''}
              onChange={e => onDataChange({ ...data, subheadline: e.target.value })}
              placeholder="説明文"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block text-sm font-medium text-slate-700">ボタンテキスト</Label>
              <Input
                value={data.cta_text || ''}
                onChange={e => onDataChange({ ...data, cta_text: e.target.value })}
                placeholder="予約する"
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium text-slate-700">ボタンURL</Label>
              <Input
                value={data.cta_url || ''}
                onChange={e => onDataChange({ ...data, cta_url: e.target.value })}
                placeholder="#booking"
              />
            </div>
          </div>
        </TabsContent>

        {/* Image Tab */}
        <TabsContent value="image" className="space-y-4">
          {heroMode === 'single' ? (
            <div>
              <Label className="mb-2 block text-sm font-medium text-slate-700">背景画像</Label>
              {data.image_url && (
                <img src={data.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2 border" />
              )}
              <label className="cursor-pointer block mb-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    {uploading.image_url
                      ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      : <ImageIcon className="w-4 h-4 mr-1" />}
                    アップロード
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files[0] && onUpload('image_url', e.target.files[0])}
                />
              </label>
              <Input
                value={data.image_url || ''}
                onChange={e => onDataChange({ ...data, image_url: e.target.value })}
                placeholder="またはURLを直接入力"
                className="text-xs"
              />
            </div>
          ) : (
            <div>
              <Label className="mb-2 block text-sm font-medium text-slate-700">スライダー画像</Label>
              {images.length > 0 && (
                <DragDropContext
                  onDragEnd={(result) => {
                    const { source, destination } = result;
                    if (!destination || source.index === destination.index) return;
                    const items = Array.from(images);
                    const [movedItem] = items.splice(source.index, 1);
                    items.splice(destination.index, 0, movedItem);
                    onDataChange({ ...data, image_urls: items });
                  }}
                >
                  <Droppable droppableId="hero-images" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-50 mb-3"
                      >
                        {images.map((url, i) => (
                          <Draggable key={`hero-${i}`} draggableId={`hero-${i}`} index={i}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative group rounded-lg overflow-hidden cursor-grab ${snapshot.isDragging ? 'shadow-lg ring-2 ring-amber-400' : ''}`}
                              >
                                <img src={url} alt="" className="w-full h-20 object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-between px-2">
                                  <div {...provided.dragHandleProps} className="opacity-0 group-hover:opacity-100">
                                    <GripVertical className="w-4 h-4 text-white" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onDataChange({
                                      ...data,
                                      image_urls: images.filter((_, idx) => idx !== i)
                                    })}
                                    className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                                  >
                                    ✕
                                  </button>
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
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    {uploading.image_urls
                      ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      : <Plus className="w-4 h-4 mr-1" />}
                    画像を追加
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files[0] && onUpload('image_urls', e.target.files[0])}
                />
              </label>

              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 text-xs">切替秒数（ms）</Label>
                    <Input
                      type="number"
                      value={data.slide_interval || 3000}
                      onChange={e => onDataChange({ ...data, slide_interval: parseInt(e.target.value) })}
                      min="500"
                      step="500"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 text-xs">切替方式</Label>
                    <select
                      value={data.transition_type || 'fade'}
                      onChange={e => onDataChange({ ...data, transition_type: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm"
                    >
                      <option value="fade">フェード</option>
                      <option value="slide">スライド</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.autoplay !== false}
                      onChange={e => onDataChange({ ...data, autoplay: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">自動再生</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.loop !== false}
                      onChange={e => onDataChange({ ...data, loop: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">ループ</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Effect Tab */}
        <TabsContent value="effect" className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="mb-1 text-xs">透明度</Label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={data.image_opacity ?? 1}
                onChange={e => onDataChange({ ...data, image_opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-1 text-xs">明るさ (%)</Label>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={data.image_brightness ?? 100}
                onChange={e => onDataChange({ ...data, image_brightness: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-1 text-xs">コントラスト (%)</Label>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={data.image_contrast ?? 100}
                onChange={e => onDataChange({ ...data, image_contrast: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-1 text-xs">ぼかし (px)</Label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={data.image_blur ?? 0}
                onChange={e => onDataChange({ ...data, image_blur: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-1 text-xs">拡大率</Label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={data.image_scale ?? 1}
                onChange={e => onDataChange({ ...data, image_scale: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-1 text-xs">画像位置</Label>
              <select
                value={data.image_position || 'center'}
                onChange={e => onDataChange({ ...data, image_position: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="left top">左上</option>
                <option value="center top">上</option>
                <option value="right top">右上</option>
                <option value="left center">左</option>
                <option value="center">中央</option>
                <option value="right center">右</option>
                <option value="left bottom">左下</option>
                <option value="center bottom">下</option>
                <option value="right bottom">右下</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="mb-2 block text-sm font-medium text-slate-700">オーバーレイ</Label>
            <select
              value={overlayType}
              onChange={e => onDataChange({ ...data, overlay_type: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3"
            >
              <option value="none">なし</option>
              <option value="color">単色</option>
              <option value="gradient">グラデーション</option>
              <option value="mesh">メッシュ</option>
            </select>

            {overlayType === 'color' && (
              <div className="space-y-2">
                <input
                  type="color"
                  value={data.overlay_color || '#000000'}
                  onChange={e => onDataChange({ ...data, overlay_color: e.target.value })}
                  className="w-full h-10 border rounded-lg cursor-pointer"
                />
                <div>
                  <Label className="mb-1 text-xs">透明度</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={data.overlay_opacity ?? 0.5}
                    onChange={e => onDataChange({ ...data, overlay_opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {overlayType === 'gradient' && (
              <div className="space-y-2">
                <div>
                  <Label className="mb-1 text-xs">開始色</Label>
                  <input
                    type="color"
                    value={data.gradient_from || '#000000'}
                    onChange={e => onDataChange({ ...data, gradient_from: e.target.value })}
                    className="w-full h-10 border rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <Label className="mb-1 text-xs">終了色</Label>
                  <input
                    type="color"
                    value={data.gradient_to || '#ffffff'}
                    onChange={e => onDataChange({ ...data, gradient_to: e.target.value })}
                    className="w-full h-10 border rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <Label className="mb-1 text-xs">方向</Label>
                  <select
                    value={data.gradient_direction || 'to-bottom'}
                    onChange={e => onDataChange({ ...data, gradient_direction: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="to-bottom">下</option>
                    <option value="to-right">右</option>
                    <option value="to-bottom-right">右下</option>
                    <option value="to-top">上</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Text Tab */}
        <TabsContent value="text" className="space-y-3">
          <div>
            <Label className="mb-1 text-xs">テキスト配置</Label>
            <select
              value={data.text_align || 'center'}
              onChange={e => onDataChange({ ...data, text_align: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="left">左</option>
              <option value="center">中央</option>
              <option value="right">右</option>
            </select>
          </div>

          <div>
            <Label className="mb-1 text-xs">テキスト色</Label>
            <input
              type="color"
              value={data.text_color || '#ffffff'}
              onChange={e => onDataChange({ ...data, text_color: e.target.value })}
              className="w-full h-10 border rounded-lg cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.text_shadow === true}
              onChange={e => onDataChange({ ...data, text_shadow: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">テキストシャドウ</span>
          </label>
        </TabsContent>
      </Tabs>
    </div>
  );
}