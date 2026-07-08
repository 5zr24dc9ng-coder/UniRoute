// このスクリプトは `npm run build` の直前（prebuild）に自動実行され、
// public/visa-timing/ 以下に国別の静的HTMLページを4枚生成します。
//
// なぜ静的HTMLか：
// UniRoute本体はReactが動いて初めて中身が描画される「SPA」なので、
// 検索エンジン向けに特化したページはあらかじめ完成したHTMLとして
// 用意しておく方が確実にインデックスされます。
//
// 為替レートについて：
// レートは日々変動するため、円換算の具体的な金額はこのページには
// 書きません。現地通貨の金額のみを載せ、正確な円換算はアプリ本体
// （常に最新レートで計算）に誘導します。
//
// 注意（データの二重管理について）：
// 以下の COUNTRIES の中身は src/constants/countries.ts の COUNTRY_DATA
// と同じ内容を、このページに必要な項目だけ手動でコピーしたものです。
// ビザの資金証明額・ルールが変わった場合は、両方のファイルを更新して
// ください（為替レートのような頻繁に変わる値はそもそも含めていません）。

import { writeFileSync, mkdirSync } from "node:fs";

const SITE_URL = "https://uniroute-study.jp";

const COUNTRIES = {
  uk: {
    name: "イギリス",
    flag: "🇬🇧",
    symbol: "£",
    proofOfFunds: 13761,
    proofRule:
      "28日ルール — ビザ申請日の28日以上前までに、28日連続で必要生活費（ロンドン£1,529/月・ロンドン以外£1,171/月 × 最大9ヶ月）の残高を維持する必要があります。一度でも下回るとカウントがリセットされます。",
    approvalRate: 89,
    processingDays: 15,
  },
  us: {
    name: "アメリカ",
    flag: "🇺🇸",
    symbol: "$",
    proofOfFunds: 33600,
    proofRule:
      "I-20財政証明 — DS-160提出時に1学年分の全額資金を証明する必要があります。都市圏生活費 US$2,800/月 × 12ヶ月が目安です。",
    approvalRate: 82,
    processingDays: 30,
  },
  au: {
    name: "オーストラリア",
    flag: "🇦🇺",
    symbol: "A$",
    proofOfFunds: 29710,
    proofRule:
      "2026年学生ビザ財政要件 — 申請時にA$29,710が引き出し可能な状態で口座にある必要があります（凍結不可）。",
    approvalRate: 85,
    processingDays: 18,
  },
  ca: {
    name: "カナダ",
    flag: "🇨🇦",
    symbol: "CA$",
    proofOfFunds: 22895,
    proofRule:
      "就学許可2026 — 連邦規定により単身でCAD 22,895の生活資金証明が必要です（学費とは別）。",
    approvalRate: 91,
    processingDays: 10,
  },
};

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderPage(slug, c) {
  const title = `${c.name}の学生ビザ：資金証明はいくら必要？いつまでに用意すべきか【2026年版】`;
  const description = `${c.name}の学生ビザで求められる資金証明は${c.symbol}${c.proofOfFunds.toLocaleString()}。いつまでに、どんな条件で用意する必要があるかを解説。`;
  const canonical = `${SITE_URL}/visa-timing/${slug}`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${canonical}" />
<meta name="twitter:card" content="summary" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: "Hiragino Sans", "Yu Gothic", sans-serif; max-width: 680px; margin: 0 auto; padding: 32px 20px 60px; color: #1c2740; line-height: 1.8; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  h2 { font-size: 16px; margin-top: 28px; }
  .badge { display:inline-block; font-size:11px; font-weight:700; color:#fff; background:#2f63e6; border-radius:4px; padding:2px 8px; letter-spacing:.04em; margin-bottom:12px;}
  .fact { background:#f8faff; border:1px solid #e3e9f5; border-radius:12px; padding:18px 20px; margin:20px 0; }
  .fact p { margin:0 0 4px; font-size:12px; color:#8899bb; }
  .fact .value { font-size:26px; font-weight:800; }
  .cta { display:inline-block; margin-top:24px; padding:12px 24px; background:#2f63e6; color:#fff; border-radius:8px; text-decoration:none; font-weight:700; }
  .note { font-size:12px; color:#8899bb; margin-top:32px; line-height:1.7; }
  a { color:#2f63e6; }
</style>
</head>
<body>
  <span class="badge">UNIROUTE</span>
  <h1>${c.flag} ${esc(c.name)}の学生ビザ：資金証明はいくら必要？いつまでに用意すべきか</h1>

  <div class="fact">
    <p>必要な資金証明額（目安・現地通貨）</p>
    <div class="value">${c.symbol}${c.proofOfFunds.toLocaleString()}</div>
  </div>

  <h2>いつまでに用意すべきか</h2>
  <p>${esc(c.proofRule)}</p>

  <h2>審査の目安</h2>
  <p>ビザ承認率：約${c.approvalRate}%　/　審査日数：約${c.processingDays}日</p>

  <p>正確な円換算額は為替レートによって日々変わります。現在のレートで計算したい方、出国日から逆算していつまでに準備すべきか知りたい方は、無料のシミュレーターをご利用ください。</p>

  <a class="cta" href="${SITE_URL}/">UniRouteで自分の条件を計算する →</a>

  <p class="note">
    UniRouteは特定の留学エージェントではなく、中立な立場で運営している無料ツールです。営業目的のご連絡は行いません。<br />
    ※ 本ページの情報は2026年時点のものです。ビザ制度は変更される場合があるため、最新情報は各国大使館・移民局の公式サイトでご確認ください。
  </p>
</body>
</html>
`;
}

mkdirSync("public/visa-timing", { recursive: true });

for (const [slug, c] of Object.entries(COUNTRIES)) {
  writeFileSync(`public/visa-timing/${slug}.html`, renderPage(slug, c));
  console.log(`generated public/visa-timing/${slug}.html`);
}
