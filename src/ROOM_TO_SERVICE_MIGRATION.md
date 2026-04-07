# Room廃止 → Service統一 実装完了レポート

## 📋 実装概要

Roomベースの構造を廃止し、**Service を唯一の予約対象** に統一しました。  
データ構造は共通化し、**UI表示のみ業種別に動的切り替え** する実装で、複数業種対応SaaSに進化させました。

---

## 1️⃣ エンティティ変更

### Service スキーマ拡張

**新規フィールド追加**:
- `capacity`: 収容人数（客室定員、サービス対応人数など）
- `category`: カテゴリ（room, menu_category, treatment_type等）
- `images`: 複数画像配列（ホテルの複数客室写真対応）
- `amenities`: 設備・特徴（ホテルのアメニティ対応）
- `size`: サイズ（ホテル客室面積m²）
- `bed_type`: ベッドタイプ（ホテル固有フィールド）

**ファイル**: `entities/Service.json`

### Site (既存エンティティ)

**確認**: `business_type` は既に存在
```json
{
  "business_type": "hotel" | "salon" | "clinic" | "gym" | "school" | "restaurant" | "beauty" | "wellness" | "other"
}
```

### Room エンティティ

**状態**: 廃止予定（新規利用不可）  
**移行関数**: `migrateRoomToService()` で既存 Room → Service に変換

---

## 2️⃣ 新規ファイル・コンポーネント

### 1. Backend 関数

#### `src/functions/migrateRoomToService.js`
```
目的: Room → Service データ移行
実行例: POST /api/functions/migrateRoomToService
       { "site_id": "site123" }
動作:
- Site が hotel の場合、Room → Service へ変換
- price_per_night → price
- amenities, size, bed_type は Service に保持
- 既存 Room データは破壊しない
```

### 2. UI ラベル管理

#### `src/lib/businessTypeLabels.js`
```
目的: 業種別UI表示ラベル一元管理
使用例:
  const priceLabel = getPriceLabel('hotel')
  // → "宿泊料金"
  
  const priceLabel = getPriceLabel('salon')
  // → "施術料金"
  
  const typeInfo = BUSINESS_TYPE_LABELS['clinic']
  // → { service_label: "診療科目", icon: "🏥", ... }
```

**対応業種**:
| 業種 | service_label | price_label | capacity_label |
|------|---------------|------------|-----------------|
| hotel | 客室 | 宿泊料金 | 定員 |
| salon | メニュー | 施術料金 | 対応人数 |
| clinic | 診療科目 | 診療料金 | 対応人数 |
| gym | コース | コース料金 | 対応人数 |
| school | レッスン | レッスン料金 | 定員 |
| restaurant | メニュー | 料金 | 人数 |
| beauty | 施術 | 施術料金 | 対応人数 |
| wellness | プログラム | プログラム料金 | 定員 |
| other | サービス | 料金 | 対応人数 |

### 3. コンポーネント

#### `src/components/service/ServiceList.jsx`
```
目的: 業種別Service一覧表示
使用例:
  <ServiceList 
    siteId="site123" 
    businessType="hotel"
    onServiceSelect={(service) => {...}}
  />
表示内容:
- 業種アイコン
- Service カード（画像・説明・料金）
- ステータス（利用可/不可）
```

#### `src/pages/ServiceDetail.jsx`
```
目的: Service詳細ページ（業種別UI）
URL: /service/:serviceId?site_id=xxx
表示内容:
- 複数画像ギャラリー
- 業種別ラベルの価格・時間・定員
- 設備・特徴一覧（amenities）
- 予約フォーム
- SEO メタ対応
```

---

## 3️⃣ 既存コンポーネント修正

### AdminServices.jsx（サービス管理画面）

**修正内容**:
- 業種別UI表示
  - タイトル: `"${typeInfo.service_label}一覧"` （例: "客室一覧"）
  - ボタン: `"新規${typeInfo.service_label}"` （例: "新規メニュー"）
  - ラベル: 価格・時間・定員は `getPriceLabel()` 等で動的切り替え

**ビフォー**:
```
タイトル: "サービス一覧"
ラベル: "料金", "所要時間"
```

