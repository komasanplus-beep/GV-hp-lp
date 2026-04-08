# ✅ AI利用回数上限管理システム 実装完了ガイド

**実装日**: 2026-04-08  
**目的**: 管理画面からPlanMasterのAI上限を一元管理、全API・UI・制御ロジックを統一

---

## 📋 実装概要

### **正本（Single Source of Truth）**

```
PlanMaster.limits
├── ai_generation_count: 月間AI記事生成回数
├── ai_post_generation: 記事生成関連の別カウンタ
└── ai_lp_generation: LP生成回数
```

**重要**: ここに設定した値が、全AI制御の上限になります。

---

## 🎯 1. 管理画面（新規ページ）

**URL**: `/master/plan-limits`  
**ファイル**: `pages/MasterPlanLimits.jsx`

### 表示内容

- **プラン一覧**（カード表示）
  - プラン名
  - コード
  - 月額/年額
  - **AI上限値**（赤枠で強調）
  - 含まれる機能

- **編集モーダル**
  ```
  基本情報
  ├── プラン名
  ├── プランコード
  └── 説明
  
  価格
  ├── 月額
  └── 年額
  
  ✨ AI利用上限（正本）
  ├── AI記事生成 (ai_generation_count): [数値入力]
  ├── LP生成 (ai_lp_generation): [数値入力]
  └── その他 (ai_post_generation): [数値入力]
  
  含まれる機能コード
  └── サイトコア, AI生成, etc. (カンマ区切り)
  ```

### 保存処理

```javascript
await base44.asServiceRole.entities.PlanMaster.update(planId, {
  limits: {
    ai_generation_count: 10,
    ai_lp_generation: 5,
    ai_post_generation: 0,
  },
  // その他フィールド
});
```

**即座に反映**: キャッシュ無効化により、全API・UIが新しい上限を参照

---

## 🔧 2. バックエンド制御ロジック修正

### **aiGuard** （AI実行前ガード）

**ファイル**: `functions/aiGuard.js`

#### 流れ

1. **User認証** → ユーザーID取得
2. **Subscription取得** → plan_code 決定
3. **PlanMaster取得** → `plan.limits` を参照 ✅
4. **counter_type に応じたlimitKeyを決定**
   ```javascript
   if (feature_code === 'ai_lp_generation') {
     limitKey = 'ai_lp_generation';
   } else {
     limitKey = 'ai_generation_count'; // デフォルト
   }
   ```
5. **limit が 0 → 機能利用不可**
   ```javascript
   if (limit === 0) {
     return { allowed: false, source: 'feature_disabled' };
   }
   ```
6. **limit チェック**
   - `used >= limit` → `allowed: false, status: 429`
   - それ以外 → `allowed: true`
7. **UsageLimitCounter インクリメント**

#### 重要な修正点

✅ `plan.limits?.[limitKey]` で動的にlimitを取得  
✅ `limit === 0` で利用不可判定  
✅ `counter_type` を feature_code から導出  
✅ フォールバック: plan が null の場合は 403

---

### **checkFeatureLimit** （利用回数チェック）

**ファイル**: `functions/checkFeatureLimit.js`

#### 動作

```javascript
const limit = plan?.limits?.[counter_type];

// limit が 0 = 利用不可
if (limit === 0) {
  return { allowed: false, limit: 0, remaining: 0 };
}

// limit が undefined/null/-1 = 無制限
if (limit === undefined || limit === null || limit === -1) {
  return { allowed: true, limit: null, remaining: null };
}

// 通常チェック
const remaining = limit - used;
const allowed = remaining >= amount;
```

---

## 📊 3. フロント連携

### **AIPostGeneratorPanel** （AI実行UI）

**ファイル**: `components/post/AIPostGeneratorPanel.jsx`

#### AI生成実行フロー

```javascript
const handleGenerate = async () => {
  // 1. aiGuard チェック
  const res = await base44.functions.invoke('generatePostWithAI', {...});
  
  // 2. レスポンス判定
  if (res.data?.source === 'limit_exceeded') {
    // 上限到達 → モーダル表示
    setLimitData(res.data.limitData);
    setLimitModalOpen(true);
    return;
  }
  
  // 3. 成功 → 結果表示
  setGenerated(data);
};
```

#### ヘッダーに残数表示

```javascript
{generated?.limit && (
  <Badge variant="outline">
    残り <span className="font-bold">{remaining}</span> / {generated.limit}回
  </Badge>
)}
```

---

### **AILimitUpgradeModal** （課金誘導）

**ファイル**: `components/ai/AILimitUpgradeModal.jsx`

上限到達時に表示:

```
⚡ AI利用上限に達しました

現在のプラン: [バッジ]
AI利用回数: 20/20 [プログレスバー]

[アップグレード] [追加パック] [あとで]
```

---

### **useAILimitWarning** フック

**ファイル**: `hooks/useAILimitWarning.js`

AI実行前の警告チェック:

```javascript
const { remaining, checkLimit, showLimitModal } = useAILimitWarning('ai_post_generation');

const allowed = await checkLimit(siteId);
if (!allowed) return; // ブロック

// 残り ≤ 3 の場合、トースト表示
```

---

## 🧪 4. 動作確認テスト

### テスト1: 上限設定の反映

1. **管理画面** → `/master/plan-limits`
2. **Free プラン編集** → AI記事生成: `10`
3. **保存** → キャッシュ無効化
4. **API直叩き確認**
   ```bash
   curl -X POST https://app.base44.dev/api/functions/aiGuard \
     -H "Authorization: Bearer ..." \
     -d '{"feature_code":"ai_post_generation","site_id":"xxx"}'
   ```
   → `limit: 10` が返される ✅

