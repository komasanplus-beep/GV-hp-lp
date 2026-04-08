/**
 * プラン定義（フロント側参照用）
 * バックエンド Plan エンティティ と同期
 */
export const PLAN_DEFINITIONS = {
  free: {
    code: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      site_count: 1,
      lp_count: 1,
      ai_generation_count: 3,
      ai_lp_generation: 0,
      guest_count: 10,
      reservation_count: 10,
      campaign_send_count: 0,
    },
    features: [],
    trial_days: 0,
  },
  starter: {
    code: 'starter',
    name: 'Starter',
    monthlyPrice: 2980,
    yearlyPrice: 29800,
    limits: {
      site_count: 1,
      lp_count: 3,
      ai_generation_count: 10,
      ai_lp_generation: 5,
      guest_count: 50,
      reservation_count: 50,
      campaign_send_count: 10,
    },
    features: ['ai_generation', 'custom_domain'],
    trial_days: 14,
  },
  pro: {
    code: 'pro',
    name: 'Pro',
    monthlyPrice: 5980,
    yearlyPrice: 59800,
    limits: {
      site_count: 3,
      lp_count: 10,
      ai_generation_count: 50,
      ai_lp_generation: 20,
      guest_count: 500,
      reservation_count: 500,
      campaign_send_count: 100,
    },
    features: ['ai_generation', 'custom_domain', 'analytics', 'template', 'booking'],
    trial_days: 14,
  },
  enterprise: {
    code: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 12000,
    yearlyPrice: 120000,
    limits: {
      site_count: 999,
      lp_count: 999,
      ai_generation_count: -1,
      ai_lp_generation: -1,
      guest_count: -1,
      reservation_count: -1,
      campaign_send_count: -1,
    },
    features: ['all'],
    trial_days: 30,
  },
};

export const PLAN_ORDER = ['free', 'starter', 'pro', 'enterprise'];

export const FEATURE_LABELS = {
  ai_generation: 'AI生成',
  custom_domain: 'カスタムドメイン',
  analytics: '分析ツール',
  template: 'テンプレート',
  booking: '予約管理',
};

export function getPlanDefinition(planCode) {
  return PLAN_DEFINITIONS[planCode] || PLAN_DEFINITIONS.free;
}

export function formatPrice(price) {
  if (price === 0) return '無料';
  return `¥${price.toLocaleString()}`;
}

export function getYearlyDiscount(monthlyPrice) {
  const yearly = monthlyPrice * 12;
  const discounted = Math.floor(yearly * 0.83); // 17%割引
  const monthlyEquivalent = Math.floor(discounted / 12);
  return { yearly, discounted, monthlyEquivalent };
}