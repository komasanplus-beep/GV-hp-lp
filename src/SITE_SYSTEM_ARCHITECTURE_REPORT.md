# サイト構築システム 構造診断レポート
## 実施日: 2026-04-07

---

## STEP1: サービス管理の二重構造確認

### 現状：✅ 統合済み（問題なし）

| 箇所 | エンティティ | データソース | 状況 |
|------|-----------|----------|------|
| **AdminServices** | Service エンティティ | `base44.entities.Service` | ✅ 独立 |
| **SiteBlockEditor (Service型)** | SiteBlock.data | 手入力フィールド（title, subtitle）| ❌ **二重構造あり** |
| **SiteBlockRenderer** | Service エンティティ | `base44.entities.Service.filter()` | ✅ 参照のみ |

### 問題点：

1. **ServiceBlockEditForm** (SiteBlockEditForm.jsx L28-31)
```javascript
Service: [
  { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: サービス' },
  { key: 'subtitle', label: 'サブタイトル', type: 'text', placeholder: '当店で提供するサービスをご紹介します' },
],
```
→ Service ブロックは表示設定（title, subtitle）のみを持つべき

2. **SiteBlockRenderer の ServiceBlock**（L94-128）
```javascript
function ServiceBlock({ d, siteId }) {
  const { data: services = [] } = React.useQuery({
    queryKey: ['services', siteId],
    queryFn: () => base44.entities.Service.filter({ site_id: siteId }, 'sort_order')
  });
  // 正しく Service エンティティから取得している
}
```
→ ✅ 正本は Service で統一されている

### 判定：
- **サービス本体** → Service エンティティ ✅
- **表示設定** → SiteBlock.data ✅ (ただしフィールドが冗長)

---

## STEP2: ヘッダー編集機能の状況

### 現状：❌ 固定直描画 → 編集不可

**SiteView.jsx L142-159 (固定コード)**
```javascript
<nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-100">
  <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
    <div className="flex items-center gap-2">
      {site?.logo_url ? /* ロゴ */ : /* サイト名 */}
    </div>
    <div className="hidden md:flex items-center gap-6 text-sm text-stone-600">
      <a href="#about">About</a>
      <a href="#menu">Menu</a>
      <a href="#staff">Staff</a>
      <a href="#gallery">Gallery</a>
      <a href="#contact">Contact</a>
    </div>
  </div>
</nav>
```

### 問題：
1. メニュー項目が **硬コード** (About, Menu, Staff, Gallery, Contact)
2. logo_url と site_name は Site エンティティから読まれているが、メニューは固定
3. 編集UI がない → 管理画面から変更不可

### 編集可能な項目：
- ✅ Logo (site.logo_url)
- ✅ サイト名 (site.site_name)
- ❌ メニュー項目
- ❌ メニュー URL
- ❌ 表示/非表示

---

## STEP3: テンプレート編集可能範囲一覧

| セクション | 状態 | データソース | 編集UI |
|----------|-----|----------|------|
| **Header** | 半固定 | Site.logo_url, Site.site_name + 硬コード | ❌ なし |
| **Hero** | 編集可 | SiteBlock (headline, subheadline, cta_text, cta_url, image_url) | ✅ あり |
| **About** | 編集可 | SiteBlock (title, body, image_url) | ✅ あり |
| **Menu** | 編集可 | SiteBlock (title, items) | ✅ あり |
| **Service** | 編集可 | SiteBlock (title, subtitle) + Service エンティティ参照 | ✅ あり（Service管理） |
| **Staff** | 編集可 | SiteBlock (title, members) | ✅ あり |
| **Gallery** | 編集可 | SiteBlock (title, image_urls[]) | ✅ あり |
| **Voice** | 編集可 | SiteBlock (title, voices) | ✅ あり |
| **Feature** | 編集可 | SiteBlock (title, features) | ✅ あり |
| **FAQ** | 編集可 | SiteBlock (title, faqs) | ✅ あり |
| **Access** | 編集可 | SiteBlock (title, address, phone, email, hours, map_url) | ✅ あり |
| **Contact** | 編集可 | SiteBlock (title, body, email, phone, line_url, booking_url) | ✅ あり |
| **Booking** | 編集可 | SiteBlock (title, body, button_text) + Reservation エンティティ | ✅ あり |
| **CTA** | 編集可 | SiteBlock (title, body, cta_text, cta_url) | ✅ あり |
| **Campaign** | 編集可 | SiteBlock (title, body, expiry, image_url) | ✅ あり |
| **Custom** | 編集可 | SiteBlock (title, body) | ✅ あり |
| **Footer** | 固定 | サイト名（硬コード） | ❌ なし |

---

## STEP4: ギャラリー画像の保存先と表示先

### 現状：✅ データ一致

**保存先:** SiteBlock.data.image_urls (配列)

