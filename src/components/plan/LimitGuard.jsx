/**
 * LimitGuard - 制限到達時にアップグレード案内を表示し、子要素をブロックする
 * type: 'lp' | 'ai' | 'domain' | 'ab_test'
 */
import React from 'react';
import { usePlan } from './usePlan';
import { ArrowUpCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MESSAGES = {
  lp: 'LP作成数の上限に達しました。',
  ai: '今月のAI生成回数の上限に達しました。',
  domain: '接続可能ドメイン数の上限に達しました。',
  ab_test: 'ABテストはこのプランでは利用できません。',
};

export default function LimitGuard({ type, domainCount = 0, children }) {
  const { plan, usage, isAtLPLimit, isAtAILimit, isAtDomainLimit } = usePlan();

  let blocked = false;
  if (type === 'lp') blocked = isAtLPLimit;
  if (type === 'ai') blocked = isAtAILimit;
  if (type === 'domain') blocked = isAtDomainLimit(domainCount);
  if (type === 'ab_test') blocked = !plan.ab_test_enabled;

  if (!blocked) return children;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
        <div className="text-center px-6 py-4">
          <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700 mb-3">{MESSAGES[type]}</p>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 gap-1.5">
            <ArrowUpCircle className="w-4 h-4" />
            プランをアップグレード
          </Button>
        </div>
      </div>
    </div>
  );
}