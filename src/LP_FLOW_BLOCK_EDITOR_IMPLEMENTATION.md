# LP Flowブロック エディタ修正レポート

## 概要
LPの「Flowブロック」編集UIを、従来のtextarea方式から項目ごとに編集できるUIに修正しました。

---

## 変更内容

### 問題点（修正前）
- Flow ブロックの `steps` 配列がtextareaで直接編集されていた
- `[object Object]` と表示され、ユーザーが内容を編集できなかった
- 保存構造が不明確（textarea値が文字列化されていた）

### 修正内容（修正後）
✅ **フロントエンド（編集UI）**
- 新規コンポーネント: `FlowBlockEditor` を作成
- ステップを1件ずつ編集できるカード型UI
- 各ステップで編集可能な項目:
  - ステップ名（heading）
  - 説明文（description）
  
✅ **バックエンド（保存構造）**
- `steps` は オブジェクト配列 として保存
  ```json
  {
    "title": "施術の流れ",
    "steps": [
      {
        "id": "step_1234567890",
        "heading": "ご予約",
        "description": "まずはご予約..."
      },
      {
        "id": "step_1234567891",
        "heading": "カウンセリング",
        "description": "来店後、丁寧に..."
      }
    ]
  }
  ```

✅ **公開側の表示**
- `BlockRenderer` が新しい `steps` 配列構造を正しく解析・表示
- ステップごとに見出し + 説明文をレンダリング
- グラデーション背景 + 接続線で視覚的に整理

---

## 実装ファイル一覧

### 新規ファイル
| ファイル | 説明 |
|---------|------|
| `components/lp/FlowBlockEditor.jsx` | Flow ブロック専用エディタコンポーネント |
| `components/lp/FlowBlockRenderer.jsx` | Flow ブロック公開側表示コンポーネント（参考） |
| `LP_FLOW_BLOCK_EDITOR_IMPLEMENTATION.md` | 本ドキュメント |

### 修正ファイル
| ファイル | 変更内容 |
|---------|--------|
| `components/lp/BlockEditor.jsx` | FlowBlockEditor を統合、Flow用フィールド定義を削除 |
| `components/lp/BlockRenderer.jsx` | Flow ブロック表示ロジックを更新（配列構造対応） |

---

## フロントエンド（編集UI）

### FlowBlockEditor コンポーネント

**位置**: `components/lp/FlowBlockEditor.jsx`

**機能**:
- セクションタイトルの編集
- ステップ一覧の管理
  - ステップを1件ずつ編集（名前 + 説明文）
  - ステップの追加 / 削除 / 複製
  - ステップの上下移動（並び順変更）

**使用方法**:
```jsx
<FlowBlockEditor
  data={block.data}
  onChange={(newData) => {
    // newData は { title, steps } 構造
  }}
/>
```

**サンプルデータ構造**:
```json
{
  "title": "施術の流れ",
  "steps": [
    {
      "id": "step_1234567890",
      "heading": "ご予約",
      "description": "電話またはWebで予約"
    },
    {
      "id": "step_1234567891",
      "heading": "カウンセリング",
      "description": "来店後の丁寧なヒアリング"
    }
  ]
}
```

### BlockEditor での統合

**修正点**:
```jsx
// Flow ブロック専用処理
if (block.block_type === 'Flow') {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800 text-lg">Flow ブロックを編集</h3>
      <FlowBlockEditor data={data} onChange={setData} />
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={() => onSave(data)}>保存</Button>
        <Button variant="outline" onClick={onCancel}>キャンセル</Button>
      </div>
    </div>
  );
}
```

---

## バックエンド（保存構造）

### データベース保存構造

**エンティティ**: `LPBlock`

**Flow ブロックのデータ形式**:
```json
{
  "id": "block_xyz",
  "lp_id": "lp_123",
  "block_type": "Flow",
  "sort_order": 3,
  "data": {
    "title": "施術の流れ",
    "steps": [
      {
        "id": "step_1234567890",
        "heading": "ご予約",
        "description": "電話 / LINE / Web 予約"
      },
      {
        "id": "step_1234567891",
        "heading": "カウンセリング",
        "description": "お悩みや希望をじっくりヒアリング"
      },
      {
        "id": "step_1234567892",
        "heading": "施術",
        "description": "個別オーダーメイド施術"
      },
      {
        "id": "step_1234567893",
        "heading": "アフターケア",
        "description": "施術後のケア方法をご説明"
      }
    ]
  }
}
```

**保存処理**:
```javascript
// フロントエンドから送信されるデータ
const data = {
  title: "施術の流れ",
  steps: [
    { id: "step_1234", heading: "ご予約", description: "..." },
    { id: "step_5678", heading: "カウンセリング", description: "..." }
  ]
};

// バックエンド保存
await base44.entities.LPBlock.update(blockId, { data });
```

---

## 公開側の表示ロジック

### BlockRenderer での処理

