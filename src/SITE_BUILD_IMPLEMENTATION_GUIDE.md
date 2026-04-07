# サイト構築機能 実装構造ガイド
**形式: 実務運用マニュアル | 対象: 開発者・管理者**

---

# 1. Site（サイト管理）

## 【役割】
各ユーザーの営業サイト情報を一元管理する最上位エンティティ。
複数ページ・複数ブロック・複数サービスを統括するコンテナ。

## 【正しい使い方】

```
1. Site 作成（初回）
   → AdminSiteList で「新しいサイトを作成」
   → site_name, business_type, status 設定
   
2. Site 設定管理
   → AdminSiteList で編集
   → navigation_config（ナビゲーション設定）
   → enabled_features（ブッキング・ブログなど）
   
3. Site 配下を管理
   → SitePage 作成（複数ページ）
   → SiteBlock 作成（ページごと）
   → Service 作成（サイト共通）
```

## 【データの正本】
**Site エンティティ**

```json
{
  "user_id": "ユーザーID",
  "site_name": "サイト名",
  "business_type": "hair_salon|beauty_salon|...",
  "status": "draft|published",
  "enabled_features": {
    "booking": true,
    "blog": true,
    "inquiry": true,
    "customer": true
  },
  "navigation_config": {
    "logo_url": "...",
    "site_name_text": "...",
    "booking_button_text": "ご予約",
    "booking_button_url": "#booking",
    "menu_items": [
      {
        "label": "About",
        "href": "#about",
        "sort_order": 0,
        "is_visible": true
      }
    ]
  }
}
```

## 【現在の実装】

**AdminSiteList.jsx**
- Site 一覧表示
- Site 作成・編集・削除
- Site から SitePage 管理へ遷移
- Site.navigation_config を管理 ✅

**SitePageManager.jsx**
- Site 選択ボタン（複数 Site 切り替え）
- query: `?site_id=xxx`

**SiteHeaderSettings.jsx**
- Site.navigation_config 編集 UI
- logo_url, site_name_text, menu_items, booking_button_* 編集

**SiteView (getSiteViewData function)**
- Site 取得 → site.navigation_config を読込
- ヘッダーレンダリング時に使用

## 【問題点】
✅ なし（正常機能中）

---

# 2. SitePage（ページ管理）

## 【役割】
Site 配下の複数ページを管理。
各ページに対して複数の SiteBlock を紐付ける。

## 【正しい使い方】

```
1. SitePage 作成
   → SitePageManager で「ページ追加」
   → title, slug, page_type (home|about|...|custom)
   
2. SitePage 編集
   → SitePageManager で「ページ編集」
   → title, slug 変更、status 公開設定
   
3. SitePage 配下のブロック管理
   → SitePageManager の「ブロック編集」
   → SiteBlockEditor へ遷移（page_id パラメータ）
```

## 【データの正本】
**SitePage エンティティ**

```json
{
  "site_id": "Site ID",
  "title": "ページタイトル",
  "slug": "page-slug",
  "page_type": "home|about|custom",
  "status": "draft|published",
  "sort_order": 0
}
```

## 【現在の実装】

**SitePageManager.jsx**
- SitePage 一覧表示 (site_id でフィルタ)
- SitePage CRUD UI
- 「ブロック編集」→ SiteBlockEditor へ遷移 (page_id)

**useQuery**
```javascript
base44.entities.SitePage.filter({ site_id: selectedSiteId }, 'sort_order')
```

## 【問題点】
✅ なし（正常機能中）

---

# 3. SiteBlock（セクション管理）

## 【役割】
各ページを構成する個別セクション。
ブロック単位でデータ・順序・アニメーション を管理。

## 【正しい使い方】

```
1. SiteBlock 追加
   → SiteBlockEditor で「ブロック追加」
   → block_type 選択 (Hero|About|Service|...)
   → sort_order は自動割当
   
2. SiteBlock 編集
   → SiteBlockEditor で該当ブロックの「編集」
   → SiteBlockEditForm で block.data 編集
   → animation_* も同時編集
   
3. SiteBlock 並び替え
   → SiteBlockEditor で上下矢印
   → sort_order 自動更新
   
4. SiteBlock 削除
   → SiteBlockEditor で削除ボタン
```

