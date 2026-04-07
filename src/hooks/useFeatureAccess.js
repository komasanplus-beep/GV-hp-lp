import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * useFeatureAccess
 * 
 * 機能アクセス権判定 hook
 * 
 * 使用例：
 * const { allowed, source } = useFeatureAccess('crm_guest', { siteId: '123' });
 * 
 * if (!allowed) {
 *   return <LockedFeature source={source} />;
 * }
 */
export function useFeatureAccess(featureCode, options = {}) {
  const { siteId, tenantId, userId } = options;

  return useQuery({
    queryKey: ['featureAccess', featureCode, userId, siteId, tenantId],
    queryFn: async () => {
      const result = await base44.functions.invoke('resolveFeatureAccess', {
        feature_code: featureCode,
        user_id: userId,
        site_id: siteId,
        tenant_id: tenantId
      });
      return result.data;
    },
    staleTime: 60 * 1000, // 1分間キャッシュ
  });
}

/**
 * useFeatureLimit
 * 
 * 利用回数・数量の上限チェック hook
 * 
 * 使用例：
 * const { allowed, used, limit, remaining } = useFeatureLimit('ai_generation_count', { userId: '123' });
 */
export function useFeatureLimit(counterType, options = {}) {
  const { userId, siteId, tenantId, amount = 1 } = options;

  return useQuery({
    queryKey: ['featureLimit', counterType, userId, siteId, tenantId],
    queryFn: async () => {
      const result = await base44.functions.invoke('checkFeatureLimit', {
        counter_type: counterType,
        user_id: userId,
        site_id: siteId,
        tenant_id: tenantId,
        amount: amount
      });
      return result.data;
    },
    staleTime: 60 * 1000,
  });
}