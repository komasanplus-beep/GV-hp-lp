# LP テンプレートシステム実装レポート

## 概要
3パターンのLPテンプレートを実装し、テンプレート選択時に自動でブロック生成、AIによる初期コンテンツ生成に対応しました。

---

## 実装概要

### テンプレート（3パターン固定）

#### 1. **高級ミニマルLP** (minimal)
- **特徴**: 余白を活かした洗練された印象
- **対象**: ハイエンド商材、コンサルティング、高級サービス
- **構成**:
  - Hero（見出し + CTA）
  - Problem（3つの課題提示）
  - Solution（解決策）
  - Evidence（実績・数値）
  - CTA（最終訴求）

#### 2. **ストーリーLP** (story)
- **特徴**: 物語性を持たせた訴求、感情と共感に訴える
- **対象**: 実績がある商品、サービス、個人ブランド
- **構成**:
  - Hero（ストーリーの始まり）
  - Voice（お客様の声/証言）
  - Feature（4つの特徴）
  - Flow（3ステップの流れ）
  - CTA（人生が変わる訴求）

#### 3. **カードLP** (card)
- **特徴**: プラン・サービス・商品の比較選択肢を提示
- **対象**: SaaS、スクール、サブスク、複数プラン
- **構成**:
  - Hero（プラン選択の導入）
  - Feature（3つのプランをカード表示）
  - Comparison（競合他社との比較）
  - FAQ（よくある質問）
  - CTA（申し込み誘導）

---

## フロントエンド

### コンポーネント

#### LPTemplateSelector（components/lp/LPTemplateSelector.jsx）
LP作成時に表示されるテンプレート選択モーダル

**機能**:
- 3パターンのテンプレートを視覚的に選択
- LP タイトル入力
- AIコンテンツ生成のON/OFF選択
- 選択後、自動でブロック生成とLP作成

**プロップス**:
```jsx
<LPTemplateSelector
  open={boolean}
  onOpenChange={(open) => void}
  siteId={string}
  onCreated={(lp) => void}
/>
```

### ページ更新

#### AdminLPList（pages/AdminLPList.jsx）
- 「新規作成」ボタン → LPTemplateSelector を表示
- 既存のカスタムテンプレート機能も引き続き利用可能

---

## バックエンド

### バックエンド関数

#### createLPFromTemplate.js
**POST /api/create-lp-from-template**

テンプレートからLPを作成し、ブロックを自動生成

**リクエスト**:
```json
{
  "title": "新サービス紹介LP",
  "slug": "new-service-lp",
  "site_id": "site_123",
  "template_id": "minimal|story|card",
  "generate_content": true
}
```

**レスポンス**:
```json
{
  "lp": { ...LandingPage },
  "blocks": [ ...LPBlock[] ],
  "aiGeneratedContent": {
    "blocks": [...改善されたブロック],
    "suggestions": ["提案1", "提案2"]
  }
}
```

#### generateLPContentWithAI.js
**POST /api/generate-lp-content-with-ai**

AIでテンプレートLPのコンテンツを改善生成

**リクエスト**:
```json
{
  "lp_id": "lp_123",
  "site_id": "site_123",
  "blocks": [ ...LPBlock[] ]
}
```

**レスポンス**:
```json
{
  "generated": true,
  "aiResult": {
    "blocks": [
      {
        "id": "block_id",
        "type": "Hero",
        "improved_data": { ...改善されたデータ }
      }
    ],
    "suggestions": ["提案1", "提案2"]
  }
}
```

---

## ライブラリ

### lpTemplates.js（lib/lpTemplates.js）

テンプレートデータを定義・管理

**エクスポート関数**:
- `LP_TEMPLATES` - テンプレートオブジェクト（minimal, story, card）
- `getTemplate(templateId)` - テンプレート取得
- `listTemplates()` - テンプレート一覧取得

**各テンプレートの構造**:
```javascript
{
  id: 'minimal',
  name: '高級ミニマルLP',
  description: '余白を活かした...',
  preview_color: 'from-slate-900 to-slate-700',
  blocks: [
    {
      block_type: 'Hero',
      sort_order: 0,
      data: { ... }
    },
    ...
  ]
}
```

