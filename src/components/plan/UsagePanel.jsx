/**
 * UsagePanel - 使用状況＆制限表示
 * ダッシュボード・サイドバーで表示
 */
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UsagePanel({ plan, usage, userPlanCode }) {
  if (!plan || !usage) return null;

  const resources = [
    { key: 'site_count', label: 'サイト', icon: '🌐' },
    { key: 'lp_count', label: 'LP', icon: '📄' },
    { key: 'ai_generation_count', label: 'AI生成', icon: '✨' },
  ];

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const isAtLimit = (usedCount, limit) => {
    if (limit === -1) return false;
    return usedCount >= limit;
  };

  const getPercentage = (usedCount, limit) => {
    if (limit === -1) return 0;
    return Math.min((usedCount / limit) * 100, 100);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">使用状況</h3>
          <p className="text-sm text-slate-500 mt-1">
            プラン：<span className="font-medium">{plan.name}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={createPageUrl('Pricing')}>
            <ArrowRight className="w-4 h-4 mr-1" />
            プラン確認
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {resources.map((resource) => {
          const usedCount = usage[resource.key] || 0;
          const limit = plan.limits?.[resource.key] || 0;
          const isUnlimited = limit === -1;
          const percentage = getPercentage(usedCount, limit);
          const atLimit = isAtLimit(usedCount, limit);

          return (
            <div key={resource.key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  {resource.icon} {resource.label}
                </label>
                <span className="text-sm font-semibold text-slate-900">
                  {usedCount}
                  {isUnlimited ? '' : ` / ${limit}`}
                </span>
              </div>

              {!isUnlimited ? (
                <>
                  <Progress
                    value={percentage}
                    className={`h-2 ${atLimit ? 'opacity-100' : ''}`}
                  />
                  {atLimit && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      上限に達しています
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-slate-500">無制限</div>
              )}
            </div>
          );
        })}
      </div>

      {/* アップグレード提案 */}
      {userPlanCode === 'free' && (
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900 font-medium mb-2">
            もっと作成したい？
          </p>
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" asChild>
            <Link to={createPageUrl('Pricing')}>
              Starter にアップグレード
            </Link>
          </Button>
        </div>
      )}
    </Card>
  );
}