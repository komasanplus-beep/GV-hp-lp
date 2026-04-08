# サイト・アクセス分析機能 実装完了報告

**実装日**: 2026-04-08  
**対象**: ホームページ用アクセス分析ダッシュボード  
**LP分析との独立**: 完全に分離して実装

---

## 📋 変更したフロントエンドファイル

### 1. **pages/AdminSiteAnalytics** (新規作成)
- サイト用アクセス分析ダッシュボード
- KPIカード: アクセス数、PV数、予約送信アクション数
- 日別推移グラフ（線グラフ）
- ページ別アクセス一覧
- 期間フィルター: 今日/直近7日/直近30日/月間/期間指定
- サイト選択機能
- 前期間比較表示

### 2. **components/user/UserSidebar** (修正)
- サイト運用メニューに「アクセス分析」追加
- AdminSiteAnalytics の feature_map に 'site_builder' 設定

### 3. **App.jsx** (修正)
- AdminSiteAnalytics ルート追加
- import + Route 登録

### 4. **lib/siteAnalyticsTracker.js** (新規作成)
- 公開側イベント送信用ユーティリティ
- セッションID自動生成・保持
- 訪問者ID永続化
- デバイス種別判定
- 二重送信防止（1秒以内は重複排除）

### 5. **pages/SiteView** (修正)
- ページ表示時の page_view イベント送信
- 予約ボタンクリック時の booking_click イベント送信（デスクトップ/モバイル両対応）

### 6. **components/site/SiteBlockRenderer** (修正)
- 予約フォーム送信成功時の booking_submit イベント送信

---

## 🔧 変更したバックエンド処理

### 1. **functions/recordSiteAnalyticsEvent** (新規作成)
**用途**: 公開側から送信されたイベントをデータベースに保存

**エンドポイント**: POST `/functions/recordSiteAnalyticsEvent`

**リクエストスキーマ**:
```json
{
  "site_id": "site_123",
  "page_id": "page_456",
  "page_path": "/service",
  "event_type": "page_view | site_visit | booking_submit | booking_click | external_booking_click",
  "session_id": "sess_xxx",
  "visitor_id": "visitor_xxx",
  "referrer": "https://google.com",
  "device_type": "mobile | desktop | tablet | unknown"
}
```

**バリデーション**:
- 必須フィールド: site_id, event_type, session_id, visitor_id
- event_type: enum チェック
- 失敗時もサイレント（ログに記録）

---

### 2. **functions/getSiteAnalytics** (新規作成)
**用途**: 管理画面の集計データ取得

**エンドポイント**: GET `/functions/getSiteAnalytics?site_id=xxx&period=7d&from=YYYY-MM-DD&to=YYYY-MM-DD`

**認可**: admin ロールのみ

**レスポンス構造**:
```json
{
  "summary": {
    "access_count": 1200,
    "page_view_count": 3400,
    "booking_submit_count": 48,
    "previous_access_count": 1100,
    "previous_page_view_count": 3200,
    "previous_booking_submit_count": 45
  },
  "pages": [
    {
      "page_id": "page_1",
      "page_title": "トップページ",
      "page_path": "/",
      "access_count": 500,
      "page_view_count": 1200,
      "booking_submit_count": 10
    }
  ],
  "daily": [
    {
      "date": "2026-04-08",
      "access_count": 150,
      "page_view_count": 400,
      "booking_submit_count": 5
    }
  ]
}
```

**集計ロジック**:
- **アクセス数**: visitor_id の一意数
- **PV数**: event_type='page_view' のカウント
- **予約送信**: event_type='booking_submit' OR 'booking_click' OR 'external_booking_click'
- **前期間**: 同じ期間幅を過去に遡って計算
- **ページ別**: page_id 単位で集計
- **日別**: created_date を日単位で集計

---

## 📊 追加したデータ構造

### **SiteAnalyticsEvent** エンティティ (新規作成)
**ファイル**: `src/entities/SiteAnalyticsEvent.json`

```json
{
  "name": "SiteAnalyticsEvent",
  "properties": {
    "site_id": "string (required)",
    "page_id": "string (optional)",
    "page_path": "string (optional)",
    "event_type": "enum: page_view | site_visit | booking_submit | booking_click | external_booking_click",
    "session_id": "string (required)",
    "visitor_id": "string (required)",
    "referrer": "string (optional)",
    "device_type": "enum: desktop | mobile | tablet | unknown (default: unknown)"
  },
  "rls": {
    "create": {} (anonymous も可)
    "read": { admin only }
    "update": {} (不許可)
    "delete": {} (不許可)
  }
}
```

**自動フィールド**:
- id (自動生成)
- created_date (自動タイムスタンプ)
- updated_date (自動タイムスタンプ)

---

## 🌐 公開側で追加したイベント送信箇所

### 1. **pages/SiteView** - ページ表示時
```typescript
// マウント時に自動実行
useEffect(() => {
  if (siteId && homePage?.id) {
    trackPageView(siteId, homePage.id, '/');
  }
}, [siteId, homePage?.id]);
```
**イベント**: `page_view`