---

### テスト2: 上限到達動作

1. **ユーザーのカウンタを手動で 10 に設定**
   ```javascript
   await base44.asServiceRole.entities.UsageLimitCounter.update(id, {
     used_count: 10
   });
   ```
2. **AI生成実行**
3. **エラーレスポンス確認**
   ```json
   {
     "allowed": false,
     "source": "limit_exceeded",
     "limit": 10,
     "used": 10,
     "remaining": 0,
     "status": 429
   }
   ```
   ✅ モーダル表示

---

### テスト3: プラン変更時の即反映

1. **Free ユーザー (limit: 10)**
2. **Starter プラン変更** (limit: 50) に変更
3. **aiGuard を即座に呼び出し**
   ```javascript
   await base44.functions.invoke('aiGuard', {
     feature_code: 'ai_post_generation',
     site_id: 'xxx'
   });
   ```
4. **limit: 50 が返される** ✅ (リロード不要)

---

### テスト4: 利用可否（limit=0）

1. **管理画面** → AI上限を `0` に設定
2. **保存**
3. **aiGuard 呼び出し**
4. **`allowed: false, source: 'feature_disabled'` が返される** ✅

---

## 🔗 5. データフロー図

```
┌─────────────────────────────────────────┐
│ 管理画面 (MasterPlanLimits)               │
│ AI上限を変更 → 保存                       │
└────────────────┬────────────────────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ PlanMaster.limits  │
        │ ai_generation_count: 10
        │ ai_lp_generation: 5
        └────────────────────┘
                 │
    ┌────────────┼────────────┐
    ↓            ↓            ↓
┌──────────┐ ┌──────────┐ ┌──────────────┐
│ aiGuard  │ │checkLimit│ │ Frontend UI  │
│(上限check)│ │(allow/no)│ │（残数表示）   │
└──────────┘ └──────────┘ └──────────────┘
    │            │            │
    ↓            ↓            ↓
┌──────────────────────────────────────────┐
│ AI実行時：PlanMaster.limits を参照        │
│ → UsageLimitCounter をインクリメント      │
│ → 上限チェック (used >= limit?) → block  │
└──────────────────────────────────────────┘
```

---

## 🛡️ 6. エラー防止ガード

### Scenario 1: PlanMaster が見つからない

```javascript
if (!plan) {
  return Response.json({
    allowed: false,
    source: 'plan_not_found',
    reason: `プラン設定が見つかりません: ${plan_code}`
  }, { status: 403 });
}
```

### Scenario 2: limit が未定義

```javascript
const limit = plan?.limits?.[limitKey];

if (limit === undefined || limit === null || limit === -1) {
  // 無制限扱い
  return { allowed: true, limit: null, remaining: null };
}
```

### Scenario 3: UsageLimitCounter が存在しない

```javascript
// counter が null でも動作
if (!counter) {
  // 新規作成
  await base44.asServiceRole.entities.UsageLimitCounter.create({...});
}
```

---

## 🚀 7. 使用例

### **フロント側（React）**

```javascript
import { useAILimitWarning } from '@/hooks/useAILimitWarning';

function MyComponent() {
  const { remaining, checkLimit, showLimitModal } = useAILimitWarning('ai_post_generation');

  const handleGenerateArticle = async () => {
    // 事前チェック
    const allowed = await checkLimit(siteId);
    if (!allowed) {
      toast.error('AI利用回数の上限に達しました');
      return;
    }

    // AI実行
    const result = await base44.functions.invoke('generatePostWithAI', {...});
    
    // UI 更新
    setArticle(result);
    toast.success(`残り ${remaining} 回です`);
  };

  return (
    <button onClick={handleGenerateArticle}>
      AI記事生成
    </button>
  );
}
```

---

### **バックエンド側（検証例）**

```javascript
// functions/myCustomAIFunction.js
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  // aiGuard チェック
  const guardRes = await base44.functions.invoke('aiGuard', {
    feature_code: 'ai_post_generation',
    site_id: req.body.site_id
  });

  if (!guardRes.data?.allowed) {
    return Response.json(guardRes.data, { status: guardRes.status });
  }

  // AI処理
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: '...'
  });

  return Response.json({ success: true, data: result });
});
```

---

## 📈 8. 監視＆ログ

### AIUsageLog エンティティ

毎回のAI実行時に記録:

```json
{
  "user_id": "user_123",
  "site_id": "site_456",
  "feature_code": "ai_post_generation",
  "status": "success" | "blocked" | "limit_exceeded",
  "error_message": "..." (エラー時のみ),
  "token_usage": 1500
}
```

**利用**: `/master/ai-analytics` で集計・分析

---

## ✅ チェックリスト

- [x] PlanMaster.limits を正本として統一
- [x] aiGuard で動的に limit 取得
- [x] checkFeatureLimit で limit チェック
- [x] 管理画面 (MasterPlanLimits) 実装
- [x] フロント表示（残数表示）統合
- [x] AILimitUpgradeModal で課金誘導
- [x] useAILimitWarning フック完成
- [x] エラーハンドリング完備
- [x] limit=0 で利用不可判定
- [x] リロード不要で即反映

---

## 🎯 最終ゴール達成

**「管理画面で上限を変更するだけで、全AI制御が自動的に変わる状態」**

✅ **管理画面**: `/master/plan-limits`  
✅ **正本**: `PlanMaster.limits`  
✅ **バックエンド**: `aiGuard`, `checkFeatureLimit` が自動参照  
✅ **フロント**: `AIPostGeneratorPanel`, `useAILimitWarning` が自動表示  
✅ **課金**: `AILimitUpgradeModal` で自然な誘導  

---

**実装完了 / 本番運用対応済み**