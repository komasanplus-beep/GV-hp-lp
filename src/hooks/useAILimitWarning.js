/**
 * useAILimitWarning.js
 * AI利用上限の警告状態を管理するカスタムフック
 * 
 * 使用方法:
 * const { remaining, limit, showWarning, showLimitModal, limitData } = useAILimitWarning('feature_code');
 */
import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useAILimitWarning(featureCode) {
  const [remaining, setRemaining] = useState(null);
  const [limit, setLimit] = useState(null);
  const [showWarning, setShowWarning] = useState(false); // ソフト警告
  const [showLimitModal, setShowLimitModal] = useState(false); // ハード停止モーダル
  const [limitData, setLimitData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // AI利用前に上限をチェック
  const checkLimit = useCallback(async (siteId) => {
    if (!featureCode) return null;

    setIsLoading(true);
    try {
      const res = await base44.functions.invoke('aiGuard', {
        feature_code: featureCode,
        site_id: siteId,
      });

      const data = res.data;

      if (data?.allowed === false && data?.source === 'limit_exceeded') {
        // ハード停止：上限到達
        setLimitData({
          used: data.used,
          limit: data.limit,
          remaining: data.remaining || 0,
          plan_code: data.plan_code,
        });
        setShowLimitModal(true);
        return false;
      }

      if (data?.allowed === true) {
        // 成功：警告チェック
        const rem = data.remaining;
        setRemaining(rem);
        setLimit(data.limit);

        if (rem !== null && rem > 0 && rem <= 3) {
          // ソフト警告：残り少ない
          setShowWarning(true);
          toast(
            <div className="flex items-center gap-2">
              <span className="text-sm">残りあと<strong>{rem}回</strong>です</span>
            </div>,
            {
              action: {
                label: 'プラン確認',
                onClick: () => setShowLimitModal(true),
              },
            }
          );
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error('useAILimitWarning error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [featureCode]);

  return {
    remaining,
    limit,
    showWarning,
    setShowWarning,
    showLimitModal,
    setShowLimitModal,
    limitData,
    isLoading,
    checkLimit,
  };
}