/**
 * usePlan - 現在ユーザーのプランと使用量を取得するフック
 */
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const DEFAULT_PLAN = {
  name: 'FREE',
  plan_code: 'free',
  max_lp: 1,
  ai_limit: 10,
  domain_limit: 0,
  ab_test_enabled: false,
  member_limit: 1,
  storage_limit: 500,
};

export function usePlan() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userPlanList = [] } = useQuery({
    queryKey: ['userPlan', user?.id],
    queryFn: () => base44.entities.UserPlan.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const userPlan = userPlanList[0];

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.Plan.list(),
  });

  const plan = userPlan
    ? plans.find(p => p.id === userPlan.plan_id) || DEFAULT_PLAN
    : DEFAULT_PLAN;

  const { data: usageList = [] } = useQuery({
    queryKey: ['planUsage', user?.id],
    queryFn: () => base44.entities.PlanUsage.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = usageList.find(u => u.month_year === currentMonth) || usageList[0] || { ai_used: 0, lp_count: 0, storage_used: 0 };

  const isAtLPLimit = plan.max_lp !== -1 && usage.lp_count >= plan.max_lp;
  const isAtAILimit = usage.ai_used >= plan.ai_limit;
  const isAtDomainLimit = (count) => plan.domain_limit !== -1 && count >= plan.domain_limit;

  return { plan, userPlan, usage, user, isAtLPLimit, isAtAILimit, isAtDomainLimit };
}