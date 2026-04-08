# Flow ブロック編集UI修正完了レポート

## 修正概要
LPの「Flow ブロック」編集を **textarea 方式から項目編集UI** に全面改修しました。

✅ **フロントエンド** - 項目ごとに編集できるUI完成  
✅ **バックエンド** - JSON配列として正確に保存  
✅ **公開側** - 配列構造を正しく描画  

---

## 実装ファイル

| ファイル | 種別 | 説明 |
|---------|------|------|
| `components/lp/FlowBlockEditor.jsx` | 新規 | Flow ブロック専用エディタ（275行） |
| `components/lp/BlockEditor.jsx` | 修正 | Flow 処理を追加、テキストエリア削除 |
| `components/lp/BlockRenderer.jsx` | 修正 | Flow 表示ロジックを配列対応に更新 |
| `components/lp/FlowBlockRenderer.jsx` | 参考 | Flow 表示用コンポーネント（参考実装） |
| `lib/flowBlockMigration.js` | 新規 | 旧形式→新形式マイグレーションツール |
| `LP_FLOW_BLOCK_EDITOR_IMPLEMENTATION.md` | ドキュメント | 詳細実装仕様書 |

---

## 修正前後の比較

### 修正前（問題あり）
```
textarea に [object Object],[object Object]... と表示
↓
ユーザーが内容を編集できない
↓
保存時にデータが破壊される
```

### 修正後（完全に解決）
```
ステップを1件ずつ編集UI で表示
↓
各ステップで名前・説明文を編集可能
↓
JSON配列として正確に保存・復元
```

---

## 新しいFlow ブロック編集画面

### UI構成
```
┌─────────────────────────────────┐
│ セクションタイトル              │
│ [  施術の流れ               ]   │
├─────────────────────────────────┤
│ ステップ (4件)                  │
├─────────────────────────────────┤
│ ┌──────────────────────────┐   │
│ │ STEP 1                   │   │
│ │ ステップ名: [ご予約     ]│   │
│ │ 説明文:                  │   │
│ │ [電話またはWeb で..    ] │   │
│ │ [↑] [↓] [複製] [削除]    │   │
│ └──────────────────────────┘   │
│                                 │
│ ┌──────────────────────────┐   │
│ │ STEP 2                   │   │
│ │ ステップ名: [カウンセ..  ]│   │
│ │ ...                      │   │
│ └──────────────────────────┘   │
├─────────────────────────────────┤
│ [+ ステップ追加]                │
├─────────────────────────────────┤
│ [保存]  [キャンセル]            │
└─────────────────────────────────┘
```

---

## 保存データ形式

### JSON 構造
```json
{
  "title": "施術の流れ",
  "steps": [
    {
      "id": "step_1234567890",
      "heading": "ご予約",
      "description": "電話またはWeb で予約をお取りします"
    },
    {
      "id": "step_1234567891",
      "heading": "カウンセリング",
      "description": "お悩みや希望をじっくりヒアリング"
    },
    {
      "id": "step_1234567892",
      "heading": "施術",
      "description": "個別オーダーメイド施術を行います"
    }
  ]
}
```

✅ **特徴**:
- 各ステップに一意の `id` を付与
- 見出し（`heading`）と説明（`description`）を分離
- JSON配列として機械的に処理可能
- `[object Object]` が出力されない

---

## 公開側の表示

### レンダリング結果
```
┌────────────────────────────────────┐
│        施術の流れ                  │
├────────────────────────────────────┤
│                                    │
│   ① ─┐  ご予約                     │
│      │  電話またはWeb で予約...    │
│      │                             │
│      ├─②  カウンセリング          │
│      │  お悩みや希望を...         │
│      │                             │
│      ├─③  施術                    │
│      │  オーダーメイド施術...     │
│      │                             │
│      └─④  アフターケア            │
│         ケア方法をご説明...       │
│                                    │
└────────────────────────────────────┘
```

✅ **特徴**:
- ステップ番号は自動採番（1, 2, 3...）
- グラデーション背景で視覚的に整理
- 接続線でステップの流れを強調
- モバイルレスポンシブ対応

---

## 操作機能

### ステップ管理
| 操作 | 機能 |
|------|------|
| **追加** | 「ステップ追加」ボタンで新規ステップを追加 |
| **編集** | ステップ名と説明文をinput/textarea で編集 |
| **削除** | 「削除」ボタンでステップを削除 |
| **複製** | 「複製」ボタンで現在のステップをコピー |
| **上下移動** | 「↑」「↓」ボタンでステップを並び替え |

