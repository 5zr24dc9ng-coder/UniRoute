# Architecture

> 更新頻度：中（設計を変える実装をしたときに更新する）
> Claude Code専用。実装に入る前にここを読んで既存設計と矛盾しない変更にする。

## ルーティング構成（React Router / App Routerではない）

UniRouteはNext.jsではなく **Vite + React のSPA**。ページ遷移はURLルーティングではなく、`App.tsx`内の`view`state（`ViewId = "sim" | "matrix" | "tasks" | "visa"`）で画面を切り替えている。

例外的にURLクエリパラメータで分岐する画面が3種類ある（`App.tsx`内で全Hook呼び出し後に判定）。

- `?share=1&...` → `ShareReportView`（ログイン不要の閲覧専用。家族向け共有レポート）
- `?legal=terms|privacy|tokushoho` → `LegalPageView`（規約・プライバシーポリシー・特商法表記の独立ページ）
- `?admin=true` → `isPremium`をセッション中のみtrueにする開発用フラグ（**localStorageに絶対保存しない**、下記「認証」参照）

サイドバーのナビゲーション定義は `src/constants/countries.ts` の `NAV`：

```
シミュレーション(sim) → 比較(matrix) → タスク管理(tasks) → ビザ費用(visa)
```

## Supabase

- クラウド同期は**ログイン中のユーザーのみ**。未ログイン時は全機能がlocalStorageのみで動く（既存動作を壊さない設計）
- `users`テーブル：`id`（Clerk user id）, `email`, `is_premium`, `stripe_customer_id`, `created_at`, `simulation_state`(jsonb), `task_state`(jsonb)
- Clerk-Supabase連携は **Third-Party Auth方式**（2025年4月以降の公式推奨方式）で統一。`session.getToken()`（テンプレート指定なし）を使う。旧JWTテンプレート方式（`getToken({ template: "supabase" })`）は非推奨かつ過去に実際に機能していなかった実績があるため、絶対に戻さない
- 権限は列単位で分離済み：

```sql
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (simulation_state, task_state) ON public.users TO authenticated;
```

`is_premium` / `stripe_customer_id` はservice roleキーを使うStripe webhookからしか書き換えられない。新しく機密性の高い列を追加する場合も、この列単位のGRANT管理を必ず踏襲すること。

- RLS：`auth.jwt() ->> 'sub'` と `id` 列を照合する「自分の行のみ」ポリシー（SELECT/UPDATE）。IDORの主要な防御線。

## API（`api/` ディレクトリ、Vercel Serverless Functions）

| ファイル | 役割 | 認証 |
|---|---|---|
| `api/fx.ts` | 為替レート取得のプロキシ（exchangerate-api.com） | 不要（`Cache-Control: s-maxage=86400`でCDNキャッシュし連打の実害を抑制） |
| `api/stripe/create-checkout-session.ts` | ¥980買い切りのCheckout Session作成 | Clerkセッショントークンを`verifyToken`で検証、`client_reference_id`にuserIdを埋め込む |
| `api/webhooks/stripe/index.ts` | `checkout.session.completed`受信 → `is_premium`/`stripe_customer_id`更新 | Stripe署名検証（`stripe.webhooks.constructEvent`）、service roleキー使用 |
| `api/webhooks/clerk/index.ts` | `user.created`/`user.deleted`受信 → Supabaseの行を作成/削除 | svix署名検証、service roleキー使用 |

すべての秘密鍵（`STRIPE_SECRET_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLERK_WEBHOOK_SIGNING_SECRET`, `EXCHANGE_RATE_API_KEY`）はこの`api/`配下でのみ参照し、クライアントバンドルに含めない。クライアント側で使ってよいのは`VITE_`プレフィックスの3つ（`VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`）のみ。

ローカル`.env`には**本番（`sk_live_`等）の鍵を絶対に置かない**。ローカル開発はClerk/Stripeのテストインスタンスの鍵（`sk_test_`）に統一し、本番鍵はVercelの環境変数にのみ設定する（2026-07-10、`.env`に本番Clerk鍵が混在していた事故を受けて徹底）。

エラーレスポンスは`error`コードのみを返し、`err.message`やDBエラー文などの`detail`は含めない（クライアントに内部情報を渡さないため、ログには`console.error`で残す）。`api/fx.ts`も同様に、env変数名一覧などの診断情報はレスポンスに含めずログのみに残す。

