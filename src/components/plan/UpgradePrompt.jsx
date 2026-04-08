/**
 * UpgradePrompt - 制限時の課金導線
 * LP/サイト作成時の上限到達時に表示
 */
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UpgradePrompt({
  open,
  onOpenChange,
  resourceType = 'LP', // 'LP' | 'Site' | 'AI'
  currentPlan,
  nextPlan,
}) {
  if (!currentPlan) return null;

  const resourceLabel = {
    LP: 'ランディングページ',
    Site: 'サイト',
    AI: 'AI生成',
  }[resourceType] || resourceType;

  const limitsText = {
    LP: `現在のプランでは${currentPlan.limits.lp_count}個まで作成できます`,
    Site: `現在のプランでは${currentPlan.limits.site_count}個まで作成できます`,
    AI: `現在のプランでは${currentPlan.limits.ai_generation_count}回まで使用できます`,
  }[resourceType];

  const nextLimits = {
    LP: nextPlan?.limits.lp_count,
    Site: nextPlan?.limits.site_count,
    AI: nextPlan?.limits.ai_generation_count,
  }[resourceType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle>
              {resourceLabel}の上限に達しました
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 現在の制限 */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-2">
              {limitsText}
            </p>
            <p className="text-lg font-semibold text-slate-900">
              現在：{currentPlan.name}プラン
            </p>
          </div>

          {/* アップグレード提案 */}
          {nextPlan && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {nextPlan.name}プランにアップグレード
                  </p>
                  <p className="text-sm text-blue-800 mb-3">
                    {nextLimits === -1
                      ? `無制限の${resourceLabel}が使用可能`
                      : `${nextLimits}個の${resourceLabel}が使用可能`}
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    ¥{nextPlan.monthlyPrice.toLocaleString()}/月
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI追加購入オプション */}
          {resourceType === 'AI' && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-green-900 mb-2">
                別オプション：AI追加購入
              </p>
              <p className="text-sm text-green-800 mb-3">
                10回 ¥1,980 で追加購入できます
              </p>
              <Button variant="outline" size="sm" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                追加購入する
              </Button>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" asChild>
              <Link to={createPageUrl('Pricing')}>
                プランを確認
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}