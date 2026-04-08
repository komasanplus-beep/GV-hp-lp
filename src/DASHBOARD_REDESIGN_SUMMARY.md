# ダッシュボード再構成 実装完了報告

**実装日**: 2026-04-08  
**対象**: ユーザーダッシュボードのKPI表示、フォントサイズ、アクセス分析統合

---

## 📋 変更したフロントエンドファイル

### 1. **components/dashboard/KPICard** (修正)
**フォントサイズ・間隔引き上げ**

変更内容：
- ラベル: `text-xs` → `text-sm` (フォント拡大)
- ラベル色: `text-slate-500` → `text-slate-600 font-semibold` (濃く、ウェイト強化)
- ラベル下マージン: `mb-1` → `mb-2` (間隔増加)
- 数値: `text-2xl` → `text-3xl` (大幅拡大)
- ユニット: `text-sm` → `text-base` (拡大)
- ユニット左マージン: `ml-1` → `ml-2` (間隔増加)
- パッド: `p-4` → `p-5` (全体余白拡大)
- 下部マージン: `mb-3` → `mb-4` (間隔増加)
- 補足文字: `text-xs` → `text-sm` (拡大)
- 補足テキスト色: `text-slate-500` → `text-slate-600` (濃化)
- Icon サイズ: `w-5 h-5` → `w-6 h-6` (拡大)

**結果**: 数値と説明文がバランスよく、小さすぎる補足テキストが解決

---

### 2. **components/dashboard/KPISection** (大幅修正)
**KPI順序再構成 + アクセス分析統合 + UI改善**

#### KPI表示順の変更:
**旧順序**:
1. 予約
2. 売上
3. 顧客
4. AI生成
5. ストレージ

**新順序** (アクセス分析を先頭に):
1. **アクセス** (新)
2. **ページビュー** (新)
3. **予約送信** (旧「予約」を意味明確化)
4. 売上
5. 顧客
6. AI生成
7. ストレージ

#### 構造変更:
- アクセス分析概要バナーを追加（グラデーション indigo）
- バナーに「アクセス分析」画面へのリンク付与
- グリッド構造: `lg:grid-cols-5` → `lg:grid-cols-4` (レイアウト最適化)
- 全体ギャップ: `gap-3` → `gap-4` (間隔増加)

#### 新規イベント種別の取得:
- `summary.analytics.access_today` - 今日のアクセス数
- `summary.analytics.access_monthly` - 今月のアクセス数
- `summary.analytics.page_view_today` - 今日のPV
- `summary.analytics.page_view_monthly` - 今月のPV
- `summary.analytics.booking_action_today` - 今日の予約送信
- `summary.analytics.booking_action_monthly` - 今月の予約送信

**結果**: 予約が過度に強調されていない均等配置に改善、アクセス分析が強調される

---

### 3. **pages/UserDashboard** (修正)
**ようこそエリアのフォントサイズ引き上げ**

変更内容：
- セクション見出し: `text-lg` → `text-xl` (拡大)
- セクション見出しマージン: `mb-3` → `mb-4` (間隔増加)
- ラベル文字: `text-xs` → `text-sm font-medium` (拡大、ウェイト追加)
- ラベル下マージン: `mb-1` → `mb-2` (間隔増加)
- 数値: `text-xl` → `text-2xl` (拡大)
- 補足文字: `text-xs` → `text-sm` (拡大)
- 補足文字上マージン: (新規追加) `mt-1`
- パッド: `p-5` → `p-6` (全体余白拡大)
- グリッドギャップ: `gap-4` → `gap-6` (間隔増加)

**結果**: 「上限: ∞」などの小さすぎるテキストが見やすいサイズに改善

---

## 🔧 変更したバックエンド処理

### **functions/getDashboardSummary** (大幅拡張)
**アクセス分析データ集計の追加**

#### 新規データ取得:
```javascript
const analyticsEvents = base44.entities.SiteAnalyticsEvent.list(...)
```
- SiteAnalyticsEvent から直近10,000件を取得

#### 新規集計ロジック:

**アクセス数（訪問者数）**:
```
accessToday = Set(visitor_id) where event_type='page_view' and date>=today
accessMonthly = Set(visitor_id) where event_type='page_view' and date in this month
```

**ページビュー数**:
```
pageViewToday = count(event_type='page_view' and date>=today)
pageViewMonthly = count(event_type='page_view' and date in this month)
```

**予約送信アクション数**:
```
bookingActionToday = count(event_type in ['booking_submit', 'booking_click'] and date>=today)
bookingActionMonthly = count(event_type in ['booking_submit', 'booking_click'] and date in this month)
```