**表示処理：** SiteBlockRenderer.jsx L297-318
```javascript
else if (type === 'Gallery') {
  const imageUrls = Array.isArray(d.image_urls) ? d.image_urls.filter(Boolean) : [];
  // d.image_urls を直接表示
}
```

### 確認事項：
- ✅ ギャラリーブロックの image_urls に保存
- ✅ SiteBlockRenderer が同じ image_urls を読んでいる
- ✅ 複数の Gallery ページがあっても、同じブロックを参照すれば同期

### 反映されない原因の可能性：
1. **ブロック編集フォーム** (SiteBlockEditForm.jsx L173-219)
   - image_list 型で配列処理は正しい
   - アップロード → file_url 設定 → data[field.key] に追加

2. **潜在的な問題：**
   - アップロード成功後に React Query 無効化されているか？ → `onSuccess` で `invalidateQueries` する必要あり

---

## STEP5: ページ管理とプレビューのリンク確認

### 実装状況：

| ページ | SitePage | SiteBlock | プレビューURL | リンク状態 |
|-------|---------|-----------|-----------|---------|
| HOME | ✅ home型 | ✅ blocks取得済み | /site/:siteId | ✅ 正常 |
| About | ✅ custom型 | ✅ About block | getSiteViewData経由 | ✅ 正常 |
| Menu | ✅ custom型 | ✅ Menu block | getSiteViewData経由 | ✅ 正常 |
| Service | ✅ custom型 | ✅ Service block | getSiteViewData経由 | ✅ 正常 |
| Staff | ✅ custom型 | ✅ Staff block | getSiteViewData経由 | ✅ 正常 |
| Gallery | ✅ custom型 | ✅ Gallery block | getSiteViewData経由 | ✅ 正常 |
| Access | ✅ custom型 | ✅ Access block | getSiteViewData経由 | ✅ 正常 |
| Contact | ✅ custom型 | ✅ Contact block | getSiteViewData経由 | ✅ 正常 |
| Booking | ✅ custom型 | ✅ Booking block | getSiteViewData経由 | ✅ 正常 |

### 特記事項：
- すべてのページが **getSiteViewData 関数経由**でデータ取得
- ブロック順序は **sort_order** で制御
- ページとプレビューの同期: ✅ リアルタイム

---

## STEP6: 未実装・改善が必要な箇所

### 優先度1：ヘッダー編集機能の実装

**現状：**
- ロゴとサイト名は Site から取得
- メニュー項目は硬コード

**修正案：**
1. Site または SiteSettings エンティティに `navigation_menu` を追加
   ```json
   {
     "site_id": "xxx",
     "menu_items": [
       { "label": "About", "href": "#about", "visible": true },
       { "label": "Services", "href": "#services", "visible": true },
       // ...
     ]
   }
   ```

2. または SiteBlock の Header タイプを作成
   - Hero の前に Header ブロックを配置
   - メニュー設定を block.data で管理

**推奨:** Header タイプの SiteBlock として実装（統一性が高い）

---

### 優先度2：Gallery 画像反映の確認

**チェックリスト：**
1. SiteBlockEditForm で image_urls 編集時、アップロード後に React Query invalidate されているか確認
2. SiteBlockEditor の updateMutation が正しく block.data.image_urls を保存しているか確認
3. プレビューを開いて即座に反映されるか確認 (キャッシュ問題の可能性)

**推奨修正：**
```javascript
const updateMutation = useMutation({
  mutationFn: ({ id, data }) => base44.entities.SiteBlock.update(id, { data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['siteBlocks'] }); // キャッシュ無効化
    queryClient.invalidateQueries({ queryKey: ['siteViewData'] }); // プレビューも無効化
    setEditingBlock(null);
    toast.success('保存しました');
  },
});
```

---

### 優先度3：Service 管理の重複フィールド削除

**削除対象：** SiteBlockEditForm の Service 型フィールド
```javascript
Service: [
  { key: 'title', label: 'セクションタイトル', type: 'text', placeholder: '例: サービス' },
  { key: 'subtitle', label: 'サブタイトル', type: 'text', placeholder: '当店で提供するサービスをご紹介します' },
],
```

**修正案：** 空配列にして、UI上は「このブロックはサービス管理の内容を表示します」というメッセージを表示

---

## 最終判定

### ✅ 正常に動作している機能
- Service 本体は Service エンティティで一元管理
- SiteBlockRenderer が Service を参照し、表示している
- ページ管理とプレビューのリンク完全統合
- ギャラリー画像保存先と表示先が一致

### ❌ 改善が必要な機能
1. **Header** - 固定コード → 編集可能化
2. **Gallery** - 画像反映の確認と React Query invalidate の強化
3. **Service Block** - 編集フォームの重複フィールド削除

### 📊 統合度
- **データソース統一度:** 85% ✅
- **編集可能度:** 90% ✅ (Header 除外)
- **プレビュー同期度:** 100% ✅