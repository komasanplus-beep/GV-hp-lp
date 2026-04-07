/**
 * usePlan - 現在ユーザーのプラン・使用量・機能フラグを取得するフック
 *
 * 正 (Canonical) な構造:
 *   User → UserPlan → Plan → PlanUsage
 *
 * Legacy (非接続):
 *   SubscriptionPlan, UserSubscription — 参照しない
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
  // 1. 現在ユーザー
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // 2. UserPlan (user_id → plan_id)
  const { data: userPlanList = [], isLoading: loadingUserPlan } = useQuery({
    queryKey: ['userPlan', user?.id],
    queryFn: () => base44.entities.UserPlan.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const userPlan = userPlanList[0] || null;

  // 3. Plan マスタ全件 (キャッシュ共有)
  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.Plan.list(),
  });
  const plan = (userPlan && plans.find(p => p.id === userPlan.plan_id)) || DEFAULT_PLAN;

  // 4. PlanUsage (当月)
  const { data: usageList = [], isLoading: loadingUsage } = useQuery({
    queryKey: ['planUsage', user?.id],
    queryFn: () => base44.entities.PlanUsage.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = usageList.find(u => u.month_year === currentMonth)
    || usageList[0]
    || { ai_used: 0, lp_count: 0, storage_used: 0 };

  // UserFeatures (サイドバー・機能制御用)
  const { data: featuresList = [], isLoading: loadingFeatures } = useQuery({
    queryKey: ['userFeatures', user?.id],
    queryFn: () => base44.entities.UserFeatures.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });
  const userFeatures = featuresList[0] || null;

  const isLoading = loadingUser || loadingUserPlan || loadingPlans || loadingUsage || loadingFeatures;

  // プランがアクティブかどうか (UserPlan.status が active/trial)
  const isActive = userPlan
    ? userPlan.status === 'active' || userPlan.status === 'trial'
    : false;

  // --- 制限値オブジェクト (limits) ---
  const limits = {
    max_lp: plan.max_lp,           // -1=無制限
    max_sites: plan.max_sites ?? 1, // -1=無制限
    ai_limit: plan.ai_limit,
    domain_limit: plan.domain_limit, // -1=無制限, 0=サブドメインのみ
    member_limit: plan.member_limit,
    storage_limit: plan.storage_limit, // MB
    ab_test_enabled: plan.ab_test_enabled,
  };

  // --- 機能フラグ (features) ---
  // admin/master は全機能解放、一般ユーザーは UserFeatures に従う
  const features = {
    dashboard: true,
    site_manage: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.site_manage,
    lp_manage: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.lp_manage,
    blog_manage: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.blog_manage,
    ai_generate: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.ai_generate,
    seo_manage: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.seo_manage,
    domain_manage: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.domain_manage,
    reservation_manage: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.reservation_manage,
    ec_manage: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.ec_manage,
    member_manage: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.member_manage,
    analytics: user?.role === 'admin' || user?.role === 'master' || !!userFeatures?.analytics,
    settings: true,
  };

  // --- 制限チェック関数 ---
  const isAtLPLimit = plan.max_lp !== -1 && usage.lp_count >= plan.max_lp;
  const isAtSiteLimit = (plan.max_sites ?? 1) !== -1 && (usage.site_count || 0) >= (plan.max_sites ?? 1);
  const isAtAILimit = plan.ai_limit > 0 && usage.ai_used >= plan.ai_limit;
  const isAtDomainLimit = (count) => plan.domain_limit !== -1 && plan.domain_limit > 0 && count >= plan.domain_limit;

  // 機能チェック (後方互換)
  const isFeatureEnabled = (key) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'master') return true;
    if (!userFeatures) return false;
    return !!userFeatures[key];
  };

  return {
    // 正規化されたオブジェクト
    plan,
    userPlan,
    usage,
    features,
    limits,
    isLoading,
    isActive,

    // 後方互換 (既存コードが参照しているもの)
    user,
    userFeatures,
    isAtLPLimit,
    isAtSiteLimit,
    isAtAILimit,
    isAtDomainLimit,
    isFeatureEnabled,
  };
}