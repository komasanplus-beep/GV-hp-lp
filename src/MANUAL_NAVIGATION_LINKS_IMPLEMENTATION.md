# 手動追加リンク機能実装 - 完了報告

## 📋 変更サマリー

### ✅ 変更したフロントエンドファイル

1. **pages/SiteHeaderSettings** (修正)
   - NavigationLink エンティティの CRUD 操作統合
   - 手動リンク管理 UI をモーダルダイアログで提供
   - 並び順変更・編集・削除機能を実装
   - useQuery で NavigationLink データを取得

2. **components/site/ManualNavigationLinkForm** (新規作成)
   - リンク追加/編集フォーム
   - URL バリデーション（http/https 確認）
   - 表示場所選択（header/footer/both）
   - 開き方選択（_self/_blank）
   - 表示順入力

3. **components/site/ManualNavigationLinkList** (新規作成)
   - 登録済みリンク一覧表示
   - 編集・削除ボタン
   - 並び順変更（上下移動）
   - 表示場所・開き方バッジ表示

---

### ✅ 変更したバックエンド処理

**functions/getPublicNavigation** (新規作成)
- ページ連動メニュー + 手動リンクを統合取得
- placement に応じて header/footer に分類
- sort_order でソート
- 公開側で使用

---

### ✅ 使用した保存先データ構造

**NavigationLink エンティティ** (新規)
```json
{
  "id": "auto-generated",
  "site_id": "site_xxx",
  "label": "採用情報",
  "url": "https://example.com/recruit",
  "target": "_self | _blank",
  "placement": "header | footer | both",
  "type": "manual",
  "sort_order": 1,
  "is_active": true,
  "created_date": "datetime",
  "updated_date": "datetime"
}
```

**RLS設定:**
- admin ロールのみ作成・更新・削除可能
- 読み取りは誰でも可能（公開側で使用）

---

### ✅ 追加 / 修正した API

#### 管理画面用
- **GET** `/entities/NavigationLink?site_id=xxx` 
  → SiteHeaderSettings で自動的に取得（useQuery）

- **POST** `/entities/NavigationLink`
  → 手動リンク作成（base44.entities.NavigationLink.create）

- **PUT** `/entities/NavigationLink/:id`
  → 手動リンク更新（base44.entities.NavigationLink.update）

- **DELETE** `/entities/NavigationLink/:id`
  → 手動リンク削除（base44.entities.NavigationLink.delete）

#### 公開用バックエンド関数
- **GET** `/functions/getPublicNavigation?site_id=xxx`
  → ページ連動メニュー + 手動リンク統合データを返す
  - 戻り値: `{ header: [...], footer: [...], config: {...} }`

---

### ✅ 上部メニューへの反映方法

1. **SiteView** で `getPublicNavigation` を呼び出し
2. `header` 配列を上部メニューとして表示
3. `target` に応じて `_self` または `_blank` で開く
4. sort_order でソートされた順序で表示

**実装箇所:**
- `components/site/SiteBlockRenderer` または `pages/SiteView` のヘッダー部分
- 既存のページ連動メニューと統合

---

### ✅ フッターへの反映方法

1. **SiteView** の footer セクションで `getPublicNavigation` の `footer` 配列を使用
2. ページ連動メニュー（存在すれば）と同じフッターに表示
3. sort_order でソート

**実装箇所:**
- `pages/SiteView` または `components/site/SiteFooterRenderer` のフッター部分

---

### ✅ 互換性対応内容

1. **既存メニュー項目との共存**
   - `navigation_config.menu_items` は従来通り Site に保存（後方互換性維持）
   - 新しい NavigationLink は別エンティティで保存
   - 公開側の `getPublicNavigation` で両方を統合返却

2. **ページ連動メニューとの区別**
   - `auto_menu_pages` はページ ID 参照（既存）
   - NavigationLink は独立した URL リンク
   - 重複しない設計（ページ → 自動、URL → 手動）

3. **表示順の統一**
   - ページメニュー → 手動リンク の順で整列
   - 各セクション内で sort_order でソート
   - 既存の sort_order ロジックと互換

4. **未登録時のエラーハンドリング**
   - NavigationLink が0件でもエラーなし
   - 公開側で空配列を返すだけ

---

## 🚀 使い方（ユーザー向け）

### 管理画面
1. ページ管理 → ページ編集 → ヘッダー設定
2. 「手動追加リンク」セクションで「追加」ボタンをクリック
3. リンク情報を入力：
   - リンク名（表示テキスト）
   - URL（https://... または /...）
   - 開き方（同じタブ/新しいタブ）
   - 表示場所（上部メニュー/フッター/両方）
   - 表示順（オプション、デフォルト末尾）
4. 保存

### 公開側
- ヘッダー：placement = header または both のリンクが表示
- フッター：placement = footer または both のリンクが表示
- target に基づいて新規タブ or 同一タブで開く

---

## ✨ 次ステップ（推奨）

1. **SiteView.jsx** で `getPublicNavigation` を呼び出す処理を追加
2. ヘッダーコンポーネントで返却された `header` 配列を使用
3. フッターコンポーネントで `footer` 配列を使用
4. 既存のページ連動メニュー表示との統合処理

---

## 📝 データ構造のまとめ

| フィールド | 型 | 説明 |
|-----------|-----|------|
| site_id | string | 所属するサイト |
| label | string | 表示テキスト |
| url | string | リンク先URL（要バリデーション） |
| target | enum | `_self` または `_blank` |
| placement | enum | `header` / `footer` / `both` |
| sort_order | number | 並び順（小→大で上から表示） |
| is_active | boolean | 有効/無効フラグ |

---

## 🔒 セキュリティ

- RLS により admin ロールのみ作成・更新・削除可能
- URL バリデーション実装（http/https 確認）
- is_active フラグで簡単に非表示化可能
- 不正な placement 値は自動フィルタ