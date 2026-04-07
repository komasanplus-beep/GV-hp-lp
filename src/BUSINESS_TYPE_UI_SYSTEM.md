# 業種別UI自動切替システム 実装レポート

## 📋 実装概要

Siteの `business_type` に応じてUI・ラベル・レイアウト・ナビゲーション・アニメーションを自動切替するシステムを実装しました。

**データ構造は統一** (Service)、**UIのみ業種別に動的切替** する設計で、将来の業種追加にも対応できます。

---

## 🎯 対応業種 (9業種)

| 業種 | icon | service_label | price_label | layout | style |
|------|------|---------------|------------|--------|-------|
| **hotel** | 🏨 | 客室 | 宿泊料金 | グリッド (lg:3列) | 高級・serif |
| **salon** | 💇 | メニュー | 施術料金 | リスト | シンプル |
| **clinic** | 🏥 | 診療科目 | 診療料金 | グリッド (lg:3列) | プロ感 |
| **gym** | 💪 | コース | コース料金 | グリッド (lg:3列) | ダイナミック |
| **school** | 🎓 | レッスン | レッスン料金 | グリッド (lg:3列) | ライト |
| **restaurant** | 🍽️ | メニュー | 料金 | グリッド (lg:3列) | 高級・serif |
| **beauty** | 💄 | 施術 | 施術料金 | グリッド (lg:3列) | シンプル |
| **wellness** | 🧘 | プログラム | プログラム料金 | グリッド (lg:3列) | 穏やか |
| **other** | ⭐ | サービス | 料金 | グリッド (lg:3列) | デフォルト |

---

## 📂 ファイル構成

### 1. **uiConfig.js** (中核)
```
src/lib/uiConfig.js
```

**機能**:
- `UI_CONFIGS`: 業種別設定の一元管理
- `getUIConfig(businessType)`: 設定を取得
- `getNavItems(businessType)`: ナビゲーション項目
- `getTemplateBlocks(businessType)`: デフォルトブロック構成
- `getAnimationPreset(businessType)`: アニメーション設定
- `getAccentColorClass(businessType)`: アクセント色

**設定内容**:
```javascript
{
  name: 'ホテル',
  icon: '🏨',
  service_label: '客室',
  price_label: '宿泊料金',
  duration_label: '宿泊期間',
  capacity_label: '定員',
  layout: { // グリッド列数・カード高さなど
    service_grid: 'lg:grid-cols-3',
    service_card_height: 'h-80',
    ...
  },
  style: { // 色・フォント・デザイン
    accent_color: 'amber-600',
    font_serif: true,
    luxury_design: true,
  },
  nav_items: ['Rooms', 'Facilities', 'Gallery', 'Contact'],
  animation_preset: 'luxury',
  default_blocks: ['Hero', 'About', 'Rooms', 'Facilities', ...],
}
```

### 2. **businessTypeTheme.js**
```
src/lib/businessTypeTheme.js
```

**機能**:
- `THEME_COLORS`: カラースキーム定義
- `getThemeColors(businessType)`: 色を取得
- `generateThemeCSS(businessType)`: CSS 変数生成

**カラー管理**:
```javascript
{
  primary: '#D97706',     // メインカラー
  secondary: '#92400E',   // サブカラー
  accent: '#FBBF24',      // アクセント
  background: '#FFFBEB',  // 背景
  text: '#1F2937',        // テキスト
  border: '#FCD34D',      // ボーダー
}
```

### 3. **ServiceListByType.jsx**
```
src/components/service/ServiceListByType.jsx
```

**機能**:
- 業種別Service一覧表示
- hotel: グリッド・高級デザイン
- salon: リスト型・シンプル
- その他: デフォルトグリッド

**ロジック**:
```jsx
if (businessType === 'hotel') {
  // グリッド表示・高級デザイン
  // 画像・説明・料金
} else if (businessType === 'salon') {
  // リスト表示・シンプルデザイン
  // 横並びレイアウト
} else {
  // デフォルトグリッド
}
```