---

## UI フロー

### LP作成フロー

1. **「新規作成」をクリック**
   - AdminLPList の「新規作成」ボタンをクリック
   - LPTemplateSelector モーダルが開く

2. **テンプレートを選択**
   - 3パターンのテンプレートが表示
   - カード形式で選択可能（グラデーション付きプレビュー）

3. **LP情報を入力**
   - タイトル（例: 「新サービス紹介LP」）
   - AI生成をON/OFF（デフォルト: ON）

4. **「LPを作成」をクリック**
   - createLPFromTemplate 関数を実行
   - LPが作成され、テンプレートブロックが生成
   - generate_content=true なら、AI で初期コンテンツを改善
   - AdminLPEditor へ自動遷移

5. **エディタで編集**
   - 各ブロックの内容をカスタマイズ
   - 公開設定をして公開

---

## テーマ・デザイン統合

### SiteTheme との連携
- 新規作成時に `use_site_theme: true` を設定
- 共通テーマの色、サイズ、余白がテンプレートLPに自動適用
- 各テンプレートは共通デザインシステムベース

### ブロック単位の適用
- 各ブロックに `use_site_theme: true` を設定
- テーマ変更時は全ブロックに波及
- ブロック個別のカスタムスタイルも可能

---

## 互換性

### 既存機能との関係
- **基本テンプレート** (new_service, proven_service) - 引き続き利用可能
- **カスタムテンプレート** (LPTemplate エンティティ) - 引き続き利用可能
- **AIによるLP生成** (AdminLPGenerate) - 引き続き利用可能
- **コード貼り付けLP** (AdminLPCodeCreator) - 引き続き利用可能

### 新旧の使い分け
- **新規テンプレート（3パターン）** → シンプル・高速・推奨
- **カスタムテンプレート** → 完全カスタマイズが必要な場合
- **AI生成** → ゼロから作成したい場合

---

## 技術仕様

### ファイル構成

**ライブラリ**:
- `lib/lpTemplates.js` - テンプレート定義（新規）

**コンポーネント**:
- `components/lp/LPTemplateSelector.jsx` - テンプレート選択UI（新規）

**バックエンド関数**:
- `functions/createLPFromTemplate.js` - LP + ブロック生成（新規）
- `functions/generateLPContentWithAI.js` - AI コンテンツ改善（新規）

**ページ更新**:
- `pages/AdminLPList.jsx` - テンプレート選択統合

---

## API 一覧

| 関数 | メソッド | エンドポイント | 機能 |
|------|--------|-----------|------|
| createLPFromTemplate | POST | /api/create-lp-from-template | テンプレートからLP生成 |
| generateLPContentWithAI | POST | /api/generate-lp-content-with-ai | AI初期コンテンツ生成 |

---

## 使用方法

### 管理者向け

1. **AdminLPList → 「新規作成」**
   ```
   3つのテンプレートから選択 → タイトル入力 → LPを作成
   ```

2. **テンプレート選択**
   - 高級ミニマルLP - ハイエンド商材
   - ストーリーLP - 実績・証言ベース
   - カードLP - 複数プラン・比較

3. **AI生成**
   - デフォルト ON
   - コンテンツが自動改善される
   - チェック外すと、テンプレートデフォルトコンテンツのみ

4. **編集・公開**
   - AdminLPEditor で各ブロックを編集
   - 共通テーマが自動適用
   - 公開設定で公開

---

## 今後の拡張可能性

- ✅ テンプレート追加（新パターン）
- ✅ ブロック個別のスタイル変種
- ✅ テンプレート内のセクション削除/追加機能
- ✅ テンプレートプリセット（カラー・フォント組み合わせ）
- ✅ テンプレート使用統計・効果測定

---

## 未対応部分

⚠️ **今後の課題**:
- テンプレートをDBで管理（LPTemplate エンティティでの動的テンプレート）
- ユーザー作成カスタムテンプレート
- テンプレートの複製・派生
- ブロック単位での挿入/削除UI
- テンプレートプレビュー（実際のLP表示）
- テンプレート使用率・効果測定