---

## 実装のポイント

### ① フロントエンド（FlowBlockEditor）
- `useState` で title と steps を管理
- `useEffect` で data 変更時に親コンポーネントに通知
- 各ステップに固有の `id` を自動生成（タイムスタンプ + index）
- 子ステップの更新は `updateStep` で一元管理

### ② BlockEditor での統合
```jsx
if (block.block_type === 'Flow') {
  return <FlowBlockEditor data={data} onChange={setData} />;
}
```

### ③ BlockRenderer での表示
```jsx
if (Array.isArray(d.steps) && d.steps.length > 0) {
  // ステップごとにmapしてレンダリング
  d.steps.map((step, index) => (
    <div key={step.id}>
      <div className="w-12 h-12 rounded-full">{index + 1}</div>
      <h3>{step.heading}</h3>
      <p>{step.description}</p>
    </div>
  ))
}
```

---

## データ互換性

### 既存データへの対応
```javascript
// 旧形式: steps が文字列
{ title: "流れ", steps: "ご予約\nカウンセリング\n施術" }

// 新形式: steps が配列
{ 
  title: "流れ", 
  steps: [
    { id: "1", heading: "ご予約", description: "" },
    { id: "2", heading: "カウンセリング", description: "" },
    { id: "3", heading: "施術", description: "" }
  ]
}
```

✅ マイグレーションユーティリティを用意（`lib/flowBlockMigration.js`）
- `isLegacyFlowFormat()` - 旧形式かチェック
- `migrateFlowBlockData()` - 新形式に変換
- `normalizeFlowBlockData()` - 自動正規化
- `validateFlowBlockData()` - バリデーション

---

## テスト項目

- [x] Flow ブロック編集モーダルを開くと FlowBlockEditor が表示される
- [x] ステップ名を入力できる
- [x] ステップの説明文を複数行入力できる
- [x] ステップを追加できる（「ステップ追加」ボタン）
- [x] ステップを削除できる（「削除」ボタン）
- [x] ステップを複製できる（「複製」ボタン）
- [x] ステップを上下移動できる（「↑」「↓」ボタン）
- [x] 保存ボタンでデータが保存される
- [x] 保存後に再度編集すると データが正確に復元される
- [x] 公開側で Flow ブロックが正しく描画される
- [x] ステップ番号が 1, 2, 3... と自動採番される
- [x] 接続線がデスクトップで表示される
- [x] モバイルで見やすく表示される

---

## 今後の拡張

### 次のPhase で検討
- [ ] ステップごとのアイコン設定（絵文字またはIcon名）
- [ ] ステップごとの背景色 / テキスト色カスタマイズ
- [ ] タイムライン型や横並び等、表示スタイル選択
- [ ] ステップの画像アップロード対応

---

## トラブルシューティング

### Q: `[object Object]` が表示される場合
**A:** BlockRenderer の Flow 処理が旧形式のデータを受け取っています。
```javascript
// 旧形式の場合は自動的に正規化
const normalizedData = normalizeFlowBlockData(block.data);
```

### Q: 保存時にデータが失われる場合
**A:** `onChange` コールバックが正しく機能していません。
```javascript
// FlowBlockEditor の useEffect を確認
useEffect(() => {
  onChange({ title, steps }); // 親に通知
}, [title, steps, onChange]);
```

### Q: 移行が必要な既存LP がある場合
**A:** マイグレーションスクリプトを実行
```javascript
import { migrateFlowBlockData } from '@/lib/flowBlockMigration';

const newData = migrateFlowBlockData(oldBlockData);
await base44.entities.LPBlock.update(blockId, { data: newData });
```

---

## ファイルサイズ

| ファイル | 行数 |
|---------|------|
| FlowBlockEditor.jsx | 275 |
| BlockEditor.jsx (修正) | +30 |
| BlockRenderer.jsx (修正) | +20 |
| flowBlockMigration.js | 150 |
| **合計追加** | **475行** |

---

## 完了状況

✅ **実装完了**
- フロントエンド（編集UI）
- バックエンド（保存構造）
- 公開側（表示ロジック）
- マイグレーションツール
- ドキュメント

**ステータス**: 🟢 **Ready to Use**

---

## 参考リンク

- 詳細実装仕様: `LP_FLOW_BLOCK_EDITOR_IMPLEMENTATION.md`
- マイグレーションユーティリティ: `lib/flowBlockMigration.js`
- FlowBlockEditor コンポーネント: `components/lp/FlowBlockEditor.jsx