### 4. **uiConfigUtils.js**
```
src/lib/uiConfigUtils.js
```

**ユーティリティ関数**:
- `getServiceDisplayType(businessType)`: 表示方式取得
- `getNavigationConfig(businessType)`: ナビゲーション設定
- `getBlockLayoutConfig(businessType)`: ブロックレイアウト
- `getStyleConfig(businessType)`: スタイル設定
- `getCompleteTheme(businessType)`: 完全テーマ取得
- `generateDefaultNavigationItems(businessType)`: デフォルトナビゲーション生成

---

## 🔄 UI差分

### Hotel vs Salon 比較

**Hotel**:
```
┌─────────────────────────────┐
│        客室 🏨              │  ← アイコン表示
│                             │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │ 画像 │ │ 画像 │ │ 画像 │ │  ← グリッド (3列)
│ │      │ │      │ │      │ │
│ │ Twin │ │Double│ │Suite │ │  ← 客室名
│ │説明説│ │説明説│ │説明説│ │  ← 説明テキスト
│ │¥50K  │ │¥80K  │ │¥150K │ │  ← 宿泊料金
│ └──────┘ └──────┘ └──────┘ │
└─────────────────────────────┘
レイアウト: グリッド (3列)
スタイル: 高級・serif フォント
ホバー: scale-105・shadow 増加
```

**Salon**:
```
┌────────────────────────┐
│    メニュー 💇        │  ← アイコン表示
│                        │
│  [img] カット          │
│        説明説          │  ← リスト1
│        60分 ¥5,000     │
│                        │
│  [img] パーマ          │
│        説明説          │  ← リスト2
│        90分 ¥8,000     │
│                        │
│  [img] カラー          │
│        説明説          │  ← リスト3
│        120分 ¥10,000   │
│                        │
└────────────────────────┘
レイアウト: リスト (縦並び)
スタイル: シンプル・sans-serif
ホバー: bg-rose-50 変更
```

---

## 💻 コンポーネント修正

### SiteBlockRenderer.jsx
**修正内容**:
- `ServiceBlock` で `getUIConfig()` を使用
- `ServiceListByType` を呼び出し
- ビジネスタイプに応じたアイコン表示

```jsx
else if (type === 'Service') {
  const config = getUIConfig(block.business_type || 'other');
  content = (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        {d.title && <h2>{d.title}</h2>}
        <p className="text-center text-slate-500 mb-10">
          {config.icon}  ← 業種アイコン
        </p>
        <ServiceListByType 
          siteId={block.site_id} 
          businessType={block.business_type}  ← 業種型を渡す
        />
      </div>
    </section>
  );
}
```

### ServiceListByType.jsx
**ロジック**:
```jsx
if (businessType === 'hotel') {
  // グリッド表示・高級デザイン
  return <div className={cn('grid gap-6', 'lg:grid-cols-3')}>{...}</div>;
}

if (businessType === 'salon') {
  // リスト型
  return <div className="space-y-3">{...}</div>;
}

// デフォルト
return <div className={cn('grid gap-4', 'lg:grid-cols-3')}>{...}</div>;
```

---

## 🎨 アニメーション設定

### ANIMATION_PRESETS

```javascript
{
  luxury: {        // hotel, restaurant
    type: 'fade-in',
    duration: 800ms,
    delay: 100ms,
  },
  light: {         // salon, school, beauty
    type: 'fade-up',
    duration: 600ms,
    delay: 0ms,
  },
  professional: {  // clinic
    type: 'fade-in',
    duration: 700ms,
    delay: 50ms,
  },
  dynamic: {       // gym
    type: 'zoom-in',
    duration: 700ms,
    delay: 100ms,
  },
  calm: {          // wellness
    type: 'fade-up',
    duration: 800ms,
    delay: 100ms,
  },
}
```

---

## 🚀 使用方法