#### レスポンス拡張:
```json
{
  "analytics": {
    "access_today": <int>,
    "access_monthly": <int>,
    "page_view_today": <int>,
    "page_view_monthly": <int>,
    "booking_action_today": <int>,
    "booking_action_monthly": <int>
  }
}
```

**備考**: 既存フィールド (booking, sales, guests, ai_usage, storage, site_usage) は変更なし

---

## 📊 修正内容サマリー

### フォントサイズ調整内容

| 対象 | 旧 | 新 | 理由 |
|-----|----|----|------|
| KPIカード ラベル | text-xs | text-sm | 読みやすさ向上 |
| KPIカード 数値 | text-2xl | text-3xl | インパクト強化 |
| KPIカード 補足 | text-xs | text-sm | 小さすぎた改善 |
| ようこそ ラベル | text-xs | text-sm | 読みやすさ向上 |
| ようこそ 見出し | text-lg | text-xl | 階層感強化 |
| ようこそ 数値 | text-xl | text-2xl | バランス改善 |

### 予約表示の整理内容

| 項目 | 旧表示 | 新表示 | 変更理由 |
|-----|--------|--------|---------|
| KPI順序 | 第1位（先頭） | 第3位 | 均等配置 |
| ラベル | 「予約」 | 「予約送信」 | 意味明確化 |
| 説明 | モーダルなし | なし | 予約送信行動に統一 |
| 隣接KPI | 売上と離離 | アクセス・PVの後 | 分析流れを改善 |

---

## 🔗 整合性対応内容

### 公開側との接続
- **既存イベント**: page_view, booking_click, booking_submit が既に公開側で記録される仕様を確認済み
- **新規イベント**: SiteAnalyticsEvent テーブルに格納される
- **集計タイミング**: ダッシュボード読み込み時にリアルタイム集計

### ダッシュボード・アクセス分析画面との互換性
- アクセス分析概要バナーから「AdminSiteAnalytics」へリンク
- 使用アイコン: BarChart3, TrendingUp （recharts 使用）
- 集計方法を AdminSiteAnalytics 関数と同一ロジックで統一

### メニュー側の対応
- UserSidebar に AdminSiteAnalytics は既にマッピング済み
- ラベル: 「アクセス分析」で統一
- feature_map: site_builder に設定済み

---

## ✅ 実装完了チェックリスト

- [x] KPICard フォント引き上げ
- [x] KPISection KPI順序変更
- [x] KPISection アクセス分析バナー追加
- [x] KPISection グリッド最適化
- [x] UserDashboard ようこそエリア フォント拡大
- [x] getDashboardSummary 分析データ追加
- [x] analytics 集計ロジック実装
- [x] 日付フィルター（today / monthly）実装
- [x] visitor_id 一意化（Set 使用）
- [x] 補足テキスト可読性改善
- [x] UI全体のバランス修正
- [x] メニュー側の確認（既に対応）

---

## 🌐 API設計

### ダッシュボード集計API
```
GET /functions/getDashboardSummary

Response:
{
  "booking": { "today": 0, "monthly": 0 },
  "sales": { "today": 0, "monthly": 0 },
  "guests": { "total": 0, "monthly_new": 0 },
  "ai_usage": { "used": 0, "limit": 0 },
  "storage": { "used": 0, "limit": 0 },
  "site_usage": { 
    "site_used": 0, "site_limit": 0,
    "lp_used": 0, "lp_limit": 0,
    "published_site": 0, "published_lp": 0
  },
  "analytics": {
    "access_today": 0,
    "access_monthly": 0,
    "page_view_today": 0,
    "page_view_monthly": 0,
    "booking_action_today": 0,
    "booking_action_monthly": 0
  }
}
```

---

## 📝 注意点・互換性

- **予約機能**: 削除されていない、ラベル変更と順序変更のみ
- **既存データ**: Booking / Sales テーブルは変更なし
- **パフォーマンス**: SiteAnalyticsEvent 10,000件読み込み（月間数千件規模なら問題なし）
- **フォントサイズ**: 全デバイス（モバイル/タブレット/PC）で響応的に対応
- **色分け**: 既存のカラースキーム（indigo/cyan/blue/emerald/purple/amber）を維持

---

## 🚀 将来拡張案

1. **集計テーブル化**: DailyAnalyticsSummary で日次集計キャッシュ化
2. **Bot除外**: User-Agent フィルタリング
3. **ユーザーセグメント**: アクセス元別（organic/direct/referrer）
4. **ファネル分析**: page_view → booking_click → booking_submit
5. **カスタムレポート**: ユーザー定義の期間/指標

---

実装完了。ダッシュボードは予約に偏った表示から、アクセス分析を含めた均等配置に改善されました。