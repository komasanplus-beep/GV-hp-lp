# LP共通テーマシステム実装レポート

## 概要
LPのデザインをホームページの共通デザインシステムに統一しました。既存LPとの互換性を保ちながら、段階的な移行が可能な仕様になっています。

---

## 変更内容

### 1. 新規エンティティ

#### SiteTheme（entities/SiteTheme.json）
サイト全体の共通テーマ設定を管理
- `font_family_heading`, `font_family_body` - フォント設定
- `font_size_h1/h2/h3/body` - 文字サイズ
- `line_height_body` - 行間
- `section_spacing` - セクション間余白
- `container_width` - コンテナ最大幅
- `primary_color`, `accent_color`, `background_color` - 色設定
- `card_radius` - カードの丸み
- `button_style` - ボタンスタイル（solid/outline/ghost）
- `icon_style` - アイコンスタイル（circle/square/none）
- `apply_to_lp` - LPに自動適用するか

### 2. エンティティ更新

#### LandingPage（entities/LandingPage.json）
- `use_site_theme` (boolean, default: true) - サイト共通テーマを適用
- `custom_theme_overrides` (object) - LP個別のテーマ上書き設定

#### LPBlock（entities/LPBlock.json）
- `use_site_theme` (boolean, default: true) - ブロック単位でテーマを適用
- `style_variant_key` (string) - スタイル変種（dark/accent/minimalなど）
- `custom_styles` (object) - ブロック個別カスタムスタイル

---

## バックエンド関数

### getSiteTheme.js
**GET /api/get-site-theme?site_id=xxx**

テーマを取得、なければデフォルト作成

```javascript
// リクエスト
GET /api/get-site-theme?site_id=site_123

// レスポンス
{
  "theme": { ...SiteTheme },
  "created": false // 新規作成ならtrue
}
```

### updateSiteTheme.js
**PUT /api/update-site-theme**

テーマ設定を更新

```javascript
// リクエスト
PUT /api/update-site-theme
{
  "site_id": "site_123",
  "primary_color": "#0066FF",
  "font_size_h1": 36
}

// レスポンス
{
  "theme": { ...更新後のSiteTheme },
  "updated": true
}
```

### getLandingPageWithTheme.js
**GET /api/get-lp-with-theme?lp_id=xxx&site_id=xxx**

LP + ブロック + テーマを一括取得（公開側で使用）

```javascript
// レスポンス
{
  "lp": { ...LandingPage },
  "blocks": [ ...LPBlock[] ],
  "theme": { ...SiteTheme },
  "useTheme": true
}
```

### migrateExistingLPToTheme.js
**POST /api/migrate-lp-to-theme?site_id=xxx**

既存LPすべてに `use_site_theme=true` を付与（一度のみ）

```javascript
// レスポンス
{
  "migratedCount": 5 // 更新したLP数
}
```

---

## フロントエンド

### コンポーネント

#### LPThemePanel（components/lp/LPThemePanel.jsx）
LP編集画面に表示される共通テーマ設定パネル

- テーマのON/OFF切り替え
- 見出しサイズ、本文サイズ、行間の調整
- 色設定（主色、アクセント色）
- セクション間余白の調整
- ボタンスタイル選択
- リアルタイム更新

#### LPBlockRendererWithTheme（components/lp/LPBlockRendererWithTheme.jsx）
テーマを適用したブロックレンダラー

#### lpThemeRenderer（lib/lpThemeRenderer.js）
テーマ適用ロジック

- `generateThemeCSS()` - テーマからCSS変数を生成
- `applyBlockStyles()` - ブロック別のスタイル適用
- `getThemePreview()` - プレビュー用の簡潔なテーマ形式

#### lpThemeMigration（lib/lpThemeMigration.js）
移行ユーティリティ

- `migrateAllLPsInSite()` - 全LP移行
- `toggleLPThemeUsage()` - テーマ使用フラグ切り替え
- `initializeSiteTheme()` - テーマ初期化
- `syncHomepageThemeToLP()` - ホームページテーマをLP に反映
- `resetSiteThemeToDefault()` - デフォルトリセット

### ページ更新

#### AdminLPEditor（pages/AdminLPEditor.jsx）
- LPThemePanelを右パネルに追加
- テーマ設定の表示・編集が可能

#### LPView（pages/LPView.jsx）
- テーマを取得して公開側に適用
- `generateThemeCSS()` でCSS変数を注入
- ブロックレンダリング時にテーマを渡す

---

## デザイン統一

### 適用されるスタイル

