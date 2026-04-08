# AI従量課金（Pay as you go）実装ガイド

## 概要
無料枠を超えたAI利用分を自動課金するシステム。ユーザーは透明性のある課金体験を得られます。

---

## アーキテクチャ

### 1. データモデル

#### PlanMaster.payg_pricing
```json
{
  "enabled": true,
  "free_quota": 10,
  "unit_price_yen": 100,
  "monthly_cap_yen": 5000
}
```

- `enabled`: Pay as you go有効化
- `free_quota`: 月間無料枠（回数）
- `unit_price_yen`: 1回あたりの料金
- `monthly_cap_yen`: 月額上限（null=無制限）

---

## ロジック

### 2. 料金計算式

```javascript
if (used <= free_quota) {
  cost = 0
} else {
  overage = used - free_quota
  cost = overage * unit_price
  if (monthly_cap !== null) {
    cost = Math.min(cost, monthly_cap)
  }
}
```

### 3. フロー

1. **aiGuard**: AI実行前に従量課金情報を返す
2. **generatePostWithAI など**: AI生成実行
3. **recordAIUsageAndCharge**: 使用ログ記録 + Stripe meter event送信
4. **calculateAIUsageCost**: 月間費用を計算
5. **UI表示**: PayAsYouGoIndicator で無料枠・超過分・料金を表示

---

## 実装箇所

### Backend Functions

#### `functions/aiGuard`
- 拡張：Pay as you go情報をレスポンスに追加
- 超過時も利用可能（制限なし）
- 警告情報を返す

```javascript
// レスポンス例
{
  allowed: true,
  payg: {
    enabled: true,
    overage: 5,
    cost: 500,
    freeQuota: 10,
    unitPrice: 100
  }
}
```

#### `functions/calculateAIUsageCost` (新規)
- 月間使用回数・料金を計算
- billing_status: 'free' | 'payg' | 'capped'

```javascript
// 入力
{ user_id, feature_code }

// 出力
{
  used: 25,
  free_quota: 10,
  overage: 15,
  unit_price: 100,
  overage_cost: 1500,
  monthly_cap: 5000,
  total_cost: 1500,
  billing_status: 'payg'
}
```

#### `functions/recordAIUsageAndCharge` (新規)
- AIUsageLog に記録
- Stripe meter event を送信（月末自動課金）
- 月額上限に達した場合は status='capped'

```javascript
// 入力
{ feature_code, site_id }

// 出力
{
  status: 'logged' | 'charged' | 'capped',
  cost: 500,
  stripe_record_id: 'mev_xxx'
}
```

### Frontend Components

#### `PayAsYouGoIndicator`
使用状況・料金を可視化

```jsx
<PayAsYouGoIndicator
  used={25}
  freeQuota={10}
  unitPrice={100}
  monthlyCap={5000}
  monthlyReset="2026-05-01"
/>
```

表示内容:
- 無料枠ゲージ（10/10）
- 超過分（15回）
- 料金（¥1,500）
- 月額上限（¥5,000）

#### `usePayAsYouGoWarning` (Hook)
超過時にトースト通知

```jsx
const { isCost, cost, overage } = usePayAsYouGoWarning(payg);
```

#### `PayAsYouGoConfig`
管理画面で設定変更

```jsx
<PayAsYouGoConfig
  plan={plan}
  onUpdate={handleUpdate}
  loading={isLoading}
/>
```

---

## 統合ポイント

### AIPostGeneratorPanel

```javascript
const res = await base44.functions.invoke('generatePostWithAI', {...});

// aiGuard の payg 情報を取得
const { payg } = res.data;

// usePayAsYouGoWarning で警告表示
const { isCost, cost } = usePayAsYouGoWarning(payg);

// UI に PayAsYouGoIndicator を追加
<PayAsYouGoIndicator {...payg} />
```

### generatePostWithAI 終了後

```javascript
// 使用ログ記録 + Stripe meter event送信
await base44.functions.invoke('recordAIUsageAndCharge', {
  feature_code: 'ai_post_generation',
  site_id,
  prompt_type: 'blog'
});
```

---

## MasterPlanLimits での設定方法

1. プラン編集画面を開く
2. 「AI従量課金設定」セクションに移動
3. 設定項目を入力:
   - Pay as you go有効化: ON
   - 月間無料枠: 10回
   - 1回あたりの料金: ¥100
   - 月額上限料金: ¥5,000
4. 保存

シミュレーション表で料金を確認可能。

---

## Stripe 統計レポート

### 月末請求フロー

Stripe の [Usage-based billing](https://stripe.com/docs/billing/meter-billing) を使用：

1. `recordAIUsageAndCharge` が meter event を送信
   ```
   event_name: 'ai_usage_ai_post_generation'
   customer: subscription.external_subscription_id
   value: 1
   ```

2. Stripe が月末に自動計算・請求
   ```
   cost = overage * unit_price
   if (monthly_cap !== null) {
     cost = Math.min(cost, monthly_cap)
   }
   ```

3. インボイスに記載：
   ```
   AI Post Generation: 25 uses @ ¥100 = ¥2,500
   (Monthly cap: ¥5,000)
   ```

---

## 安全装置

### 1. 月額上限（monthly_cap_yen）

```javascript
if (monthly_cap !== null && cost > monthly_cap) {
  cost = monthly_cap  // 上限で打ち切り
}
```

ユーザーが予期せぬ高額請求から守られる。

### 2. 課金前通知

```javascript
toast.warning(`¥${cost} の課金が発生します`);
```

超過時に自動トースト通知。

### 3. AdminUI 監視

AIUsageLog で全ユーザーの使用状況を監視可能。

---

## 検証シナリオ

### シナリオ1: 無料枠内

```
free_quota = 10
used = 8
cost = 0
```

✅ 料金なし

### シナリオ2: 無料枠超過（上限なし）

```
free_quota = 10
unit_price = 100
used = 15
overage = 5
cost = 500
monthly_cap = null
```

✅ ¥500 課金

### シナリオ3: 月額上限到達

```
free_quota = 10
unit_price = 100
used = 60
overage = 50
cost_before_cap = 5000
monthly_cap = 5000
cost_final = 5000 (capped)
```

✅ ¥5,000 で打ち切り

### シナリオ4: 超過後も利用可能

- 無料枠に達しても利用可能
- ブロックなし
- 課金のみ発生

✅ 「使うほど売上が伸びるAI機能」を実現

---

## まとめ

- **透明性**: 無料枠・超過分・料金を常時表示
- **柔軟性**: 月額上限で予算管理可能
- **自動化**: 使用ログ記録 → Stripe 自動課金
- **ユーザー体験**: 超過後もブロックされず利用可（課金対象）