`vercel.json`にセキュリティヘッダー（`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Content-Security-Policy: frame-ancestors 'none'`）を設定済み。CSPは外部連携（Clerk/Stripe/Supabase）を壊さないよう`frame-ancestors`のみの最小構成にしている。

## DB設計

`users`テーブルのみ（Supabase）。詳細は上記「Supabase」参照。ローカルデータ（`COUNTRY_DATA`、ビザ・書類マスターデータ）はDBではなく`src/constants/`配下にハードコードされている。

## 認証

- Clerk（`@clerk/clerk-react`）。`main.tsx`で`ClerkProvider`をラップ、`jaJP`ローカライズ
- プレミアム判定：`premiumUnlocked = isPremium || purchasedPremium`
  - `isPremium`：`?admin=true`パラメータがある間だけtrue。**localStorageに一切保存しない**（過去に永続化していて誰でも推測できるURLで永久解放されるバグがあったため、絶対に変更禁止）
  - `purchasedPremium`：Supabaseの`is_premium`列から取得（Stripe webhook経由でのみ更新される）
- Clerkのwebhookは`user.created`と`user.deleted`の両方を購読済み（片方だけだと退会後の再登録がブロックされるバグが過去にあった）

## データフロー

1. 未ログイン：全状態はlocalStorage（`uniroute_country`, `uniroute_studyType`, `uniroute_duration`, `uniroute_cityTier`, `uniroute_legal_agreed`など）
2. ログイン時：`useCloudColumn`フックが`simulation_state`/`task_state`をSupabaseと双方向同期（800msデバウンス保存、ログイン直後に一度だけクラウド値を復元）
3. 購入：`create-checkout-session` → Stripe Checkout → `checkout.session.completed` webhook → Supabase `is_premium=true` → 次回ロード時に`purchasedPremium`へ反映
4. 退会：Clerkでユーザー削除 → `user.deleted` webhook → Supabaseの行を削除
5. 共有：`ShareReportView`はDBを見ず、URLクエリパラメータ（`sections`, `compareScenarios`のbase64エンコード等）だけで完結。ログイン不要

## コンポーネント設計

- `views/`：画面単位の大きなコンポーネント（SimulationView, ComparisonView, TaskView, VisaView, ShareReportView, LegalPageView）
- `layout/`：Header, Sidebar, Footer
- 機能単位のコンポーネント（プレミアム機能含む）はフラットに`components/`直下に配置：`FundGapAnalysis`, `ScenarioComparisonTable`, `DocumentChecklist`, `ScholarshipOffset`, `RemittanceCostComparison`, `PremiumUpgradeModal`, `SaveProgressModal`, `FeedbackModal`, `UserProfile`
- 共有ロジックは`utils/`に切り出す方針（例：`ScenarioComparisonTable`のROWS/getBestIndexを`comparisonRows.ts`に切り出し、`ShareReportView`と共用）
- 日本語対応のURLエンコードは`utils/base64.ts`の`b64EncodeUnicode`/`b64DecodeUnicode`

## プログラマティックSEO

- `scripts/generate-visa-timing-pages.mjs`がビルド前（`prebuild`）に`public/visa-timing/{uk,us,au,ca}.html`を自動生成
- Node実行環境がTSファイルを直接importできないため、`COUNTRY_DATA`の必要項目はスクリプト内に**手動でコピー**している（意図的な妥協。`countries.ts`を変更したら、このスクリプト内の値も手動で合わせる必要がある点に注意）
- `vercel.json`の`cleanUrls: true`で`/visa-timing/uk`形式のURLにしている
- 生成物はgitignore対象（`public/visa-timing/`）、コミットしない
- 同スクリプトは`public/sitemap.xml`も同時に自動生成する（本体1 + 国別SEOページ4の計5URLを列挙）。SEOページを増やしたらこのサイトマップ生成ロジックにもURLを追加すること。生成物はgitignore対象（`public/sitemap.xml`）、コミットしない
- `public/robots.txt`（固定ファイル・コミット対象）で全ページのクロールを許可し、`Sitemap: https://uniroute-study.jp/sitemap.xml`を明示している
- Google Search Console所有権確認用の`<meta name="google-site-verification" ...>`を`index.html`の`<head>`に設置済み（2026-07-21）