## 【データの正本】
**SiteBlock エンティティ + block.data**

```json
{
  "site_id": "Site ID",
  "page_id": "SitePage ID",
  "block_type": "Hero|About|Menu|Service|...",
  "sort_order": 0,
  "data": {
    // ← ブロック型ごとに異なる
    // Hero: headline, subheadline, image_url, cta_text, cta_url
    // About: title, body, image_url, tagline
    // Service: title, subtitle, layout_type, show_price, show_duration
    // Gallery: title, image_urls[]
    // Contact: title, body, address, phone, email, ...
  },
  "animation_type": "fade-up|slide-left|zoom-in|...",
  "animation_trigger": "on-load|on-scroll",
  "animation_delay": 0,
  "animation_duration": 600,
  "animation_once": true
}
```

## 【現在の実装】

**SiteBlockEditor.jsx**
- SiteBlock 一覧表示 (page_id でフィルタ, sort_order でソート)
- SiteBlock 追加・編集・削除・並び替え
- addBlockType で block_type 選択

**SiteBlockEditForm.jsx**
- block_type ごとのフィールド定義 (SITE_BLOCK_FIELDS)
- 各フィールドの input/textarea/image/checkbox UI

**useQuery + useMutation**
```javascript
// 取得
base44.entities.SiteBlock.filter({ page_id }, 'sort_order')

// 更新
base44.entities.SiteBlock.update(id, { data, animation_* })

// 削除
base44.entities.SiteBlock.delete(id)
```

**query invalidate (強化済み)**
```javascript
queryClient.invalidateQueries({ queryKey: ['siteBlocks'] });
queryClient.invalidateQueries({ queryKey: ['siteViewData'] });
queryClient.invalidateQueries({ queryKey: ['sitePage'] });
```

## 【問題点】
✅ なし（正常機能中）

---

# 4. Service（サービス管理）

## 【役割】
各サイトのサービス・メニュー・商品を一元管理。
複数ページの Service ブロック（またはMenu ブロック）から参照される正本。

## 【正しい使い方】

```
1. Service 作成
   → AdminServices で「新規サービス」
   → name, description, price, duration, image_url, status
   
2. Service 編集
   → AdminServices で該当サービスの「編集」
   → 各フィールド更新
   
3. Service 複数ページで表示
   → SiteBlock (type: Service) を複数ページに追加
   → SiteBlockRenderer が Service.filter({ site_id }) で自動取得
   → 複数ページで同じサービス一覧が表示される
```

## 【データの正本】
**Service エンティティ**

```json
{
  "site_id": "Site ID",
  "name": "サービス名",
  "description": "説明",
  "price": 5500,
  "duration": "60分",
  "image_url": "...",
  "status": "available|unavailable",
  "sort_order": 0
}
```

## 【現在の実装】

**AdminServices.jsx**
- Service 一覧表示 (site_id でフィルタ)
- Service CRUD UI
- 画像アップロード (base44.integrations.Core.UploadFile)

**SiteBlockRenderer.jsx の ServiceBlock コンポーネント**
```javascript
function ServiceBlock({ d, siteId }) {
  const { data: services = [] } = React.useQuery({
    queryKey: ['services', siteId],
    queryFn: () => siteId
      ? base44.entities.Service.filter({ site_id: siteId }, 'sort_order')
      : Promise.resolve([]),
  });
  
  // services を3列グリッドで表示
}
```

**SiteBlockType: Service が renderされるとき**
- `<SiteBlockRenderer block={{ block_type: "Service", site_id, data: {...} }} />`
- ServiceBlock コンポーネントが呼び出され
- Service.filter({ site_id }) で自動取得
- 画像・名前・価格を表示

## 【問題点】
✅ なし（正本一元化 & 複数ページ対応済み）

---

# 5. ServiceBlock（サービスブロック）と SiteBlock の関係

## 【役割】
"Service ブロック" は SiteBlock の一種。
ブロック内の d.data に見出し・レイアウト設定を持つ。
実データ（価格・説明）は Service エンティティから動的取得。

## 【正しい使い方】

