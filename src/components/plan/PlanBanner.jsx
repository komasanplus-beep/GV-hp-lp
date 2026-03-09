import React from 'react';
import { usePlan } from './usePlan';
import { Zap, TrendingUp, HardDrive, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ProgressBar({ value, max, color = 'bg-amber-500' }) {
  const pct = max === -1 ? 0 : Math.min(100, (value / max) * 100);
  const isOver = pct >= 90;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${isOver ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-16 text-right shrink-0">
        {max === -1 ? `${value} / ∞` : `${value} / ${max}`}
      </span>
    </div>
  );
}

const PLAN_COLORS = {
  free: 'bg-slate-100 text-slate-700 border-slate-300',
  starter: 'bg-blue-100 text-blue-700 border-blue-300',
  pro: 'bg-violet-100 text-violet-700 border-violet-300',
  agency: 'bg-amber-100 text-amber-700 border-amber-300',
};

export default function PlanBanner() {
  const { plan, usage, isAtLPLimit, isAtAILimit } = usePlan();

  const storageGB = (usage.storage_used / 1024).toFixed(1);
  const storageLimitGB = plan.storage_limit >= 1024
    ? `${(plan.storage_limit / 1024).toFixed(0)}GB`
    : `${plan.storage_limit}MB`;
  const showWarning = isAtLPLimit || isAtAILimit;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      {/* プランバッジ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PLAN_COLORS[plan.plan_code] || PLAN_COLORS.free}`}>
            {plan.name} プラン
          </span>
        </div>
        {showWarning && (
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 text-xs h-7">
            <ArrowUpCircle className="w-3.5 h-3.5" />
            アップグレード
          </Button>
        )}
      </div>

      {/* 使用量 */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">LP作成数</span>
            {isAtLPLimit && <span className="text-xs text-red-500 font-medium">上限到達</span>}
          </div>
          <ProgressBar value={usage.lp_count} max={plan.max_lp} color="bg-violet-500" />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">AI生成（今月）</span>
            {isAtAILimit && <span className="text-xs text-red-500 font-medium">上限到達</span>}
          </div>
          <ProgressBar value={usage.ai_used} max={plan.ai_limit} color="bg-amber-500" />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">ストレージ</span>
          </div>
          <ProgressBar value={usage.storage_used} max={plan.storage_limit} color="bg-blue-500" />
        </div>
      </div>
    </div>
  );
}