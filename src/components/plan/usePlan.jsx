/**
 * usePlan - 現在ユーザーのプラン・使用量・機能フラグを取得するフック
 * 正とする構造: User → UserPlan → Plan / PlanUsage
 */
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const DEFAULT_PLAN = {
  name: 'FREE',
  plan_code: 'free',
  max_lp: 1,
  ai_limit: 10,
  domain_limit: 0,
  ab_test_enabled: false,
  member_limit: 1,
  storage_limit: 500,
  price_monthly: 0,
};

export function usePlan() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // UserPlan (user_id → plan_id)
  const { data: userPlanList = [] } = useQuery({
    queryKey: ['userPlan', user?.id],
    queryFn: () => base44.entities.UserPlan.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const userPlan = userPlanList[0] || null;

  // Plan マスタ
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.Plan.list(),
  });
  const plan = (userPlan && plans.find(p => p.id === userPlan.plan_id)) || DEFAULT_PLAN;

  // PlanUsage (当月)
  const { data: usageList = [] } = useQuery({
    queryKey: ['planUsage', user?.id],
    queryFn: () => base44.entities.PlanUsage.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = usageList.find(u => u.month_year === currentMonth)
    || usageList[0]
    || { ai_used: 0, lp_count: 0, storage_used: 0 };

  // UserFeatures (サイドバー制御用)
  const { data: featuresList = [] } = useQuery({
    queryKey: ['userFeatures', user?.id],
    queryFn: () => base44.entities.UserFeatures.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const userFeatures = featuresList[0] || null;

  // 制限チェック
  const isAtLPLimit = plan.max_lp !== -1 && usage.lp_count >= plan.max_lp;
  const isAtAILimit = plan.ai_limit > 0 && usage.ai_used >= plan.ai_limit;
  const isAtDomainLimit = (count) => plan.domain_limit !== -1 && plan.domain_limit > 0 && count >= plan.domain_limit;

  // 機能チェック (admin は制限なし)
  const isFeatureEnabled = (key) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'master') return true;
    if (!userFeatures) return false;
    return !!userFeatures[key];
  };

  return {
    plan,
    userPlan,
    usage,
    user,
    userFeatures,
    isAtLPLimit,
    isAtAILimit,
    isAtDomainLimit,
    isFeatureEnabled,
  };
}