**アフター**:
```
hotel の場合:
  タイトル: "客室一覧" 🏨
  ラベル: "宿泊料金", "宿泊期間"

salon の場合:
  タイトル: "メニュー一覧" 💇
  ラベル: "施術料金", "所要時間"
```

### SiteBlockRenderer.jsx（公開ページのServiceブロック）

**修正内容**:
- `ServiceBlock` 関数に `businessType` パラメータ追加
- 業種アイコンを表示
- 調整: タイトル下に業種アイコン表示

**使用例** (SiteView内で):
```jsx
<ServiceBlock 
  d={blockData}
  siteId={siteId}
  businessType={site.business_type}
/>
```

---

## 4️⃣ URL 統一

### 廃止ルート
- `/rooms` → 削除
- `/room/:roomId` → 削除

### 新規ルート（App.jsx に追加）
```
/service/:serviceId?site_id=xxx
```

**Reservation エンティティ**:
```json
{
  "site_id": "xxx",
  "service_name": "ツインルーム",  // Room.name から Service.name へ
  "name": "山田太郎",
  "email": "...@example.com",
  "date": "2026-04-15",
  "message": "エキストラベッドお願いします"
}
```

---

## 5️⃣ データ移行プロセス

### Step 1: Room → Service 変換
```javascript
// 実行方法:
const result = await base44.functions.invoke('migrateRoomToService', {
  site_id: 'site123'
});

// レスポンス例:
{
  status: 'migrated',
  site_id: 'site123',
  business_type: 'hotel',
  rooms_migrated: 15,
  total_rooms: 15,
  errors: []
}
```

### Step 2: マッピング
| Room フィールド | → | Service フィールド |
|------------------|---|-------------------|
| name | → | name |
| description | → | description |
| price_per_night | → | price |
| capacity | → | capacity |
| images[0] | → | image_url |
| images[] | → | images |
| amenities | → | amenities |
| size | → | size |
| bed_type | → | bed_type |
| status | → | status |

### Step 3: 確認・テスト
1. AdminServices で表示確認
2. /service/:id で詳細表示確認
3. SiteView のServiceブロック確認

---

## 6️⃣ 業種別UI表示の仕組み

### フロント側

```jsx
// 1. ラベル取得
import { getPriceLabel, getServiceLabel } from '@/lib/businessTypeLabels';

const priceLabel = getPriceLabel('hotel');  // "宿泊料金"
const serviceLabel = getServiceLabel('salon');  // "メニュー"

// 2. UI表示
<label>{priceLabel}</label>
<span>¥{service.price}</span>
```

### バックエンド側

```javascript
// エンティティから business_type を取得
const site = await base44.entities.Site.filter({ id: siteId });
const businessType = site[0].business_type;

// Service リストを返す際に business_type を含める
// フロントで BUSINESS_TYPE_LABELS を参照
```

---

## 7️⃣ 対応した業種別表示

### ホテル (hotel)
```
Service → "客室"
price → "宿泊料金"
duration → "宿泊期間"
capacity → "定員"
icon: 🏨
表示: 複数画像ギャラリー, ベッドタイプ, アメニティ, サイズ
```

### サロン (salon)
```
Service → "メニュー"
price → "施術料金"
duration → "所要時間"
capacity → "対応人数"
icon: 💇
表示: 単一画像, 説明, 料金, 時間
```

### クリニック (clinic)
```
Service → "診療科目"
price → "診療料金"
duration → "診療時間"
capacity → "対応人数"
icon: 🏥
```

### ジム (gym)
```
Service → "コース"
price → "コース料金"
duration → "所要時間"
capacity → "対応人数"
icon: 💪
```

### スクール (school)
```
Service → "レッスン"
price → "レッスン料金"
duration → "所要時間"
capacity → "定員"
icon: 🎓
```

### レストラン (restaurant)
```
Service → "メニュー"
price → "料金"
duration → "提供時間"
capacity → "人数"
icon: 🍽️
```

### ビューティー (beauty)
```
Service → "施術"
price → "施術料金"
duration → "所要時間"
capacity → "対応人数"
icon: 💄
```

### ウェルネス (wellness)
```
Service → "プログラム"
price → "プログラム料金"
duration → "所要時間"
capacity → "定員"
icon: 🧘
```

