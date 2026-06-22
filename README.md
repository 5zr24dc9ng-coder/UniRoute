# UniRoute — 留学費用・リスク管理ダッシュボード

React + TypeScript + Tailwind CSS + Vite で構築した、留学の費用シミュレーション・
複数国比較・タスク（クリティカルパス）管理ダッシュボードです。

## アーキテクチャ

責務ごとにレイヤーを分割しています。**1ファイルにロジックを詰め込まない**ことを原則とします。

```
src/
├─ types.ts                  … ドメイン型を集中管理（単一の真実）
├─ constants/                … データ層（純データ・静的定義のみ）
│   ├─ countries.ts          … COUNTRY_BASE / COUNTRIES / STUDY_TYPES /
│   │                          DURATION_OPTIONS / COST_META / 為替初期値・範囲 / 国↔通貨マップ
│   └─ todos.ts              … TODO_TEMPLATES（タスク依存関係データ）
├─ utils/                    … ロジック層（純粋関数・UI非依存）
│   ├─ calculator.ts         … calcCosts / getFundRequirement / fmt
│   └─ dateUtils.ts          … daysUntil / calcDueDate / formatDate
├─ components/
│   ├─ ui/                   … 状態を持たない再利用プレゼンテーショナル
│   │   ├─ Icon.tsx          … lucide-react ラッパー（旧 SVGIcon の name API 互換）
│   │   └─ BalanceAlert.tsx
│   ├─ layout/
│   │   └─ Sidebar.tsx       … ナビゲーション（選択は親へ委譲）
│   └─ views/                … ビュー層（config / setConfig を親から受領）
│       ├─ SimulationView.tsx   … 詳細設定と各国の深いコスト分析
│       ├─ ComparisonView.tsx   … マトリックス比較・初期キャッシュ要件
│       └─ TaskView.tsx         … クリティカルパスと依存関係の管理
└─ App.tsx                   … ルート層: 全体ステート中央管理 + ルーティング制御
```

### 設計上のポイント
- **データ層 / ロジック層 / UI 層の分離**: `utils/` の関数は `COUNTRY_BASE` 等の定数のみに依存し、
  React の state や props を一切参照しない純粋関数。テスト容易性が高い。
- **型による安全性**: 国・留学スタイル・通貨などはすべてリテラルユニオン型で定義し、
  `Record<...>` で取りこぼしを防止。
- **状態の中央管理**: `config`（期間・為替・出発日など）と `completedTodos` は `App.tsx` が保持し、
  各ビューへ `config` / `setConfig` / `toggleTodo` を渡す単方向データフロー。
- **ロジックのデータ化**: 国→通貨の分岐は `RATE_KEY_BY_COUNTRY`、スライダー範囲は `RATE_RANGES`
  としてデータに寄せ、`if` 連鎖を排除。

## セットアップ & 起動

> 前提: Node.js 18+ と npm が必要です。

```bash
cd uniroute
npm install        # 依存パッケージのインストール
npm run dev        # 開発サーバ起動（http://localhost:5173）
npm run build      # 型チェック + 本番ビルド
npm run typecheck  # 型チェックのみ
npm run preview    # ビルド成果物のプレビュー
```