```
1. ページにサービス一覧を追加
   → SiteBlockEditor で「ブロック追加」→ type: Service
   
2. Service ブロックを編集
   → SiteBlockEditor で「編集」
   → title, subtitle, layout_type, show_price, show_duration を設定
   → （実サービスはここで編集しない）
   
3. 実サービスを編集
   → AdminServices へ移動
   → name, price, description, image を編集
   → ブロックには手を入れない
```

## 【データの正本】

**表示設定の正本**: SiteBlock.data
```json
{
  "title": "サービス一覧",
  "subtitle": "当店で提供するサービス",
  "layout_type": "grid",
  "show_price": true,
  "show_duration": true
}
```

**サービス本体の正本**: Service エンティティ

## 【現在の実装】

**SiteBlockEditForm.jsx**
```javascript
Service: [
  { key: 'title', label: 'セクションタイトル', type: 'text' },
  { key: 'subtitle', label: 'サブタイトル', type: 'text' },
  { key: 'layout_type', label: 'レイアウト', type: 'text' },
  { key: 'show_price', label: '価格表示', type: 'checkbox' },
  { key: 'show_duration', label: '所要時間表示', type: 'checkbox' },
]
```

**補足メッセージ表示**
```
💡 サービス内容・価格・説明は「サービス管理」で編集してください。
ここは見出しと表示設定のみです。
```

## 【問題点】
✅ なし（正本明確化 & UI補足メッセージ追加済み）

---

# 6. ギャラリー

## 【役割】
Gallery ブロック内で複数の画像を配列で管理。
画像の追加・削除・順序変更をUI から実施。

## 【正しい使い方】

```
1. ページにギャラリーを追加
   → SiteBlockEditor で「ブロック追加」→ type: Gallery
   
2. 画像を追加
   → SiteBlockEditor で「編集」
   → 「画像を追加」ボタンで複数選択可
   → base44.integrations.Core.UploadFile で自動アップロード
   → image_urls[] に追加
   
3. 画像削除
   → 各画像の ✕ ボタン
   → image_urls[] から削除
   
4. 画像順序変更
   → （現在: ドラッグ未実装）
   → 削除→再追加で対応
```

## 【データの正本】
**SiteBlock.data.image_urls**

```json
{
  "title": "ギャラリー",
  "image_urls": [
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg",
    "https://example.com/img3.jpg"
  ]
}
```

## 【現在の実装】

**SiteBlockEditForm.jsx**
```javascript
{
  type: 'image_list',
  key: 'image_urls',
  label: '画像URL（1行: 1URL）'
}
```

**UI ロジック**
- 既存画像をサムネイル表示 (3列グリッド)
- 各画像に ✕ ボタン（削除機能）
- 「画像を追加」ボタン（アップロード）
- ファイル選択時に自動アップロード → image_urls に追加

**SiteBlockRenderer.jsx の Gallery**
```javascript
const imageUrls = Array.isArray(d.image_urls) ? d.image_urls.filter(Boolean) : [];
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  {imageUrls.map((url, i) => (
    <img key={i} src={url} alt="" ... />
  ))}
</div>
```

## 【問題点】
🟡 **ドラッグ&ドロップで順序変更できない**
  → UI上での並び替えは削除→再追加のみ
  → リスト内での sort_order 概念なし

## 【修正方針】
- @hello-pangea/dnd を使用して Gallery UI にドラッグ機能追加
- image_urls の順序を保持する機能追加

---

# 7. ヘッダー

## 【役割】
全ページの最上部に固定表示される navigation バー。
ロゴ・サイト名・メニュー・予約ボタン を表示。

## 【正しい使い方】

```
1. ヘッダー設定
   → SitePageManager の「ヘッダー設定」ボタン
   → SiteHeaderSettings へ遷移
   
2. ロゴ・サイト名設定
   → logo_url, site_name_text 編集
   
3. メニュー項目管理
   → menu_items 追加・編集・削除・並び替え
   → 個別に is_visible でON/OFF
   
4. 予約ボタン設定
   → booking_button_text, booking_button_url 編集
```

## 【データの正本】
**Site.navigation_config**

```json
{
  "logo_url": "https://...",
  "site_name_text": "サロン名",
  "booking_button_text": "ご予約",
  "booking_button_url": "#booking",
  "show_admin_link": false,
  "menu_items": [
    {
      "label": "About",
      "href": "#about",
      "sort_order": 0,
      "is_visible": true
    },
    {
      "label": "Services",
      "href": "#services",
      "sort_order": 1,
      "is_visible": true
    }
  ]
}
```

