# UniRoute

> 更新頻度：低（サービスの前提や方向性が変わったときだけ更新する）
> 新しいAI（Claude Code / ChatGPT / Lovable等）にまず最初に読ませるファイル。

## サービス概要

UniRouteは、日本人学生向けの「留学費用・ビザ・リスク可視化ダッシュボード」。
対象国はイギリス（UK）・アメリカ（US）・オーストラリア（AU）・カナダ（CA）の4カ国。

学費・生活費・為替リスク・ビザの資金証明額・タスクの締切を1つの画面でシミュレーションできる無料ツールで、一部の機能のみ¥980の買い切り課金（プレミアム）。運営者は個人（屋号：葱ぽ、運営者：塚田開）。ドメインは `uniroute-study.jp`。

## ターゲット

交換留学・正規留学・語学留学を検討している日本人学生（大学生が中心）。
「留学エージェントに相談する前に、まず自分でざっくり総額とビザ要件を把握したい」層。

## 解決したい課題

- 留学の総費用（学費・家賃・生活費・送金コスト）が国や都市によってバラバラで、比較しづらい
- ビザの資金証明額・証明のタイミング（いつまでに何が必要か）が国ごとに複雑で分かりにくい
- 為替レートの変動で総額の見積もりが簡単にズレる
- 既存の比較コンテンツの多くは留学エージェントが運営しており、中立的な情報源が少ない

UniRouteは「エージェントではない中立な立場」で、実際の数値（為替・資金証明額・審査日数・承認率）をベースに可視化することを強みにしている。

## MVP範囲

- 4カ国（UK/US/AU/CA）× 3種類の留学スタイル（正規留学 DEGREE / 交換留学 EXCHANGE / 語学留学 LANGUAGE）の費用シミュレーション
- 都市ティア別（首都圏・地方都市・大学都市）の物価係数を反映した概算
- 為替リアルタイム取得（`api/fx.ts` 経由）
- ビザ資金証明のルール・承認率・審査日数の表示
- タスク管理（出願〜出国までのクリティカルパス）
- プレミアム機能（¥980買い切り、Stripe決済）：
  - 書類チェックリスト
  - 資金ギャップ分析（積立ペース・毎月貯蓄に回せる金額の入力）
  - 奨学金オフセット
  - シナリオ比較表（保存した複数シナリオの比較、PDF共有可）
  - 家族向け共有レポート（セクション選択可、ログイン不要のURL共有）
- Clerkによるログイン、Supabaseによる進捗のクラウド同期（ログイン時のみ）

## 技術スタック

- フロントエンド：React + TypeScript + Tailwind（Vite、`@vitejs/plugin-react-oxc`）。スタイルはほぼインラインstyle、Tailwindはレイアウト用ユーティリティ中心
- デプロイ：Vercel（`git push` → 自動ビルド・デプロイ）
- 認証：Clerk（`@clerk/clerk-react`、日本語ローカライズ `jaJP`）
- クラウド同期：Supabase（Third-Party Auth方式でClerkと連携。旧JWTテンプレート方式は非推奨のため使わない）
- 決済：Stripe（Checkout Session、¥980買い切り）
- Webhook：Clerk（`user.created` / `user.deleted`）、Stripe（`checkout.session.completed`）、いずれもVercel Serverless Functions + 署名検証（svix / stripe.webhooks.constructEvent）
- 為替取得：`api/fx.ts` がexchangerate-api.comをサーバー側でプロキシ（APIキーはクライアントに露出しない）
- プログラマティックSEO：ビルド時（`prebuild`）に静的HTMLページを自動生成するNodeスクリプト

## ディレクトリ構成

