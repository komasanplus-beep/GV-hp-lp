/**
 * flowBlockMigration
 * 既存Flow ブロック（textarea形式）から新形式（配列）への移行ユーティリティ
 */

/**
 * 旧形式のFlow ブロックデータを新形式に移行
 * @param {Object} oldData - 旧形式: { title: string, steps: string }
 * @returns {Object} 新形式: { title: string, steps: Array<{id, heading, description}> }
 */
export function migrateFlowBlockData(oldData) {
  if (!oldData) return { title: '', steps: [] };

  // 既に新形式の場合はそのまま返す
  if (Array.isArray(oldData.steps)) {
    return oldData;
  }

  // 旧形式（textarea文字列）から配列に変換
  const stepsString = oldData.steps || '';
  const stepLines = stepsString
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const migratedSteps = stepLines.map((heading, index) => ({
    id: `step_${Date.now()}_${index}`,
    heading,
    description: '', // 旧形式では説明がないため空にする
  }));

  return {
    title: oldData.title || '',
    steps: migratedSteps,
  };
}

/**
 * Flow ブロックが旧形式かチェック
 * @param {Object} data - Flow ブロックのデータ
 * @returns {boolean} true = 旧形式、false = 新形式
 */
export function isLegacyFlowFormat(data) {
  if (!data) return false;
  // steps が文字列なら旧形式
  return typeof data.steps === 'string';
}

/**
 * Flow ブロックを新形式に正規化（旧形式ならマイグレーション）
 * @param {Object} data - Flow ブロックのデータ
 * @returns {Object} 新形式で正規化されたデータ
 */
export function normalizeFlowBlockData(data) {
  if (!data) return { title: '', steps: [] };

  if (isLegacyFlowFormat(data)) {
    return migrateFlowBlockData(data);
  }

  // 既に新形式の場合はそのまま
  return data;
}

/**
 * Flow ブロックのバリデーション
 * @param {Object} data - Flow ブロックのデータ
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateFlowBlockData(data) {
  const errors = [];

  if (!data) {
    errors.push('データが空です');
    return { valid: false, errors };
  }

  if (!Array.isArray(data.steps)) {
    errors.push('steps は配列である必要があります');
  } else if (data.steps.length === 0) {
    errors.push('最低1つのステップが必要です');
  } else {
    data.steps.forEach((step, index) => {
      if (!step.id) {
        errors.push(`ステップ${index + 1}: id が必須です`);
      }
      if (!step.heading || typeof step.heading !== 'string') {
        errors.push(`ステップ${index + 1}: heading は必須の文字列です`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Flow ブロックを JSON 文字列に変換（バックアップ用）
 * @param {Object} data - Flow ブロックのデータ
 * @returns {string} JSON 文字列
 */
export function serializeFlowBlock(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * JSON 文字列から Flow ブロックに変換（リストア用）
 * @param {string} json - JSON 文字列
 * @returns {Object|null} パースされたデータ、またはエラー時は null
 */
export function deserializeFlowBlock(json) {
  try {
    const data = JSON.parse(json);
    return normalizeFlowBlockData(data);
  } catch (error) {
    console.error('Flow block deserialization error:', error);
    return null;
  }
}

/**
 * Flow ブロックの例を返す
 * @returns {Object} サンプルデータ
 */
export function getFlowBlockSample() {
  return {
    title: '施術の流れ',
    steps: [
      {
        id: 'step_sample_1',
        heading: 'ご予約',
        description: '電話またはWebで予約をお取りします。初回の方は特にご対応させていただきます。',
      },
      {
        id: 'step_sample_2',
        heading: 'カウンセリング',
        description: 'ご来店後、お悩みや希望をじっくりヒアリングいたします。時間をたっぷり使います。',
      },
      {
        id: 'step_sample_3',
        heading: ' 頭皮診断',
        description: '特殊な機器を使って、あなたの頭皮の状態を詳しく診断いたします。',
      },
      {
        id: 'step_sample_4',
        heading: '施術',
        description: 'カウンセリング結果に基づき、個別にオーダーメイドした施術を行います。',
      },
      {
        id: 'step_sample_5',
        heading: 'アフターケア',
        description: '施術後のケア方法や、家でのシャンプー方法などをご説明します。',
      },
    ],
  };
}