#### 共通CSS変数
```css
:root {
  --lp-font-heading: var(from theme)
  --lp-font-body: var(from theme)
  --lp-size-h1/h2/h3: var(from theme)
  --lp-size-body: var(from theme)
  --lp-line-height: var(from theme)
  --lp-section-spacing: var(from theme)
  --lp-container-width: var(from theme)
  --lp-primary: var(from theme)
  --lp-accent: var(from theme)
  --lp-bg: var(from theme)
  --lp-card-radius: var(from theme)
}
```

#### ブロック別の標準スタイル
- **Hero** - 1.5倍セクション余白、最大幅
- **Feature/Benefit/Evidence** - 標準セクション余白、カード風
- **CTA/Contact** - アクセント色背景、白テキスト
- **その他** - 標準セクション余白

#### UI要素
- `.lp-button` - アクセント色、ホバーアニメーション
- `.lp-card` - 白背景、シャドウ、丸い角
- `.lp-feature-item` - 中央揃え、アイコンボックス
- `.lp-section` - セクション余白、最大幅

---

## 互換性・移行

### 既存LP
- `use_site_theme` デフォルト = `true`
- 既存LPは自動的に共通テーマを適用
- 移行後も `use_site_theme = false` で旧デザインに戻せる

### 旧LP専用デザイン廃止
- 新規LPは常に共通テーマベース
- 既存の簡易デザインは保持されるが、テーマ設定が優先される
- カスタムスタイルで個別デザインの差別化は可能

### データ整合性
- LPとブロックの両方に `use_site_theme` フラグ
- ブロック単位でテーマの適用ON/OFFが可能
- テーマ更新は全LP・全ブロックに波及

---

## 使用方法

### 管理者向け（ホームページ側）
1. SiteTheme設定を更新 → 全LPに反映
2. 色・サイズを編集 → 公開側がリアルタイム反映

### LP編集者向け
1. AdminLPEditorを開く
2. 右パネルの「共通テーマ設定」でON/OFF
3. 見出しサイズ、色、余白を調整
4. テーマ非使用にチェックを入れて旧デザインに戻す

### 公開側
- `/lp/:slug` で表示時にテーマが自動適用
- `getLandingPageWithTheme` でLP+テーマを一括取得

---

## 技術仕様

### ファイル構成

**エンティティ**
- `entities/SiteTheme.json` - 新規作成
- `entities/LandingPage.json` - 更新（use_site_theme, custom_theme_overrides追加）
- `entities/LPBlock.json` - 更新（use_site_theme, style_variant_key, custom_styles追加）

**バックエンド関数**
- `functions/getSiteTheme.js` - 新規作成
- `functions/updateSiteTheme.js` - 新規作成
- `functions/getLandingPageWithTheme.js` - 新規作成
- `functions/migrateExistingLPToTheme.js` - 新規作成

**フロントエンド**
- `components/lp/LPThemePanel.jsx` - 新規作成
- `components/lp/LPBlockRendererWithTheme.jsx` - 新規作成
- `lib/lpThemeRenderer.js` - 新規作成
- `lib/lpThemeMigration.js` - 新規作成
- `pages/AdminLPEditor.jsx` - 更新
- `pages/LPView.jsx` - 更新

---

## 未対応・今後の課題

1. **ホームページテーマとの自動同期** - 手動実装可能（syncHomepageThemeToLP）
2. **ブロック単位のスタイル変種** - style_variant_key構造は実装済み、UI未作成
3. **LPテンプレートのテーマプリセット** - テーマセット事前定義未実装
4. **ダークモード対応** - CSS変数構造は対応可、UIで未サポート

---

## 報告まとめ

✅ **変更したLP関連ページ**
- AdminLPEditor - テーマパネル追加
- LPView - テーマ取得・適用ロジック実装

✅ **変更した共通テーマ関連エンティティ**
- SiteTheme（新規）
- LandingPage（use_site_theme, custom_theme_overrides追加）
- LPBlock（use_site_theme, style_variant_key, custom_styles追加）

✅ **変更したAPI一覧**
- GET /api/get-site-theme?site_id=xxx
- PUT /api/update-site-theme
- GET /api/get-lp-with-theme?lp_id=xxx&site_id=xxx
- POST /api/migrate-lp-to-theme?site_id=xxx

✅ **既存LPとの互換対応**
- use_site_theme = true（デフォルト）で既存LPも自動適用
- use_site_theme = false でいつでも旧デザインに戻せる
- ブロック単位でも切り替え可能

✅ **ホームページ要素をLPへ流用**
- CSS変数システム（カラー、サイズ、余白）
- ボタンスタイル
- カードUI
- アイコンボックス
- セクション構造
- タイポグラフィルール

⚠️ **未対応部分**
- テーマプリセット定義（UI）
- ブロック単位のスタイル変種UI
- ホームページテーマとの自動双方向同期
- ダークモード完全サポート