## 【現在の実装】

**SiteHeaderSettings.jsx**
- Site.navigation_config 編集 UI
- ロゴURL / サイト名テキスト 入力
- menu_items の追加・編集・削除・上下移動
- 予約ボタンテキスト・URL設定

**SiteView.jsx**
```javascript
const navConfig = site?.navigation_config || {};
const menuItems = navConfig.menu_items?.filter(m => m.is_visible) || [];
const logoUrl = navConfig.logo_url || site?.logo_url;
const siteName = navConfig.site_name_text || site?.site_name || 'Site';

// ナビゲーション描画
<nav>
  {logoUrl ? <img src={logoUrl} /> : <span>{siteName}</span>}
  {menuItems.map(item => <a href={item.href}>{item.label}</a>)}
  <a href={bookingUrl}>{bookingText}</a>
</nav>
```

## 【問題点】
🔴 **モバイルメニュー（ハンバーガー）が未実装**
  → モバイルでナビが折りたたまれない
  → 600px以下で使いにくい

## 【修正方針】
- SiteView の Navbar に hamburger menu 実装
- モバイルブレークポイント (md:) を適用
- Sidebar / Drawer コンポーネント使用

---

# 8. フッター

## 【役割】
全ページの最下部に表示される著作権表記・会社情報領域。

## 【正しい使い方】

```
（現在: 編集UI なし）
→ 硬コードのため、ユーザーが変更できない
```

## 【データの正本】
**SiteView.jsx 硬コード**

```jsx
<footer className="bg-stone-900 text-stone-500 text-center py-6 text-xs">
  © {new Date().getFullYear()} {site?.site_name || 'Site'}. All rights reserved.
</footer>
```

## 【現在の実装】
- site_name のみ動的
- 年号は自動更新（getFullYear()）
- 説明文「All rights reserved」は硬コード

## 【問題点】
🔴 **フッターテキストが硬コード**
  → ユーザーが著作権表記を変更できない
  → カスタム説明文を追加できない

## 【修正方針】
- Site に footer_config フィールド追加
```json
{
  "copyright_text": "© 2026 ○○サロン. All rights reserved.",
  "footer_links": [
    { "label": "プライバシー", "href": "/privacy" },
    { "label": "利用規約", "href": "/terms" }
  ]
}
```
- SiteHeaderSettings で footer_config 編集 UI
- SiteView.jsx で footer_config から動的描画

---

# 9. ナビメニュー

## 【役割】
ページセクション へのアンカーリンク、または外部ページリンク を提供。

## 【正しい使い方】

```
1. メニュー項目追加
   → SiteHeaderSettings で「追加」ボタン
   → label (表示テキスト), href (リンク先) 入力
   
2. メニュー項目リンク先指定
   → href の形式:
      - アンカー: #about, #services (同一ページ)
      - 相対: /page-slug (別ページ)
      - 外部: https://example.com
   
3. メニュー非表示
   → is_visible チェック OFF
   → ナビに表示されない（削除と異なる）
   
4. メニュー順序変更
   → 上下矢印で並び替え
   → sort_order 自動更新
```

## 【データの正本】
**Site.navigation_config.menu_items**

## 【現在の実装】

**SiteHeaderSettings.jsx**
```javascript
{
  label: 'About',
  href: '#about',
  sort_order: 0,
  is_visible: true
}
```

**SiteView.jsx**
```javascript
const menuItems = navConfig.menu_items?.filter(m => m.is_visible) || [];
{menuItems.length > 0
  ? menuItems.map(item => (
      <a key={item.label} href={item.href}>{item.label}</a>
    ))
  : (
      <a href="#about">About</a>
      // ... フォールバックメニュー
    )
}
```

## 【問題点】
✅ なし（正常機能中）

---

# 10. プレビュー（SiteView）

## 【役割】
Site の公開ビュー。
全 SiteBlock を順序通りに表示し、リアルタイム確認可能。

## 【正しい使い方】