### 1. SiteView で業種を自動取得
```jsx
const site = data?.site;
const businessType = site.business_type; // 'hotel' | 'salon' | ...

// SiteBlockRenderer に渡す
<SiteBlockRenderer 
  block={{ ...block, business_type: businessType }}
/>
```

### 2. コンポーネントで設定取得
```jsx
import { getUIConfig, getThemeColors } from '@/lib/uiConfig';
import { getCompleteTheme } from '@/lib/uiConfigUtils';

const config = getUIConfig('hotel');
console.log(config.service_label);  // '客室'

const theme = getCompleteTheme('salon');
console.log(theme.colors);  // { primary: '#EC4899', ... }
```

### 3. 新しい業種を追加
```javascript
// uiConfig.js の UI_CONFIGS に追加
export const UI_CONFIGS = {
  ...existing,
  new_type: {
    name: 'ビジネス名',
    icon: 'アイコン',
    service_label: 'アイテム名',
    // ... 他の設定
  },
};

// Site.json の business_type enum に追加
"enum": ["hotel", "salon", ..., "new_type"]
```

---

## ✨ 実装済み機能

### ✅ 完成項目
- [x] UI_CONFIGS 一元管理
- [x] getUIConfig() 関数群
- [x] 業種別ラベル管理
- [x] レイアウト設定 (グリッド・リスト)
- [x] スタイル設定 (色・フォント・デザイン)
- [x] アニメーション設定
- [x] ServiceListByType コンポーネント
- [x] SiteBlockRenderer 修正
- [x] テーマカラー管理
- [x] ユーティリティ関数群

### 🔧 今後拡張可能
- [ ] フロント画面での business_type 選択UI
- [ ] Site作成時のテンプレート自動生成
- [ ] 業種別デフォルトナビゲーション自動生成
- [ ] カスタムアニメーション設定UI

---

## 📊 実装チェックリスト

| 項目 | 状態 |
|------|------|
| **uiConfig.js** | ✅ 完成 |
| **businessTypeTheme.js** | ✅ 完成 |
| **ServiceListByType.jsx** | ✅ 完成 |
| **uiConfigUtils.js** | ✅ 完成 |
| **SiteBlockRenderer 修正** | ✅ 完成 |
| **ラベル管理** | ✅ 完成 |
| **レイアウト管理** | ✅ 完成 |
| **アニメーション管理** | ✅ 完成 |
| **テーマカラー管理** | ✅ 完成 |
| **9業種対応** | ✅ 完成 |

---

## 🎬 プレビュー結果

### Hotel サイト
```
✅ グリッド表示 (3列)
✅ 高級デザイン・serif フォント
✅ 宿泊料金ラベル
✅ luxury アニメーション
✅ amber-600 アクセント色
```

### Salon サイト
```
✅ リスト表示
✅ シンプルデザイン・sans-serif
✅ 施術料金・時間ラベル
✅ light アニメーション
✅ rose-500 アクセント色
```

### Clinic サイト
```
✅ グリッド表示 (3列)
✅ プロフェッショナル・sans-serif
✅ 診療料金ラベル
✅ professional アニメーション
✅ blue-600 アクセント色
```

---

## 📝 使用コンポーネント

- ✅ ServiceListByType (新規)
- ✅ SiteBlockRenderer (修正)
- 既存: Link, useQuery, Loader2, cn

---

## 🔗 参照ファイル

- `src/lib/uiConfig.js` - メイン設定
- `src/lib/businessTypeTheme.js` - カラースキーム
- `src/lib/uiConfigUtils.js` - ユーティリティ
- `src/components/service/ServiceListByType.jsx` - UI表示
- `src/components/site/SiteBlockRenderer.jsx` - 統合

---

**実装完了日**: 2026-04-07  
**対応業種**: 9種類 (hotel, salon, clinic, gym, school, restaurant, beauty, wellness, other)  
**ステータス**: ✅ 本番対応