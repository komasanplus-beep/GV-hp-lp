import React from 'react';
import { cn } from '@/lib/utils';

/**
 * KPICard - コンパクト版
 * props:
 *   icon, label, primaryValue, primaryUnit,
 *   secondaryLabel, secondaryValue,
 *   limitValue, limitUnit, usageRate,
 *   color
 */
export default function KPICard({
  icon: Icon,
  label,
  primaryValue,
  primaryUnit,
  secondaryLabel,
  secondaryValue,
  limitValue,
  limitUnit,
  usageRate,
  color = 'bg-slate-50 border-slate-200 text-slate-700',
}) {
  const hasLimit = limitValue != null;
  const hasUsageRate = usageRate != null;
  const hasSecondary = secondaryLabel != null && secondaryValue != null;

  return (
    <div className={`border rounded-lg px-3 py-2.5 flex flex-col gap-1 ${color}`}>
      {/* ヘッダー行: ラベル + アイコン */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600 truncate">{label}</p>
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
      </div>

      {/* 主数値 */}
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-xl font-bold text-slate-900 leading-none">{primaryValue}</span>
        {hasLimit ? (
          <span className="text-xs text-slate-500">/ {limitValue}{limitUnit || ''}</span>
        ) : primaryUnit ? (
          <span className="text-xs text-slate-500">{primaryUnit}</span>
        ) : null}
      </div>

      {/* 補助行: usageRate または secondary */}
      {hasUsageRate && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 bg-slate-200 rounded-full h-1">
            <div
              className="h-1 rounded-full bg-current opacity-60"
              style={{ width: `${Math.min(usageRate, 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0">{usageRate}%</span>
        </div>
      )}
      {!hasUsageRate && hasSecondary && (
        <p className="text-xs text-slate-500 truncate">
          {secondaryLabel}: <span className="font-medium text-slate-700">{secondaryValue}</span>
        </p>
      )}
    </div>
  );
}