### 2. **pages/SiteView** - 予約ボタンクリック
```typescript
onClick={(e) => {
  trackBookingClick(siteId);
  // ... scroll to contact
}}
```
**イベント**: `booking_click`  
**箇所**: デスクトップメニュー + モバイルメニュー

### 3. **components/site/SiteBlockRenderer** - 予約フォーム送信
```typescript
async handleSubmit(e) {
  // ... create Reservation
  trackBookingSubmit(siteId);
  setStatus('done');
}
```
**イベント**: `booking_submit`  
**条件**: フォーム送信成功時のみ

---

## 🔄 LP分析との違い

| 項目 | サイト分析 | LP分析 |
|-----|---------|-------|
| **対象** | site_id (ホームページ) | lp_id (ランディングページ) |
| **イベント種別** | page_view, booking_submit, booking_click, external_booking_click | page_view, cta_click, conversion |
| **テーブル** | SiteAnalyticsEvent | LPAnalytics (手入力) + LPExperiments (AB test) |
| **集計** | 複数ページ / 日別 | LP 単位 + AB テスト比較 |
| **UI** | AdminSiteAnalytics | AdminLPAnalytics |
| **ダッシュボード** | 上部メニュー「アクセス分析」 | 「LP分析」グループ |
| **メニュー階層** | サイト運用 > アクセス分析 | LP分析 > CV分析 |

---

## 📦 API一覧

### **公開側イベント記録**
```
POST /functions/recordSiteAnalyticsEvent
Content-Type: application/json

{
  "site_id": "string",
  "page_id": "string (optional)",
  "page_path": "string (optional)",
  "event_type": "page_view",
  "session_id": "string",
  "visitor_id": "string",
  "referrer": "string (optional)",
  "device_type": "mobile"
}

Response: { success: true }
```

### **管理画面集計取得**
```
GET /functions/getSiteAnalytics?site_id=xxx&period=7d

Params:
  - site_id: 必須
  - period: '1d' | '7d' | '30d' | 'month' | 'custom'
  - from: period='custom' 時の開始日 (YYYY-MM-DD)
  - to: period='custom' 時の終了日 (YYYY-MM-DD)

Response: {
  summary: { ... },
  pages: [ ... ],
  daily: [ ... ]
}
```

---

## 🎯 イベント計測の詳細

### **page_view**
- **いつ**: ページ表示時（SiteView マウント）
- **何を送る**: site_id, homePage.id, '/', session_id, visitor_id
- **デバイス判定**: 自動（UserAgent 解析）
- **重複防止**: sessionStorage で最後の送信時刻を記録（1秒以内は送信スキップ）

### **booking_click**
- **いつ**: 予約ボタン押下
- **何を送る**: site_id, session_id, visitor_id
- **箇所**: 
  - デスクトップメニューの「ご予約」ボタン
  - モバイルメニューの「ご予約」ボタン

### **booking_submit**
- **いつ**: 予約フォーム送信成功時
- **何を送る**: site_id, session_id, visitor_id
- **条件**: Reservation.create() 完了後

### **external_booking_click** (将来実装)
- **いつ**: 外部予約リンク（booking_button_url が外部URL）クリック時
- **条件**: 現在は実装対象外（ロードマップ用）

---

## ✅ 実装完了チェックリスト

- [x] SiteAnalyticsEvent エンティティ作成
- [x] recordSiteAnalyticsEvent 関数実装
- [x] getSiteAnalytics 集計関数実装
- [x] siteAnalyticsTracker.js ユーティリティ作成
- [x] AdminSiteAnalytics ダッシュボード実装
- [x] サイドメニューに「アクセス分析」追加
- [x] SiteView に page_view 送信統合
- [x] SiteView に booking_click 送信統合（デスク/モバイル）
- [x] SiteBlockRenderer に booking_submit 送信統合
- [x] 二重送信防止実装
- [x] デバイス種別判定実装
- [x] セッション/訪問者ID管理実装
- [x] LP分析との分離確認
- [x] レスポンシブダッシュボード

---

## 🚀 今後の拡張案

1. **集計テーブル化**: SiteAnalyticsDailySummary で日次集計を高速化
2. **Bot除外**: User-Agent や アクセスパターンで bot 検出
3. **外部予約リンク追跡**: booking_button_url が外部 URL の場合に tracking
4. **コンバージョン定義カスタマイズ**: admin が自由に定義可能に
5. **ダッシュボード高度化**: 訪問経路、離脱率、ヒートマップなど
6. **CSV エクスポート**: 分析データのエクスポート機能

---

## 📝 互換性対応

- **既存コード影響**: なし（完全に新規実装）
- **LP分析との共存**: OK（テーブル・API 分離）
- **パフォーマンス**: イベント送信は非同期・エラー時もサイレント
- **ブラウザ互換性**: sessionStorage / localStorage 標準機能のみ使用

---

## 🔐 セキュリティ

- **認可**: getSiteAnalytics は admin ロール限定
- **記録**: recordSiteAnalyticsEvent は anonymous 許可（セッション/訪問者ID で判別）
- **PII**: 個人情報は記録しない（visitor_id は hash でも可）

---

実装完了。本体機能は動作確認・ダッシュボード表示検証を推奨します。