# Design System

> 更新頻度：低（採用したデザインを反映するときだけ更新する）
> Lovable / Claude Code向け。新しいUIを作るときは、まずここにある値を再利用する。既存コードのインラインstyleから実際に使われている値を抽出したもの（デザイントークンファイルは無く、コード内に直書きされているのが現状）。

## ブランドカラー

実装はTailwindのテーマ拡張ではなく、ほぼ全てインラインstyleの16進カラーコード直書き。使用頻度の高い順：

| 色 | 用途 |
|---|---|
| `#141d33` | ダークネイビー。サイドバー背景、見出しテキスト、モーダル見出し |
| `#2f63e6` | プライマリブルー。CTAボタン、アクティブ状態、UKのaccent color |
| `#1f49b8` | プライマリブルーのhover状態 |
| `#8899bb` | サイドバーの非アクティブテキスト、補助テキスト |
| `#5e6b86` | 本文の補助テキスト（グレー系） |
| `#1c2740` | 本文テキスト（濃紺） |
| `#e3e9f5` | 薄いボーダー・区切り線 |
| `#f8faff` | ページ全体の背景色 |
| `#f0f4ff` / `#eef2ff` | 淡いブルーの背景（カード・バッジ） |
| `#16a34a` / `#15803d` / `#1f9268` | グリーン系。ポジティブな結果（黒字・余裕がある状態、CAのaccent color） |
| `#cf4a4a` | レッド系。ネガティブな結果（赤字・不足の警告、USのaccent color） |
| `#c2792a` | オレンジ系。AUのaccent color、注意喚起 |
| `#4f46e5` / `#4338ca` / `#6366f1` / `#a5b4fc` / `#c7d2fe` | インディゴ系。プレミアム関連のUI（バッジ・開発用ボタン） |

国ごとのaccent colorは`src/constants/countries.ts`の`Country.accent`で管理：UK `#2f63e6`（青）／US `#cf4a4a`（赤）／AU `#c2792a`（オレンジ）／CA `#1f9268`（緑）。新しい国を追加する場合もこの命名パターン（1国1アクセントカラー）を踏襲する。

赤字/黒字のようなポジ・ネガの色分けは「緑＝良い状態、赤＝要注意」で統一されている（資金ギャップ分析のサマリーカード等）。

## Typography

- フォントファミリー：`"Plus Jakarta Sans", system-ui, sans-serif`（`App.tsx`のルート要素で指定）。Tailwind設定側は`Inter`系（`tailwind.config.js`）だが、実際にアプリ全体へ効いているのはインラインstyleの`Plus Jakarta Sans`
- サイドバーのラベル等、モノスペースが欲しい箇所は`"IBM Plex Mono", monospace`＋`letterSpacing: 0.1em`＋`textTransform: uppercase`（例：「2026年要件」のようなタグ的表示）
- フォントサイズは実測でほぼ次の階級に収まっている（新規UIもこの並びから選ぶ）：
  - 8〜10px：補助・注釈テキスト
  - 11〜13px：本文の標準サイズ（最頻出）
  - 14px：やや強調した本文・ボタンラベル
  - 15〜18px：小見出し
  - 20〜28px：セクション見出し
  - 30〜52px：ヒーロー数値（総額表示など、`sim-total-cost`はレスポンシブで30→40→52px）
- 見出しは`fontWeight: 700`か`800`、本文は`400`〜`600`が中心

## Spacing

明示的なスペーシングスケール変数は無いが、実測の傾向：

- カード内padding：`16px`〜`22px`（モバイル）→`30px`〜`40px`（デスクトップ、`sim-outer-wrap`/`sim-hero-card`のように`@media (min-width: 1024px)`で拡張するパターンが標準）
- 要素間gap：`4px`（密着ラベル）、`11px`〜`14px`（アイコンとテキスト、カード間）、`22px`（グリッドの列間）
- ブレークポイントは`768px`（タブレット）と`1024px`（デスクトップ、`xl:`に相当）の2段階

## Button

- プライマリボタン：`background: #2f63e6` → hoverで`#1f49b8`、`color: #fff`、`borderRadius: 8px`、`fontWeight: 600`、`boxShadow: 0 2px 8px rgba(47,99,230,.3)`、`transition: all 0.2s ease`
- ナビゲーションボタン（サイドバー）：アクティブ時`background: rgba(47,99,230,0.22)`＋左ボーダー`3px solid #2f63e6`＋テキスト`#7aa2ff`、非アクティブ時は透明＋`#8899bb`
- 開発用ボタン（`?admin=true`時のみ表示）は視覚的に区別するため破線ボーダー（`1.5px dashed #a5b4fc`）＋淡いインディゴ背景

## Card

- `background: #fff`、`borderRadius: 16px`（モーダルは特に大きめ）、`boxShadow: 0 20px 60px rgba(20,29,51,.3)`（モーダル）
- 一般カードは`borderRadius: 8〜14px`の範囲、影は控えめ

## Form

- 入力欄は`cursor: pointer`が設定されたrange input（スライダー）を多用
- ボタンは`font-family: inherit`をグローバルCSSで強制（`index.css`）

## Icon

- `lucide-react`は依存関係にあるが、実際のナビゲーションアイコンは`src/components/ui/SvgIcon.tsx`の自前SVGコンポーネントを使用（`name`propで`sim`/`matrix`/`tasks`/`visa`等を指定）
- 絵文字は新規UI文言・新規コードコメントには使わない方針（過去のコードには国旗絵文字🇬🇧等のデータ用途としての絵文字は残っているが、装飾目的の新規絵文字追加はしない）

## Animation

- サイドバーの開閉：`transition: transform 0.24s cubic-bezier(.4,0,.2,1), box-shadow 0.24s`
- ボタンhover：`transition: all 0.2s ease`
- パルスアニメーション（`urPulse` keyframes）：進行中タスクなどのライブ感を出す用途、`opacity`と`boxShadow`を50%地点で薄くする2秒周期
- 過度なアニメーションは使わない（実務的な情報ツールとしてのトーンを保つ）

## Responsive

- JSでの幅検出（`useWindowWidth`）は一部で使用しているが、レイアウトの主要な分岐は**CSSメディアクエリ側に寄せる方針**（`index.css`内の`.sim-*`, `.sidebar-drawer`クラス群のコメントに「iOS Safariでのバグ回避」「JS幅検出なし」と明記あり）。新規レイアウトもJSでの幅判定より先にCSS側での対応を検討すること
- ブレークポイント：768px（`md:`）／1024px（`lg:`/`xl:`相当のカスタムブレークポイントも1024pxに統一）
- サイドバーは1024px未満でオーバーレイ式ドロワー、1024px以上で常時表示固定