```
uniroute/
├── api/                          # Vercel Serverless Functions（サーバー側のみ実行）
│   ├── fx.ts                     # 為替レート取得プロキシ
│   ├── stripe/create-checkout-session.ts
│   └── webhooks/
│       ├── clerk/index.ts        # user.created / user.deleted
│       └── stripe/index.ts       # checkout.session.completed
├── scripts/
│   └── generate-visa-timing-pages.mjs  # プログラマティックSEO静的ページ生成
├── src/
│   ├── App.tsx                   # ルーティング（view切り替え）とグローバル状態
│   ├── main.tsx                  # ClerkProviderのラップ
│   ├── types.ts                  # ドメイン型定義（単一の真実）
│   ├── constants/
│   │   ├── countries.ts          # 国別マスターデータ・NAV定義・都市ティア
│   │   ├── documents/            # 国別必要書類データ（uk/us/au/ca）
│   │   ├── visa/                 # 国別ビザデータ（uk/us/au/ca）
│   │   ├── tasks.ts / todos.ts   # タスク管理の初期データ
│   │   └── legalTexts.ts         # 利用規約・プライバシーポリシー・特商法表記
│   ├── hooks/
│   │   ├── useSupabase.ts        # Clerkセッション→Supabaseクライアント
│   │   ├── useCloudColumn.ts     # simulation_state/task_stateの読み書き
│   │   ├── useLiveFx.ts          # 為替レート取得
│   │   ├── useProofOfFundsCalculator.ts
│   │   ├── useVisaCostCalculator.ts
│   │   └── useWindowWidth.ts
│   ├── components/
│   │   ├── layout/ (Header / Sidebar / Footer)
│   │   ├── views/ (SimulationView / ComparisonView / TaskView / VisaView / ShareReportView / LegalPageView)
│   │   ├── ui/SvgIcon.tsx
│   │   └── プレミアム機能コンポーネント群（FundGapAnalysis / ScenarioComparisonTable / DocumentChecklist 等）
│   └── utils/ (calculator.ts / comparisonRows.ts / base64.ts)
└── public/visa-timing/           # ビルド時に自動生成（gitignore対象、コミットしない）
```

詳細な技術設計は `ARCHITECTURE.md` を参照。

## 現在の進捗（2026-07-21時点）

- MVPは本番稼働中、実際に¥980の買い切りプレミアムもデプロイ済み
- プレミアム機能7点（**シナリオ比較、家族への共有レポート、資金ギャップ分析、奨学金オフセット計算、書類チェックリスト、タスクのカスタム編集、ビザ逆算スケジュール**）は実装済み・本番反映済み
- セキュリティ監査（SQLi/XSS/認証認可/機密情報/暗号化/IDOR/Webhook偽装/クライアント側シークレット漏洩/DDoS）を実施し、発見した問題はすべて修正済み
- プログラマティックSEOパイロット（学生ビザ資金証明タイミング、4カ国分の静的ページ）を実装・本番デプロイ済み
- PayPay決済有効化は承認済み（2026-07-10確認）。Clerkの「Attack Protection」も元に戻し済み
- 外部監査（Fable）で発見した4件（`.env`本番鍵の混在、`api/fx.ts`の環境変数名リーク、Webhook/APIのエラーdetail漏洩、セキュリティヘッダー未設定）を修正済み。Clerk `sk_live_`鍵はローテーション・Vercel反映・動作確認まで完了
- note連載は5本目まで投稿済み（資金証明タイミング/送金手数料/正規留学/書類/奨学金）。6本目以降（ビザ難易度/US・AU・CA深掘り/家族編）は企画済み。各noteに対応する短尺動画（TikTok/Instagram）も投稿中
- Google Search Console登録＋`sitemap.xml`自動生成＋`robots.txt`を設置（2026-07-21）。SEO効果測定の基盤を整備
- 効果測定：直近30日で訪問72・直帰率88%・プレミアム購入0件。母数が小さく判断は時期尚早のため、全チャネル継続で約1ヶ月後（目安2026-08-21）に再評価する方針（`DECISIONS.md` 2026-07-21）

進捗の日次管理は `TASKS.md`、意思決定の経緯は `DECISIONS.md` を参照。

## 今後のロードマップ

- note連載（資金証明タイミング編を優先、送金手数料編・正規留学編が続く）の投稿と反応測定
- プログラマティックSEOの拡大判断（留学タイプ別・都市ティア別など）を、パイロット4ページの検索流入を見てから行う
- 短期無料マーケティング施策（X build-in-public、Product Hunt/Crieit/Zenn登録）の実行
- 詳細は `MARKETING.md` を参照

