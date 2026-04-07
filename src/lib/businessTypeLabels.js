/**
 * businessTypeLabels
 * 業種に応じたUI表示ラベル切替
 * 
 * 各業種ごとに以下を定義：
 * - service_label: Serviceエンティティの呼び方
 * - price_label: 料金の呼び方
 * - duration_label: 所要時間の呼び方
 * - capacity_label: 容量の呼び方
 */

export const BUSINESS_TYPE_LABELS = {
  hotel: {
    name: 'ホテル',
    service_label: '客室',
    price_label: '宿泊料金',
    duration_label: '宿泊期間',
    capacity_label: '定員',
    list_title: 'お部屋一覧',
    detail_title: 'お部屋詳細',
    icon: '🏨',
    plural: 'お部屋'
  },
  salon: {
    name: 'サロン',
    service_label: 'メニュー',
    price_label: '施術料金',
    duration_label: '所要時間',
    capacity_label: '対応人数',
    list_title: 'メニュー一覧',
    detail_title: 'メニュー詳細',
    icon: '💇',
    plural: 'メニュー'
  },
  clinic: {
    name: 'クリニック',
    service_label: '診療科目',
    price_label: '診療料金',
    duration_label: '診療時間',
    capacity_label: '対応人数',
    list_title: '診療科目一覧',
    detail_title: '診療科目詳細',
    icon: '🏥',
    plural: '診療科目'
  },
  gym: {
    name: 'ジム',
    service_label: 'コース',
    price_label: 'コース料金',
    duration_label: '所要時間',
    capacity_label: '対応人数',
    list_title: 'コース一覧',
    detail_title: 'コース詳細',
    icon: '💪',
    plural: 'コース'
  },
  school: {
    name: 'スクール',
    service_label: 'レッスン',
    price_label: 'レッスン料金',
    duration_label: '所要時間',
    capacity_label: '定員',
    list_title: 'レッスン一覧',
    detail_title: 'レッスン詳細',
    icon: '🎓',
    plural: 'レッスン'
  },
  restaurant: {
    name: 'レストラン',
    service_label: 'メニュー',
    price_label: '料金',
    duration_label: '提供時間',
    capacity_label: '人数',
    list_title: 'メニュー一覧',
    detail_title: 'メニュー詳細',
    icon: '🍽️',
    plural: 'メニュー'
  },
  beauty: {
    name: 'ビューティー',
    service_label: '施術',
    price_label: '施術料金',
    duration_label: '所要時間',
    capacity_label: '対応人数',
    list_title: '施術一覧',
    detail_title: '施術詳細',
    icon: '💄',
    plural: '施術'
  },
  wellness: {
    name: 'ウェルネス',
    service_label: 'プログラム',
    price_label: 'プログラム料金',
    duration_label: '所要時間',
    capacity_label: '定員',
    list_title: 'プログラム一覧',
    detail_title: 'プログラム詳細',
    icon: '🧘',
    plural: 'プログラム'
  },
  other: {
    name: 'その他',
    service_label: 'サービス',
    price_label: '料金',
    duration_label: '所要時間',
    capacity_label: '対応人数',
    list_title: 'サービス一覧',
    detail_title: 'サービス詳細',
    icon: '⭐',
    plural: 'サービス'
  }
};

/**
 * 業種に応じたラベルを取得
 */
export function getBusinessTypeLabel(businessType, key) {
  const labels = BUSINESS_TYPE_LABELS[businessType] || BUSINESS_TYPE_LABELS.other;
  return labels[key] || '';
}

/**
 * Service 表示時の単数形ラベル
 */
export function getServiceLabel(businessType) {
  return getBusinessTypeLabel(businessType, 'service_label');
}

/**
 * Service 表示時の複数形ラベル
 */
export function getServicePluralLabel(businessType) {
  return getBusinessTypeLabel(businessType, 'plural');
}

/**
 * 価格ラベル
 */
export function getPriceLabel(businessType) {
  return getBusinessTypeLabel(businessType, 'price_label');
}

/**
 * 所要時間ラベル
 */
export function getDurationLabel(businessType) {
  return getBusinessTypeLabel(businessType, 'duration_label');
}

/**
 * 容量ラベル
 */
export function getCapacityLabel(businessType) {
  return getBusinessTypeLabel(businessType, 'capacity_label');
}