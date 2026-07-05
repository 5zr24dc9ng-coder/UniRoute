import { COUNTRY_DATA, CITY_TIERS, DEFAULT_FX } from "../../constants/countries";
import { calcCosts } from "../../utils/calculator";
import type { CityTierKey, CountryId, Fx, StudyType } from "../../types";

const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  DEGREE: "正規留学",
  EXCHANGE: "交換留学",
  LANGUAGE: "語学留学",
};

// 送金手数料の想定レート（SimulationViewと同じ前提。共有レポートは単体ページのため値を複製）
const BANK_FEE_RATE: Record<CountryId, number> = { US: 0.01, UK: 0.025, AU: 0.025, CA: 0.018 };
const WISE_FEE_RATE = 0.006;

function fmt(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const country = (params.get("country") as CountryId) ?? "UK";
  const studyType = (params.get("studyType") as StudyType) ?? "DEGREE";
  const duration = Math.max(1, Number(params.get("duration")) || 10);
  const cityTier = (params.get("cityTier") as CityTierKey) ?? "capital";
  const remit = params.get("remit") === "wise" ? "wise" : "bank";

  const fx: Fx = {
    GBP: Number(params.get("gbp")) || DEFAULT_FX.GBP,
    USD: Number(params.get("usd")) || DEFAULT_FX.USD,
    AUD: Number(params.get("aud")) || DEFAULT_FX.AUD,
    CAD: Number(params.get("cad")) || DEFAULT_FX.CAD,
  };

  const schMonthly = Number(params.get("schMonthly")) || 0;
  const schLump = Number(params.get("schLump")) || 0;
  const schMonths = Number(params.get("schMonths")) || 0;

  return { country, studyType, duration, cityTier, remit, fx, schMonthly, schLump, schMonths };
}

export function ShareReportView() {
  const { country, studyType, duration, cityTier, remit, fx, schMonthly, schLump, schMonths } = parseParams();

  const c = COUNTRY_DATA[country];
  const costs = calcCosts(country, duration, fx, cityTier, studyType);
  const rate = fx[c.currency];

  const bankFeeRate = BANK_FEE_RATE[country] ?? 0.025;
  const remittanceAmount = costs.remittanceBase * rate;
  const bankFeeJpy = Math.round(remittanceAmount * bankFeeRate);
  const wiseFeeJpy = Math.round(remittanceAmount * WISE_FEE_RATE);
  const finalTotalJpy = remit === "wise" ? costs.totalJPY - wiseFeeJpy : costs.totalJPY + bankFeeJpy;

  const totalScholarship = schMonthly * Math.min(schMonths, duration) + schLump;
  const hasScholarship = totalScholarship > 0;
  const realCostJpy = Math.max(0, finalTotalJpy - totalScholarship);

  const generatedAt = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* 画面表示のみのツールバー */}
      <div
        className="no-print"
        style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "#141d33", color: "#fff",
          padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
        }}
      >
        <span style={{ fontSize: 13 }}>これは家族向けの共有レポートです（閲覧専用・編集はできません）</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: "#2f63e6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            🖨️ 印刷 / PDFで保存
          </button>
          <a
            href={window.location.origin}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1.5px solid #fff",
              color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none",
              display: "inline-flex", alignItems: "center",
            }}
          >
            UniRouteを見る
          </a>
        </div>
      </div>

      {/* レポート本体 */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2f63e6", letterSpacing: "0.08em", marginBottom: 6 }}>
            UNIROUTE · 留学費用レポート
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#141d33", margin: "0 0 6px" }}>
            {c.flag} {c.name} · {STUDY_TYPE_LABEL[studyType]}
          </h1>
          <p style={{ fontSize: 13, color: "#8899bb", margin: 0 }}>
            {duration}ヶ月 · {CITY_TIERS[cityTier].label} · 作成日 {generatedAt}
          </p>
        </div>

        {/* 総額ヒーロー */}
        <div
          style={{
            background: "#fff", border: "1px solid #e3e9f5", borderRadius: 16,
            padding: "28px 32px", textAlign: "center", marginBottom: 24,
            boxShadow: "0 2px 4px rgba(20,29,51,.05)",
          }}
        >
          <p style={{ fontSize: 12, color: "#8899bb", letterSpacing: "0.08em", margin: "0 0 8px" }}>
            {hasScholarship ? "推定総額（奨学金差引前）" : "推定総額"}
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, color: "#141d33", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
            ¥{fmt(finalTotalJpy)}
          </p>
          <p style={{ fontSize: 13, color: "#5e6b86", marginTop: 8 }}>
            ≈ {costs.symbol}{fmt(costs.total + costs.remittanceBase * bankFeeRate)} 現地通貨換算（送金方法：{remit === "wise" ? "Wise" : "銀行送金"}）
          </p>
        </div>

        {/* 奨学金オフセット */}
        {hasScholarship && (
          <div
            style={{
              background: "#f0faf5", border: "1px solid #bbf7d0", borderRadius: 16,
              padding: "24px 32px", textAlign: "center", marginBottom: 24,
            }}
          >
            <p style={{ fontSize: 12, color: "#15803d", letterSpacing: "0.08em", margin: "0 0 8px" }}>
              奨学金 ¥{fmt(totalScholarship)} を差し引いた実質負担額
            </p>
            <p style={{ fontSize: 34, fontWeight: 800, color: "#15803d", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
              ¥{fmt(realCostJpy)}
            </p>
          </div>
        )}

        {/* 内訳テーブル */}
        <div style={{ background: "#fff", border: "1px solid #e3e9f5", borderRadius: 16, padding: "8px 32px", marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1c2740", margin: "20px 0 4px" }}>費用の内訳</p>
          {costs.items.map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                padding: "12px 0", borderBottom: "1px solid #f0f4ff", gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: 14, color: "#1c2740" }}>{item.label}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: "#a0aec0" }}>
                  {costs.symbol}{fmt(item.value)}
                </span>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 14, fontWeight: 600, color: "#1c2740" }}>
                  ¥{fmt(item.value * rate)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ビザ・リスク情報 */}
        <div style={{ background: "#fff", border: "1px solid #e3e9f5", borderRadius: 16, padding: "20px 32px", marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1c2740", margin: "0 0 10px" }}>ビザ・資金証明について</p>
          <p style={{ fontSize: 13, color: "#5e6b86", lineHeight: 1.7, margin: 0 }}>{c.proofRule}</p>
        </div>

        <p style={{ fontSize: 11, color: "#a0aec0", textAlign: "center", lineHeight: 1.7 }}>
          本レポートはUniRoute（無料留学費用シミュレーター）で作成されました。金額は概算であり、為替レートやビザ制度の変更により実際の金額と異なる場合があります。最新情報は各国大使館・移民局の公式サイトでご確認ください。
        </p>
      </div>
    </div>
  );
}

export default ShareReportView;