```
1. プレビューを開く
   → SitePageManager 或いは SiteBlockEditor で「プレビュー」ボタン
   → `/site/{siteId}?preview=true` へ遷移
   
2. 編集を加えたら自動反映
   → SiteBlockEditor で data 更新
   → プレビューが自動リフレッシュ
   → query invalidate により getSiteViewData 再取得
   
3. 公開状態を確認
   → /site/{siteId} へアクセス
   → Site.status === 'published' の場合のみ表示
```

## 【データの正本】
**複合（複数source）**
- Site (site_name, navigation_config, status, enabled_features)
- SitePage (home ページ)
- SiteBlock (sort_order でソート)
- Service (SiteBlock type:Service で参照)
- SEO metadata (LPSeoData)

## 【現在の実装】

**SiteView.jsx**
```javascript
function SiteViewInner({ siteId, isPreview }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['siteViewData', siteId, isPreview],
    queryFn: () => base44.functions.invoke('getSiteViewData', {
      site_id: siteId,
      preview: isPreview
    }),
    retry: false,
  });
  
  const { site, homePage, blocks, seo } = data || {};
}
```

**getSiteViewData function (backend)**
1. user 認証チェック
2. Site 取得 (status チェック, preview flag処理)
3. SitePage (page_type: home) 取得
4. SiteBlock 取得 & sort_order でソート
5. SEO データ (LPSeoData) 取得
6. JSON 返却

**プレビュー表示フロー**
```
SitePageManager の「プレビュー」
    ↓
/site/{siteId}?preview=true
    ↓
SiteView component
    ↓
getSiteViewData function 呼び出し
    ↓
Site / SitePage / SiteBlock / Service 取得
    ↓
SiteBlockRenderer で各ブロック描画
```

## 【問題点】
✅ なし（正常機能中）

**ただし: query invalidate が強力なため、複数 query が同時無効化される**
- 効果: プレビューが確実にリアルタイム更新
- 代償: 大量編集時に network request が増加
- 対策: 現在のコストは許容範囲内

---

# 最終まとめ

## 1. 正本データ一覧（絶対に1つに統一）

| データ | 正本エンティティ | 役割 |
|--------|-----------------|------|
| ユーザーのサイト基本情報 | **Site** | site_name, business_type, status |
| ナビゲーション（ロゴ・メニュー・予約ボタン） | **Site.navigation_config** | header の全て |
| ページ情報 | **SitePage** | page_name, slug, page_type, status |
| ページセクション | **SiteBlock** | block_type, data, animation_* |
| Service ブロック内容 | **SiteBlock.data** | title, subtitle, layout_setting |
| サービス本体（名前・価格・説明） | **Service** | name, price, description, image_url |
| ギャラリー画像 | **SiteBlock.data.image_urls** | []で管理 |
| コンタクト情報 | **SiteBlock.data** (type: Contact) | address, phone, email |
| 予約フォーム内容 | **SiteBlock.data** (type: Booking) | title, body, button_text |
| フッター | **硬コード** | year + site_name |
| プレビュー | **getSiteViewData** (複合取得) | Site+SitePage+SiteBlock+Service |

## 2. 二重管理になっている箇所

### 🟡 Service / ServiceBlock データ

**現状:**
- ServiceBlock (SiteBlock.data) に title, subtitle, layout設定
- Service エンティティに name, price, description

**問題:**
- ServiceBlock.data にも name, price を持たせたら二重管理になる
- 現在は正しく分離されている ✅

**確認:**
SiteBlockEditForm の Service セクション:
```javascript
Service: [
  { key: 'title', label: 'セクションタイトル', type: 'text' },
  { key: 'subtitle', label: 'サブタイトル', type: 'text' },
  { key: 'layout_type', label: 'レイアウト', type: 'text' },
  { key: 'show_price', label: '価格表示', type: 'checkbox' },
  // ↑ ここに name, price がない ✅
]
```

→ **二重管理なし** ✅

## 3. 固定コードのまま残っている箇所

| 要素 | 場所 | 理由 | 対応予定 |
|------|------|------|---------|
| **フッター著作権表記** | SiteView.jsx | 管理用エンティティなし | Site.footer_config 追加予定 |
| **モバイルメニュー** | SiteView.jsx Navbar | hamburger 未実装 | mobile drawer 実装予定 |

---

## 4. 今すぐ修正すべき TOP 5

