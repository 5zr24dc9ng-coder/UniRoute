import { COUNTRY_DATA, CITY_TIERS, DEFAULT_FX } from "../../constants/countries";
import { calcCosts } from "../../utils/calculator";
import { b64DecodeUnicode } from "../../utils/base64";
import { ROWS, getBestIndex } from "../../utils/comparisonRows";
import type { CityTierKey, CountryId, Fx, SimScenario, StudyType } from "../../types";

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

function parseCompareParam(params: URLSearchParams): SimScenario[] {
  const raw = params.get("cmp");
  if (!raw) return [];
  try {
    const decoded = JSON.parse(b64DecodeUnicode(raw));
    if (!Array.isArray(decoded)) return [];
    return decoded.map((d: any, idx: number) => ({
      id: String(idx),
      name: String(d.name ?? `シナリオ${idx + 1}`),
      country: d.country,
      studyType: d.studyType,
      duration: Number(d.duration) || 1,
      cityTier: d.cityTier,
    }));
  } catch {
    return [];
  }
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

  // sections パラメータが無い場合（このチェックボックス機能より前に発行された共有リンク）は
  // 後方互換性のため全項目を表示する
  const sectionsParam = params.get("sections");
  const sections = sectionsParam === null
    ? { total: true, breakdown: true, visa: true }
    : {
        total: sectionsParam.split(",").includes("total"),
        breakdown: sectionsParam.split(",").includes("breakdown"),
        visa: sectionsParam.split(",").includes("visa"),
      };

  const compareScenarios = parseCompareParam(params);

  return { country, studyType, duration, cityTier, remit, fx, schMonthly, schLump, schMonths, sections, compareScenarios };
}

export function ShareReportView() {
  const { country, studyType, duration, cityTier, remit, fx, schMonthly, schLump, schMonths, sections, compareScenarios } = parseParams();
  const hasCompare = compareScenarios.length >= 2;

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
          ${hasCompare ? "@page { size: landscape; } .compare-table-print { font-size: 10px; }" : ""}
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
        {sections.total && (
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
        )}

        {/* 奨学金オフセット */}
        {hasScholarship && sections.total && (
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
        {sections.breakdown && (
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
        )}

        {/* ビザ・リスク情報 */}
        {sections.visa && (
          <div style={{ background: "#fff", border: "1px solid #e3e9f5", borderRadius: 16, padding: "20px 32px", marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1c2740", margin: "0 0 10px" }}>ビザ・資金証明について</p>
            <p style={{ fontSize: 13, color: "#5e6b86", lineHeight: 1.7, margin: 0 }}>{c.proofRule}</p>
          </div>
        )}

        {/* 保存したシナリオの比較 */}
        {hasCompare && (
          <div
            className="compare-table-print"
            style={{ background: "#fff", border: "1px solid #e3e9f5", borderRadius: 16, padding: "20px 24px 8px", marginBottom: 24 }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1c2740", margin: "0 0 12px" }}>保存したシナリオの比較</p>

            {/* シナリオ名ヘッダー行 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `150px repeat(${compareScenarios.length}, 1fr)`,
                borderBottom: "1px solid #f0f4ff",
              }}
            >
              <div />
              {compareScenarios.map((s) => (
                <div key={s.id} style={{ textAlign: "center", padding: "10px 6px", borderTop: "3px solid #4f46e5" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#141d33", wordBreak: "break-word" }}>{s.name}</div>
                </div>
              ))}
            </div>

            {/* データ行 */}
            {ROWS.map((row, ri) => {
              const bestIdx = getBestIndex(row, compareScenarios, fx);
              const values = compareScenarios.map((s) => row.getValue(s, fx));
              return (
                <div
                  key={ri}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `150px repeat(${compareScenarios.length}, 1fr)`,
                    borderTop: "1px solid #f1f5f9",
                    background: row.label === "推定総額" ? "#f8faff" : "#fff",
                  }}
                >
                  <div style={{ padding: "10px 12px", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: "#334155", fontWeight: row.label === "推定総額" ? 700 : 500 }}>{row.label}</span>
                    {row.sub && <span style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{row.sub}</span>}
                  </div>
                  {values.map((val, ci) => {
                    const isBest = ci === bestIdx;
                    return (
                      <div
                        key={ci}
                        style={{
                          padding: "8px 6px", textAlign: "center",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                          background: isBest ? "#f0fdf4" : "transparent",
                          position: "relative",
                        }}
                      >
                        {isBest && (
                          <div style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                        )}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: isBest ? 700 : 600,
                            color: isBest ? "#15803d" : "#1e293b",
                            fontFamily: '"IBM Plex Mono", monospace',
                            whiteSpace: "nowrap",
                          }}
                        >
                          {val.display}
                        </span>
                        {isBest && row.best !== "none" && (
                          <span style={{ fontSize: 8, fontWeight: 700, color: "#16a34a", letterSpacing: "0.04em" }}>最安</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <p style={{ fontSize: 10, color: "#8899bb", margin: "12px 0 0", lineHeight: 1.6 }}>
              ※ 為替レートは共有時点のレートを使用しています。各項目の最安値はその項目単体の比較で、必ずしも総額最安のシナリオと一致しない場合があります。
            </p>
          </div>
        )}

        <p style={{ fontSize: 11, color: "#a0aec0", textAlign: "center", lineHeight: 1.7 }}>
          本レポートはUniRoute（無料留学費用シミュレーター）で作成されました。金額は概算であり、為替レートやビザ制度の変更により実際の金額と異なる場合があります。最新情報は各国大使館・移民局の公式サイトでご確認ください。
        </p>
      </div>
    </div>
  );
}

export default ShareReportView;
