# LP制作SaaS - フロント・バック統合チェックリスト

## 完了項目

### 1. データ構造統一 ✅
- [x] Plan エンティティ（max_lp, max_sites, ai_limit）
- [x] UserPlan エンティティ（subscription status）
- [x] PlanUsage エンティティ（月度カウンター）
- [x] UserFeatures エンティティ（機能フラグ）
- [x] SitePage エンティティ拡張（use_common_contact + custom_contact）

### 2. バックエンド制限関数 ✅
- [x] `checkPlanLimit.js` - サーバー側制限確認
- [x] `validateLPCreation.js` - LP作成前チェック & カウンター更新

### 3. フロント制限UI ✅
- [x] AdminSiteList - `isAtSiteLimit` フラグで disabled表示
- [x] AdminLPList - `isAtLPLimit` フラグで disabled表示
- [x] LPCreationFlow - `validateLPCreation` で制限チェック＆インクリメント

### 4. 公開制御 ✅
- [x] SiteView - status !== 'published' && !isPreview でアクセス拒否
- [x] LPView - status !== 'published' && !isPreview でアクセス拒否

### 5. メニュー整理 ✅
- [x] ABテスト削除（実装未対応）
- [x] LP AI生成ページへのリダイレクト対応
- [x] UserSidebar から AdminABTest 削除

### 6. Flow ブロック ✅
- [x] FlowBlockRenderer - 構造化ステップ表示（object禁止）
- [x] BlockEditor - Flow専用エディタ統合済み

### 7. Contact機能 ✅
- [x] ContactSettingsPanel - 共通設定 ON/OFF UI
- [x] SitePage スキーマに use_common_contact + custom_contact 追加

---

## 残作業

### A. 実装確認が必要な項目
1. **SitePageManager** に ContactSettingsPanel を組み込み
   - ページ編集時に接触情報設定を表示

2. **Contact ブロックレンダラー** の更新
   - use_common_contact = true の場合：Site の共通接触情報を使用
   - use_common_contact = false の場合：Page の custom_contact を使用

3. **generateCompleteSite** 関数の修正
   - サイト作成時に plan 制限チェック（validateLPCreation 不要）

4. **usePlan** フック の実装確認
   - `isAtLPLimit` の計算ロジック確認
   - `isAtSiteLimit` の計算ロジック確認

### B. テスト項目
- [ ] LP作成数が上限に達した時 → ボタン disabled + メッセージ表示
- [ ] サイト作成数が上限に達した時 → ボタン disabled + メッセージ表示
- [ ] 下書きサイト → 非ログインアクセス → 403 Forbidden
- [ ] 下書き LP → 非ログインアクセス → 403 Forbidden
- [ ] Flow ブロック → object データが表示されない（ステップのみ）
- [ ] Contact ページ → 共通設定切替で表示切替

### C. 重要注意事項
1. **all functions が有効なら**：
   - validateLPCreation（check）と validateLPCreation（increment）の両方を呼び出し
   - バックエンド側で月度カウンターを管理

2. **Cloud Functions がない場合**：
   - フロント側で月度 PlanUsage を直接更新
   - ただしセキュリティリスクがあるため非推奨

3. **AdminLPCodeCreator**：
   - コード貼り付け時の LP 作成も validateLPCreation 経由で

4. **AdminLPGenerate**（AI生成）：
   - AI生成前に validateLPCreation（check）で確認
   - AI用額度も PlanUsage.ai_used で管理

---

## API 統合フロー例

### LP作成フロー（LPCreationFlow 実装済み）
```
1. ユーザー「新規作成」ボタン→モーダル表示
2. 作成方法選択（ai_text, ai_template, code_import, manual）
3. validateLPCreation（check） ← バックエンド確認
4. LP エンティティ作成
5. LPBlock（Hero） 作成
6. validateLPCreation（increment） ← カウンター更新
7. エディタに遷移
```

### サイト作成フロー（SiteCreateWizard）
```
1. テンプレート選択
2. サイト名入力
3. generateCompleteSite 呼び出し
   → 内部で plan 制限チェック
   → Site + SitePage + SiteBlock 自動生成
4. SitePageManager に遷移
```

---

## チェック完了後の最終確認

- [ ] すべての制限関数が正常に動作
- [ ] フロント UI が制限状態を正確に反映
- [ ] 公開/下書き制御が正確に機能
- [ ] エラーメッセージが分かりやすい
- [ ] モバイル表示でも制限UI が見やすい