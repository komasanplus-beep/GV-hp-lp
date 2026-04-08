/**
 * PayAsYouGoIndicator
 * AI従量課金の表示コンポーネント
 * 無料枠・超過分・料金を明示
 */
import React from 'react';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PayAsYouGoIndicator({ 
  used = 0, 
  freeQuota = 0, 
  unitPrice = 0, 
  monthlyCap = null,
  monthlyReset = null 
}) {
  const overage = Math.max(0, used - freeQuota);
  const cost = overage * unitPrice;
  const cappedCost = monthlyCap !== null ? Math.min(cost, monthlyCap) : cost;

  if (freeQuota === 0 && unitPrice === 0) {
    return null; // Pay as you go未有効
  }

  const isFree = used <= freeQuota;
  const isCapped = monthlyCap !== null && cost >= monthlyCap;

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${
      isFree 
        ? 'bg-emerald-50 border-emerald-200' 
        : isCapped
        ? 'bg-orange-50 border-orange-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isFree ? (
            <Zap className="w-4 h-4 text-emerald-600" />
          ) : isCapped ? (
            <AlertCircle className="w-4 h-4 text-orange-600" />
          ) : (
            <TrendingUp className="w-4 h-4 text-amber-600" />
          )}
          <span className={`text-xs font-semibold ${
            isFree ? 'text-emerald-700' : isCapped ? 'text-orange-700' : 'text-amber-700'
          }`}>
            {isFree ? '無料枠内' : isCapped ? '月額上限に達成' : '従量課金中'}
          </span>
        </div>
        {!isFree && (
          <Badge variant="outline" className={`text-xs font-bold ${
            isCapped 
              ? 'text-orange-700 border-orange-300' 
              : 'text-amber-700 border-amber-300'
          }`}>
            ¥{Math.round(cappedCost).toLocaleString('ja-JP')}
          </Badge>
        )}
      </div>

      {/* 使用状況 */}
      <div className="space-y-1.5 text-xs">
        {/* 無料枠ゲージ */}
        <div>
          <div className="flex justify-between mb-1 text-slate-600">
            <span>無料枠</span>
            <span className="font-medium">{Math.min(used, freeQuota)} / {freeQuota}回</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                isFree ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min((used / freeQuota) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* 超過情報 */}
        {overage > 0 && (
          <div className="pt-1 border-t border-current/10">
            <div className="flex justify-between">
              <span>超過分</span>
              <span className="font-semibold">
                {overage}回 × ¥{unitPrice} = ¥{Math.round(cost).toLocaleString('ja-JP')}
              </span>
            </div>
            {monthlyCap !== null && cost > monthlyCap && (
              <p className="text-slate-500 mt-1">
                月額上限：¥{monthlyCap.toLocaleString('ja-JP')}（超過分は課金されません）
              </p>
            )}
          </div>
        )}
      </div>

      {/* リセット情報 */}
      {monthlyReset && (
        <p className="text-xs text-slate-500 pt-1 border-t border-current/10">
          次回リセット：{monthlyReset}
        </p>
      )}
    </div>
  );
}