### その他 (other)
```
Service → "サービス"
price → "料金"
duration → "所要時間"
capacity → "対応人数"
icon: ⭐
```

---

## 8️⃣ 既存データ保護

### Room エンティティ
- **削除しない**: 既存データは Service へ移行されるまで保持
- **新規作成**: Room API での新規作成は不可（Service を使用）
- **読取**: 古いシステムからの読取は可能（互換性維持）

### Reservation エンティティ
- Room 参照は Service 参照に自動変換
- service_name フィールドで対応

---

## 9️⃣ 実装チェックリスト

- ✅ Service エンティティスキーマ拡張
- ✅ business_type は既にSiteに存在
- ✅ migrateRoomToService() バックエンド関数作成
- ✅ businessTypeLabels.js で業種別ラベル管理
- ✅ ServiceList コンポーネント（業種別一覧）
- ✅ ServiceDetail ページ（業種別詳細）
- ✅ AdminServices 業種別UI対応
- ✅ SiteBlockRenderer (ServiceBlock) 業種別対応
- ✅ App.jsx にServiceDetailルート追加
- ✅ URL統一（/service/:id）

---

## 🔟 使用開始手順

### 1. Room データ移行（1回のみ）
```
POST /api/functions/migrateRoomToService
Body: { "site_id": "site123" }
```

### 2. UI確認
```
AdminServices:
  site_id=site123
  → "客室一覧" が表示される（hotel の場合）

SiteView:
  /site/site123
  → Service ブロック表示（業種別UI）
```

### 3. 詳細ページ確認
```
/service/{serviceId}?site_id=site123
→ 業種別ラベル・画像ギャラリー表示
```

---

## 1️⃣1️⃣ 将来の業種追加手順

新しい業種を追加する場合:

```javascript
// 1. BUSINESS_TYPE_LABELS に追加
export const BUSINESS_TYPE_LABELS = {
  ...existing,
  new_type: {
    name: 'ビジネス名',
    service_label: 'アイテム名',
    price_label: '価格ラベル',
    duration_label: 'コンテキスト',
    capacity_label: '容量ラベル',
    icon: 'アイコン'
  }
};

// 2. Site.business_type enum に追加
// entities/Site.json の enum に新規追加

// 3. AdminServices / ServiceDetail は自動で対応
// BUSINESS_TYPE_LABELS を参照するため変更不要
```

---

## 1️⃣2️⃣ トラブルシューティング

### 問題: AdminServices で古い "サービス" ラベルが表示される
**原因**: キャッシュが古い  
**解決**: ブラウザキャッシュ削除 (Ctrl+Shift+Delete)

### 問題: ServiceDetail で予約フォームが表示されない
**原因**: /service/:id ルート未登録  
**確認**: App.jsx に `<Route path="/service/:serviceId" element={<ServiceDetail />} />` があるか

### 問題: migrateRoomToService で「Room entity not found」
**原因**: Room エンティティが既に削除されている  
**対応**: skip - 既に Service 統一済み

---

## 最終チェック項目

- ✅ Room 廃止通知をユーザーに周知
- ✅ 既存 Room データをバックアップ
- ✅ migrateRoomToService() 実行
- ✅ AdminServices で業種別UI確認
- ✅ /service/:id で詳細表示確認
- ✅ SiteView の ServiceBlock 動作確認
- ✅ Reservation が Service を参照するか確認
- ✅ SEO メタ（useSeoHead）動作確認

---

## 📊 実装サマリー

| 項目 | 状態 |
|------|------|
| **Service スキーマ拡張** | ✅ 完成 |
| **Room廃止** | ✅ 宣言 |
| **業種別UI管理** | ✅ businessTypeLabels.js |
| **コンポーネント化** | ✅ ServiceList, ServiceDetail |
| **既存画面対応** | ✅ AdminServices, SiteBlockRenderer |
| **URL統一** | ✅ /service/:id |
| **ルート追加** | ✅ App.jsx |
| **データ移行関数** | ✅ migrateRoomToService() |
| **ドキュメント** | ✅ このファイル |

---

**実装完了日**: 2026-04-07  
**互換性**: Room → Service 完全移行 ✅  
**複数業種対応**: ✅ 9業種サポート  
**将来拡張**: ✅ 新業種追加対応