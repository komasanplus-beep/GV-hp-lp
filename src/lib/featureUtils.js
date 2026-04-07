/**
 * フロント側 feature判定ユーティリティ
 * 
 * useFeatureAccess / useFeatureLimit と組み合わせて使う
 */

/**
 * 機能が利用可能か判定（同期版、キャッシュ済み）
 * キャッシュから読める場合のみ使用
 */
export function isFeatureAllowed(queryData) {
  if (!queryData) return false;
  return queryData.allowed === true;
}

/**
 * 上限をチェック
 */
export function isUnderLimit(queryData) {
  if (!queryData) return false;
  return queryData.allowed === true;
}

/**
 * ロック表示用の理由メッセージ
 */
export const FEATURE_DENY_MESSAGES = {
  'subscription_terminated': '契約が終了しています',
  'subscription_past_due': '支払い遅延中です。閲覧のみ可能です。',
  'subscription_paused': 'サブスクリプションが一時停止されています',
  'grant_disable': '管理者によって無効化されています',
  'default_deny': 'このプランでは利用できません',
  'plan': `プランに含まれていません`,
  'plan_limit_exceeded': 'プランの上限に達しています'
};

/**
 * UI で表示すべきメッセージを取得
 */
export function getFeatureDenyMessage(result) {
  if (!result || result.allowed) return null;

  const { source, reason, subscription_status } = result;

  if (source === 'subscription_block') {
    return FEATURE_DENY_MESSAGES[reason] || '利用できない状態です';
  }

  return FEATURE_DENY_MESSAGES[source] || 'この機能は利用できません';
}

/**
 * ロック UI に表示する情報
 */
export function getFeatureLockInfo(result, feature) {
  if (!result || result.allowed) return null;

  const { source, subscription_status } = result;

  return {
    locked: true,
    icon: 'lock',
    title: `${feature?.ui_label || '機能'} (ロック中)`,
    message: getFeatureDenyMessage(result),
    action: source === 'subscription_block' 
      ? { text: '支払い状況を確認', href: '/settings/billing' }
      : { text: 'プランをアップグレード', href: '/settings/plan' }
  };
}

/**
 * 利用状況の表示テキスト
 */
export function getLimitText(limitData) {
  if (!limitData) return null;
  const { used, limit, remaining } = limitData;

  if (limit === null) return '無制限';

  return {
    text: `${used} / ${limit}`,
    used,
    limit,
    remaining,
    percentage: Math.round((used / limit) * 100),
    isLimitApproaching: used >= limit * 0.8
  };
}