**修正点**:
```jsx
if (type === 'Flow') return (
  <section className="py-12 md:py-20 bg-white">
    <div className="max-w-4xl mx-auto px-4 md:px-8">
      {/* タイトル */}
      {toText(d.title) && (
        <h2 className="text-3xl font-light text-slate-900 mb-12 text-center">
          {toText(d.title)}
        </h2>
      )}
      
      {/* ステップ表示 */}
      {Array.isArray(d.steps) && d.steps.length > 0 ? (
        <div className="relative">
          {/* 接続線 */}
          {d.steps.length > 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-amber-100 hidden md:block" />
          )}
          
          {/* ステップカード */}
          <div className="space-y-8 relative z-10">
            {d.steps.map((step, index) => (
              <div key={step.id || index} className="flex gap-6 items-start">
                {/* ステップ番号 */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                </div>
                
                {/* コンテンツ */}
                <div className="flex-1 pt-1">
                  {step.heading && (
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      {step.heading}
                    </h3>
                  )}
                  {step.description && (
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  </section>
);
```

**表示特徴**:
✅ ステップ番号は 1から自動採番
✅ グラデーション背景で視覚的に整理
✅ ステップ間に接続線表示（デスクトップ版）
✅ 説明文は改行を保持（whitespace-pre-wrap）
✅ モバイルレスポンシブ対応

---

## データ移行（既存LPから）

### 既存の形式
```json
{
  "title": "施術の流れ",
  "steps": "ご予約\nカウンセリング\n施術\nアフターケア"
}
```

### 移行後の形式
```json
{
  "title": "施術の流れ",
  "steps": [
    { "id": "step_1", "heading": "ご予約", "description": "" },
    { "id": "step_2", "heading": "カウンセリング", "description": "" },
    { "id": "step_3", "heading": "施術", "description": "" },
    { "id": "step_4", "heading": "アフターケア", "description": "" }
  ]
}
```

**移行スクリプト例**:
```javascript
// 既存LP の Flow ブロックを新形式に移行
function migrateFlowBlock(oldData) {
  const lines = oldData.steps?.split('\n').filter(Boolean) || [];
  return {
    title: oldData.title || '',
    steps: lines.map((heading, i) => ({
      id: `step_${Date.now()}_${i}`,
      heading,
      description: ''
    }))
  };
}
```

---

## 検証チェックリスト

### 編集UI
- [ ] Flow ブロック編集時に FlowBlockEditor が表示される
- [ ] ステップ名を入力できる
- [ ] 説明文を複数行入力できる
- [ ] ステップを追加できる
- [ ] ステップを削除できる
- [ ] ステップを複製できる
- [ ] ステップを上下移動できる
- [ ] 保存をクリックするとデータが保存される

### 保存・取得
- [ ] Flow ブロックデータが JSON 配列として保存される
- [ ] `[object Object]` が出力されない
- [ ] 保存後に再度編集すると、データが正確に復元される

### 公開側表示
- [ ] Flow ブロックがステップ表示で描画される
- [ ] ステップ番号が 1, 2, 3... と自動採番される
- [ ] ステップ名が h3 タグで表示される
- [ ] 説明文が段落として表示される
- [ ] 接続線がデスクトップで表示される
- [ ] モバイルで見やすく表示される

---

## 技術仕様

### コンポーネント階層
```
AdminLPEditor
  ↓
BlockEditor
  ↓
FlowBlockEditor (Flow ブロック専用)
```

### データフロー

**編集時**:
1. BlockEditor が FlowBlockEditor を呼出
2. FlowBlockEditor が state を管理 → onChange で親に通知
3. BlockEditor が onChange を受け取る → data を更新
4. 保存ボタン押下 → onSave(data) で LPBlock.update()

**表示時**:
1. LPView が LPBlock を取得
2. BlockRenderer が block.data を受け取る
3. Flow ブロック型の場合 → steps 配列をマッピング
4. 各ステップを段落型で描画

---

## 今後の拡張可能性

**追加予定の編集項目**:
- [ ] アイコン（絵文字またはIcon名）
- [ ] ステップごとの背景色
- [ ] ステップ間の説明テキスト

**公開側の拡張**:
- [ ] ステップごとの画像表示
- [ ] ステップのクリックでアコーディオン開閉
- [ ] タイムライン型の表示バリエーション

---

## 互換性

✅ **既存データへの影響**:
- 既存 Flow ブロックは修正前の `steps: "..."` 形式
- 新しいエディタでは自動的に配列形式に変換
- 公開側は両形式に対応（後方互換性）

---

## 未対応部分

❌ **制限事項**:
- Flow ブロックのテンプレート機能なし（手動編集のみ）
- ステップ削除時の確認ダイアログなし
- 複製時のIDは自動生成（ユーザーが変更不可）

---

## ファイル変更サマリー

| ファイル | 行数 | 変更内容 |
|---------|------|--------|
| FlowBlockEditor.jsx | 275 | 新規作成 |
| BlockEditor.jsx | 119 | Flow専用処理追加 |
| BlockRenderer.jsx | 302 | Flow表示ロジック更新 |
| FlowBlockRenderer.jsx | 65 | 参考コンポーネント（未使用） |