| 優先度 | 項目 | 現状 | 対策 | 工数 |
|--------|------|------|------|------|
| 🚨1 | **モバイルナビメニュー** | md:flex のみで mobile ハンバーガーなし | SiteView に Drawer コンポーネント + toggle | 2h |
| 🚨2 | **フッター編集 UI** | 硬コード "All rights reserved" | Site.footer_config 追加 + SiteHeaderSettings UI | 2h |
| ⭐3 | **Gallery ドラッグ順序変更** | UI上で順序変更不可 | @hello-pangea/dnd 統合 | 1.5h |
| ⭐4 | **SEO メタタグ設定** | LPSeoData あるが Site/SitePage 対応なし | LPSeoData 拡張 or Site.seo_config | 2h |
| ⭐5 | **Service 詳細ページ** | Service の個別 URL ページなし | /service/{id} ルート + 詳細 UI | 3h |

---

## 5. 修正後の理想構造図

```
┌─────────────────────────────────────────────────────────┐
│                         Site                             │
├─────────────────────────────────────────────────────────┤
│ · site_name, business_type, status                      │
│ · navigation_config  ← ロゴ・メニュー・予約ボタン        │
│ · footer_config      ← フッター設定（新規）             │
│ · seo_config         ← メタタグ設定（拡張）            │
│ · enabled_features   ← ブッキング・ブログ・etc        │
└─────────────────────────────────────────────────────────┘
          ↓ (1 Site : N Pages)
┌─────────────────────────────────────────────────────────┐
│                      SitePage                            │
├─────────────────────────────────────────────────────────┤
│ · title, slug, page_type, status, sort_order           │
└─────────────────────────────────────────────────────────┘
          ↓ (1 Page : N Blocks, sort_order)
┌─────────────────────────────────────────────────────────┐
│                     SiteBlock                            │
├─────────────────────────────────────────────────────────┤
│ · block_type (Hero, About, Service, Gallery, ...)      │
│ · data: {                                               │
│     // 表示設定・見出しのみ                             │
│   }                                                      │
│ · animation_type, animation_trigger, animation_delay   │
└─────────────────────────────────────────────────────────┘
          ↓ (type: Service) ┌─────────────────┐
          │                 │   Service       │
          └───────────→ ├─────────────────┤
                        │ · name          │
                        │ · price         │
                        │ · description   │
                        │ · image_url     │
                        │ · sort_order    │
                        └─────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     SiteView                             │
│ (getSiteViewData function で複合取得)                   │
├─────────────────────────────────────────────────────────┤
│ 1. Site 取得                                            │
│ 2. SitePage (home) 取得                                │
│ 3. SiteBlock 取得 (sort_order ソート)                 │
│ 4. Service 取得 (SiteBlock type:Service 向け)         │
│ 5. SEO 取得                                             │
│ ↓                                                       │
│ SiteView component で描画                              │
│ · Navbar (Site.navigation_config)                       │
│ · SiteBlockRenderer 各型 + SiteBlock.animation_*        │
│ · Footer (Site.footer_config)                           │
└─────────────────────────────────────────────────────────┘

UI 管理画面
├─ AdminSiteList           : Site 一覧・新規作成
├─ SitePageManager         : SitePage 一覧・CRUD
├─ SiteHeaderSettings      : Site.navigation_config 編集 ✅
├─ SiteBlockEditor         : SiteBlock 一覧・CRUD・並び替え
├─ SiteBlockEditForm       : SiteBlock.data & animation_* 編集
├─ AdminServices           : Service 一覧・CRUD
└─ SiteFooterSettings      : Site.footer_config 編集（新規）
```

---

## 運用フロー

```
【初期セットアップ】
1. AdminSiteList で Site 作成
   → site_name, business_type 入力
2. SitePageManager で SitePage 作成
   → home, about, contact etc.
3. SiteHeaderSettings で navigation_config 設定
   → logo_url, menu_items, booking_button

【コンテンツ作成】
4. SiteBlockEditor で SiteBlock 追加
   → type 選択 (Hero, About, Service, Gallery, etc.)
5. 各ブロック編集
   → SiteBlockEditForm で data & animation 設定
   → Service ブロックの場合: AdminServices で service本体も入力
6. プレビューで確認
   → /site/{siteId}?preview=true

【公開】
7. Site status を "published" に変更
   → /site/{siteId} で公開
``