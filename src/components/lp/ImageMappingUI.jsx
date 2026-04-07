import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertCircle,
  Upload,
  Check,
  X,
  ChevronDown,
  Eye,
  Loader2,
  Zap,
} from 'lucide-react';
import { extractImageUrlsFromHtml, getDiffUrls } from '@/lib/imageExtractor';

const ImageMappingUI = ({ lpId, htmlCode, uploadedAssets, onMappingChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [extractedUrls, setExtractedUrls] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, mapped, unmapped
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [previewImages, setPreviewImages] = useState({});
  const [isAutoExtracting, setIsAutoExtracting] = useState(false);

  // マッピングデータ取得
  const { data: mappings = [] } = useQuery({
    queryKey: ['imageMappings', lpId],
    queryFn: () =>
      lpId
        ? base44.entities.LandingPageImageMapping.filter({
            landing_page_id: lpId,
          }, 'sort_order')
        : Promise.resolve([]),
    enabled: !!lpId,
  });

  // マッピング更新ミューテーション
  const updateMappingMutation = useMutation({
    mutationFn: async ({ mappingId, data }) => {
      if (mappingId) {
        return base44.entities.LandingPageImageMapping.update(mappingId, data);
      } else {
        return base44.entities.LandingPageImageMapping.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imageMappings', lpId] });
      if (onMappingChange) {
        onMappingChange();
      }
    },
  });

  // マッピング削除ミューテーション
  const deleteMappingMutation = useMutation({
    mutationFn: (mappingId) =>
      base44.entities.LandingPageImageMapping.delete(mappingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imageMappings', lpId] });
      if (onMappingChange) {
        onMappingChange();
      }
    },
  });

  // HTMLから画像URL自動抽出・マッピング生成
  const autoExtractAndSync = async (html) => {
    if (!html || !lpId) return;

    try {
      setIsAutoExtracting(true);
      const urls = extractImageUrlsFromHtml(html);
      
      if (urls.length === 0) {
        setExtractedUrls([]);
        return;
      }

      setExtractedUrls(urls);
      await syncMappings(urls);
    } catch (error) {
      console.error('Auto extract error:', error);
    } finally {
      setIsAutoExtracting(false);
    }
  };

  // HTMLから画像URL抽出（手動ボタン）
  const handleExtractImages = () => {
    if (!htmlCode) {
      toast({
        title: 'エラー',
        description: 'HTMLコードを入力してください',
        variant: 'destructive',
      });
      return;
    }

    const urls = extractImageUrlsFromHtml(htmlCode);

    if (urls.length === 0) {
      toast({
        title: '画像なし',
        description: 'HTMLに画像タグが見つかりません',
      });
      return;
    }

    setExtractedUrls(urls);
    toast({
      title: '抽出完了',
      description: `${urls.length}個の画像URLを抽出しました`,
    });

    // 既存マッピングとマージ
    syncMappings(urls);
  };

  // マッピングをDBと同期（差分のみ追加）
  const syncMappings = async (urls) => {
    if (!lpId) return;

    const existingUrls = mappings.map((m) => m.original_url);
    const newUrls = getDiffUrls(urls, existingUrls);

    if (newUrls.length === 0) return;

    // 新規URL をバッチで追加
    for (let i = 0; i < newUrls.length; i++) {
      const url = newUrls[i];
      await updateMappingMutation.mutateAsync({
        mappingId: null,
        data: {
          landing_page_id: lpId,
          original_url: url,
          status: 'unmapped',
          sort_order: mappings.length + i,
        },
      });
    }
  };

  // 表示用データ
  const filteredMappings = mappings.filter((m) => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (searchQuery && !m.original_url.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const unmappedCount = mappings.filter((m) => m.status === 'unmapped').length;
  const mappedCount = mappings.filter((m) => m.status === 'mapped').length;

  // 差し替え設定
  const handleSetMapping = async (mappingId, uploadedAsset) => {
    await updateMappingMutation.mutateAsync({
      mappingId,
      data: {
        uploaded_asset_id: uploadedAsset.id,
        uploaded_url: uploadedAsset.file_url,
        uploaded_filename: uploadedAsset.file_name,
        status: 'mapped',
      },
    });

    toast({
      title: '設定完了',
      description: `画像マッピングを設定しました`,
    });
  };

  // 差し替え解除
  const handleRemoveMapping = async (mappingId) => {
    await updateMappingMutation.mutateAsync({
      mappingId,
      data: {
        uploaded_asset_id: null,
        uploaded_url: null,
        uploaded_filename: null,
        status: 'unmapped',
      },
    });

    toast({
      title: '解除完了',
      description: '画像マッピングを解除しました',
    });
  };

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // 元画像プレビュー試行
  const tryLoadImage = (url, mappingId) => {
    const img = new Image();
    img.onload = () => {
      setPreviewImages((prev) => ({
        ...prev,
        [mappingId]: { url, loaded: true },
      }));
    };
    img.onerror = () => {
      setPreviewImages((prev) => ({
        ...prev,
        [mappingId]: { url, loaded: false },
      }));
    };
    img.src = url;
  };

  // HTML変更時に自動抽出・同期（デバウンス付き）
  useEffect(() => {
    if (!lpId || !htmlCode) return;

    const timer = setTimeout(() => {
      autoExtractAndSync(htmlCode);
    }, 1000);

    return () => clearTimeout(timer);
  }, [htmlCode, lpId]);

  // 元画像プレビュー試行
  useEffect(() => {
    mappings.forEach((m) => {
      if (!previewImages[m.id]) {
        tryLoadImage(m.original_url, m.id);
      }
    });
  }, [mappings]);

  if (!lpId) {
    return (
      <Card className="p-6 bg-slate-50 border-slate-200">
        <p className="text-sm text-slate-500">
          LPを保存してから画像マッピングを設定できます
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-slate-200">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">画像マッピング</h3>
            <p className="text-sm text-slate-500 mt-1">
              HTML内の画像URLを、アップロード済み画像に差し替えます
              {isAutoExtracting && (
                <span className="block text-xs text-blue-600 mt-1">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  HTMLを解析中...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {mappedCount > 0 && (
              <Badge className="bg-green-100 text-green-800">
                設定済み: {mappedCount}
              </Badge>
            )}
            {unmappedCount > 0 && (
              <Badge className="bg-amber-100 text-amber-800">
                未設定: {unmappedCount}
              </Badge>
            )}
          </div>
        </div>

        {/* アクション */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExtractImages}
            disabled={updateMappingMutation.isPending || isAutoExtracting}
          >
            {isAutoExtracting && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            {isAutoExtracting ? '抽出中...' : 'HTMLから画像URLを抽出'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterStatus('all')}
            className={filterStatus === 'all' ? 'bg-slate-100' : ''}
          >
            すべて ({mappings.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterStatus('mapped')}
            className={filterStatus === 'mapped' ? 'bg-green-100' : ''}
          >
            設定済み ({mappedCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterStatus('unmapped')}
            className={filterStatus === 'unmapped' ? 'bg-amber-100' : ''}
          >
            未設定 ({unmappedCount})
          </Button>
        </div>

        {/* 検索 */}
        <Input
          type="text"
          placeholder="URL検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />

        {/* マッピング一覧 */}
        {filteredMappings.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {mappings.length === 0
                ? '「HTMLから画像URLを抽出」で開始します'
                : 'マッピングが見つかりません'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMappings.map((mapping, idx) => (
              <div
                key={mapping.id}
                className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:shadow-sm transition"
              >
                {/* ヘッダー行 */}
                <div className="flex items-center gap-3 p-4">
                  <span className="text-xs font-medium text-slate-500 w-6">
                    #{idx + 1}
                  </span>

                  {/* 元URL */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 truncate font-mono">
                      {mapping.original_url}
                    </p>
                  </div>

                  {/* 状態バッジ */}
                  {mapping.status === 'mapped' ? (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      設定済み
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-700 text-xs">
                      未設定
                    </Badge>
                  )}

                  {/* 展開ボタン */}
                  <button
                    onClick={() => toggleRow(mapping.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition ${
                        expandedRows.has(mapping.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* 詳細行 */}
                {expandedRows.has(mapping.id) && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                    {/* 元画像プレビュー */}
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">
                        元画像
                      </p>
                      <div className="w-full bg-white rounded border border-slate-200 p-3 text-center">
                        {previewImages[mapping.id]?.loaded ? (
                          <img
                            src={mapping.original_url}
                            alt="元画像"
                            className="max-w-full max-h-48 mx-auto rounded"
                          />
                        ) : (
                          <div className="py-8 text-slate-400 text-xs">
                            <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            プレビュー不可
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 差し替え設定 */}
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">
                        差し替え先
                      </p>
                      {mapping.status === 'mapped' ? (
                        <div className="space-y-3">
                          <div className="bg-white rounded border border-green-200 p-3">
                            {mapping.uploaded_url && (
                              <div className="text-center">
                                <img
                                  src={mapping.uploaded_url}
                                  alt={mapping.uploaded_filename}
                                  className="max-w-full max-h-48 mx-auto rounded mb-2"
                                />
                                <p className="text-xs text-slate-600 truncate">
                                  {mapping.uploaded_filename}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMapping(mapping.id)}
                            disabled={updateMappingMutation.isPending}
                            className="w-full text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            差し替えを解除
                          </Button>
                        </div>
                      ) : (
                        <Select
                          onValueChange={(assetId) => {
                            const asset = uploadedAssets.find(
                              (a) => a.id === assetId
                            );
                            if (asset) {
                              handleSetMapping(mapping.id, asset);
                            }
                          }}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="アップロード済み画像から選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {uploadedAssets.length === 0 ? (
                              <div className="p-2 text-xs text-slate-500">
                                アップロード済み画像がありません
                              </div>
                            ) : (
                              uploadedAssets.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id}>
                                  <div className="text-xs">
                                    {asset.file_name}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 情報メッセージ */}
        {mappings.length > 0 && unmappedCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {unmappedCount}個の画像がまだ差し替えられていません。すべて設定することをお勧めします。
          </div>
        )}
      </div>
    </Card>
  );
};

export default ImageMappingUI;