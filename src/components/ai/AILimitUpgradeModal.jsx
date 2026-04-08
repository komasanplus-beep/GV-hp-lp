/**
 * AILimitUpgradeModal
 * AI利用上限到達時の課金誘導モーダル
 * 3段階：ソフト警告（トースト）→ ハード停止（モーダル）→ 課金誘導
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap, TrendingUp, Gift, ArrowRight, X, Loader2, Check,
  ChevronRight, DollarSign, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Props:
 * - open: boolean モーダル開閉
 * - onOpenChange: (open: boolean) => void
 * - limitData: { used, limit, plan_code, remaining } (aiGuard or checkFeatureLimit からの返り値)
 * - onConfirm: optional () => void クローズ時のコールバック
 */
export default function AILimitUpgradeModal({ open, onOpenChange, limitData, onConfirm }) {
  const [selectedOption, setSelectedOption] = useState(null); // 'upgrade' | 'addon_50' | 'addon_100' | null
  const [isProcessing, setIsProcessing] = useState(false);
  const [addonOptions] = useState([
    { id: 'addon_50', label: '50回追加', price: '¥500', value: 50 },
    { id: 'addon_100', label: '100回追加', price: '¥900', value: 100 },
  ]);

  // ────────────── ① ソフト警告トースト（残り少ない） ──────────────
  useEffect(() => {
    if (limitData && open && limitData.remaining > 0 && limitData.remaining <= 3) {
      toast(
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm">残りあと<strong>{limitData.remaining}回</strong>です</span>
        </div>,
        {
          action: {
            label: 'プラン確認',
            onClick: () => onOpenChange(true),
          },
        }
      );
    }
  }, [limitData, open, onOpenChange]);

  if (!limitData) return null;

  const { used, limit, plan_code, remaining } = limitData;
  const isFreePlan = plan_code === 'free';

  // Stripe遷移（本実装ではbackend function経由）
  const handleCheckout = async (optionId) => {
    setSelectedOption(optionId);
    setIsProcessing(true);
    try {
      // Backend function で Stripe Checkout URL を生成
      const res = await base44.functions.invoke('initializeAICheckout', {
        option_type: optionId === 'upgrade' ? 'plan_upgrade' : 'ai_addon',
        addon_type: optionId,
        current_plan: plan_code,
      });

      if (res.data?.checkout_url) {
        // Stripe Checkout へリダイレクト
        window.location.href = res.data.checkout_url;
      } else {
        toast.error('チェックアウト初期化に失敗しました');
      }
    } catch (err) {
      toast.error('エラー：' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    onConfirm?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ━━━━━ ② ハード停止：上限到達モーダル ━━━━━ */}
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">AI利用上限に達しました</DialogTitle>
              <DialogDescription className="mt-1">
                今月のAI利用回数を使い切りました
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ━━━ 現在の状態表示 ━━━ */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">現在のプラン</span>
              <Badge variant="outline" className="text-xs">
                {plan_code === 'free' ? '無料' : plan_code}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">AI利用回数</span>
                <span className="font-bold text-slate-800">{used} / {limit}回</span>
              </div>
              <div className="w-full bg-slate-300 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              すぐに追加またはアップグレードできます
            </p>
          </div>

          {/* ━━━ ③ 課金誘導：2つのオプション ━━━ */}
          <div className="space-y-2.5">
            {/* ┌─────────────────────────────────────┐
                │  A. プランアップグレード              │
                └─────────────────────────────────────┘ */}
            {isFreePlan && (
              <PricingOption
                icon={<TrendingUp className="w-4 h-4" />}
                title="プランをアップグレード"
                description="AI回数が大幅に増えます"
                badge="おすすめ"
                features={['AI利用が月20回に', 'すべての機能が使える', 'サポート優先']}
                buttonLabel="アップグレードする"
                isSelected={selectedOption === 'upgrade'}
                isProcessing={isProcessing && selectedOption === 'upgrade'}
                onClick={() => handleCheckout('upgrade')}
              />
            )}

            {/* ┌─────────────────────────────────────┐
                │  B. AI追加パック                    │
                └─────────────────────────────────────┘ */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">AI追加パック</p>
              {addonOptions.map((addon) => (
                <PricingOption
                  key={addon.id}
                  icon={<Gift className="w-4 h-4" />}
                  title={addon.label}
                  description={`${addon.value}回までAIが使えます`}
                  badge={addon.price}
                  isSelected={selectedOption === addon.id}
                  isProcessing={isProcessing && selectedOption === addon.id}
                  onClick={() => handleCheckout(addon.id)}
                  compact
                />
              ))}
            </div>
          </div>

          {/* ━━━ 補足テキスト ━━━ */}
          <p className="text-xs text-slate-400 text-center">
            決済は安全な Stripe で処理されます
          </p>
        </div>

        {/* ━━━ アクション ━━━ */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex-1 text-slate-600 hover:bg-slate-100"
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-1" />
            あとで
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PricingOption コンポーネント
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function PricingOption({
  icon,
  title,
  description,
  badge,
  features,
  buttonLabel = '購入する',
  isSelected,
  isProcessing,
  onClick,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isProcessing}
      className={`w-full text-left transition-all duration-200 rounded-lg border-2 p-3 ${
        isSelected
          ? 'border-violet-500 bg-violet-50'
          : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/30'
      } ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1">
          <div className="text-violet-600 mt-0.5">{icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <h3 className="font-semibold text-sm text-slate-800">{title}</h3>
              {badge && (
                <Badge
                  variant={badge === 'おすすめ' ? 'default' : 'outline'}
                  className={`text-xs shrink-0 ${
                    badge === 'おすすめ'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
                      : ''
                  }`}
                >
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        {/* チェックアイコン or ローディング */}
        <div className="mt-0.5 shrink-0">
          {isProcessing && isSelected ? (
            <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
          ) : isSelected ? (
            <Check className="w-4 h-4 text-violet-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-300" />
          )}
        </div>
      </div>

      {/* 機能リスト（compact でない場合） */}
      {features && !compact && (
        <ul className="space-y-1 mb-3 ml-6">
          {features.map((f, i) => (
            <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
              <div className="w-1 h-1 bg-violet-500 rounded-full" />
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* CTA ボタン */}
      <div className="flex items-center gap-2 text-violet-600 font-semibold text-xs">
        {isProcessing && isSelected ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>処理中...</span>
          </>
        ) : (
          <>
            <span>{buttonLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </>
        )}
      </div>
    </button>
  );
}