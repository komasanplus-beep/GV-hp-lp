/**
 * PricingPage - プラン料金表示＆選択
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { PLAN_ORDER, getPlanDefinition, formatPrice, FEATURE_LABELS, getYearlyDiscount } from '@/lib/planDefinitions';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return user;
    },
  });

  const { data: userPlan } = useQuery({
    queryKey: ['userPlan', currentUser?.id],
    queryFn: () =>
      currentUser?.id
        ? base44.entities.UserPlan.filter({ user_id: currentUser.id }).then(r => r[0])
        : null,
    enabled: !!currentUser?.id,
  });

  const currentPlanCode = userPlan?.plan_id || 'free';

  const handleUpgrade = (planCode) => {
    if (planCode === currentPlanCode) {
      alert('現在のプランです');
      return;
    }
    // 決済フロー (Stripe 等)
    alert(`${planCode} へのアップグレード処理`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            シンプルで透明な料金体系
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            あなたのビジネス規模に合わせてプランを選択
          </p>

          {/* 請求周期切替 */}
          <div className="inline-flex gap-2 bg-white rounded-lg p-1 shadow-sm">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
            >
              月払い
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
            >
              年払い
              <Badge className="ml-2 bg-green-100 text-green-800">
                17%割引
              </Badge>
            </Button>
          </div>
        </div>

        {/* プラン比較表 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PLAN_ORDER.map((planCode) => {
            const plan = getPlanDefinition(planCode);
            const isCurrentPlan = planCode === currentPlanCode;
            const yearlyInfo = getYearlyDiscount(plan.monthlyPrice);

            return (
              <Card
                key={planCode}
                className={`relative overflow-hidden transition-all duration-300 ${
                  isCurrentPlan
                    ? 'ring-2 ring-blue-500 shadow-lg scale-105'
                    : 'hover:shadow-lg'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    現在のプラン
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {/* プラン名＆価格 */}
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-3xl font-bold text-slate-900">
                      {billingCycle === 'monthly'
                        ? formatPrice(plan.monthlyPrice)
                        : formatPrice(yearlyInfo.monthlyEquivalent)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {billingCycle === 'monthly'
                        ? '/月'
                        : '/月（年払い・17%割引）'}
                    </p>
                  </div>

                  {/* 制限 */}
                  <div className="space-y-2 py-4 border-t border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">サイト</span>
                      <span className="font-semibold text-slate-900">
                        {plan.limits.site_count === -1 ? '無制限' : plan.limits.site_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">LP</span>
                      <span className="font-semibold text-slate-900">
                        {plan.limits.lp_count === -1 ? '無制限' : plan.limits.lp_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">AI生成</span>
                      <span className="font-semibold text-slate-900">
                        {plan.limits.ai_generation_count === -1
                          ? '無制限'
                          : `${plan.limits.ai_generation_count}回`}
                      </span>
                    </div>
                  </div>

                  {/* 機能 */}
                  <div className="space-y-2">
                    {plan.features.includes('all') ? (
                      <div className="text-sm text-slate-600">
                        ✓ すべての機能を含む
                      </div>
                    ) : (
                      <>
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-slate-600">
                              {FEATURE_LABELS[feature] || feature}
                            </span>
                          </div>
                        ))}
                        {plan.features.length === 0 && (
                          <div className="text-sm text-slate-400">
                            —
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* ボタン */}
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isCurrentPlan}
                    onClick={() => handleUpgrade(planCode)}
                  >
                    {isCurrentPlan ? '現在のプラン' : 'プランを選択'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            よくある質問
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                プランはいつでも変更できますか？
              </h3>
              <p className="text-slate-600">
                はい、いつでも変更できます。アップグレード時は日割り計算で対応します。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                無料プランから有料プランへ変更する場合、クレジットカードは必須ですか？
              </h3>
              <p className="text-slate-600">
                はい、有料プランの利用にはクレジットカード登録が必須となります。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                キャンセルはいつでもできますか？
              </h3>
              <p className="text-slate-600">
                はい、いつでもキャンセルできます。その月の料金は発生しません。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}