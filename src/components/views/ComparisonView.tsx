import { COUNTRY_DATA } from "../../constants/countries";
import { calcCosts } from "../../utils/calculator";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import type { CountryId, Fx, StudyType } from "../../types";

interface ComparisonViewProps {
  fx: Fx;
  studyType: StudyType;
}

const DURATION = 10;
const COUNTRY_ORDER: CountryId[] = ["UK", "US", "AU", "CA"];

// ─── 各セクションの行定義 ─────────────────────────────────────────────────────
interface SectionRow {
  type: "section";
  label: string;
}

interface DataRow {
  type: "data";
  label: string;
  sub?: string;
  getValue: (id: CountryId, fx: Fx, studyType: StudyType) => { display: string; raw: number };
  best: "min" | "max" | "none";
  format?: "currency" | "pct" | "days" | "text";
}

type Row = SectionRow | DataRow;

const ROWS: Row[] = [
  { type: "section", label: "費用（10ヶ月・首都圏）" },
  {
    type: "data", label: "推定総費用", sub: "円換算・送金手数料抜き",
    getValue: (id, fx, st) => {
      const c = calcCosts(id, DURATION, fx, "capital", st);
      return { display: `¥${c.totalJPY.toLocaleString()}`, raw: c.totalJPY };
    },
    best: "min",
  },
  {
    type: "data", label: "年間学費", sub: "円換算",
    getValue: (id, fx, st) => {
      const c = COUNTRY_DATA[id];
      const costs = calcCosts(id, DURATION, fx, "capital", st);
      const tuition = costs.items.find((i) => i.key === "tuition");
      const val = tuition ? tuition.value : 0;
      const annualJpy = Math.round((val / (DURATION / 12)) * fx[c.currency]);
      return { display: val === 0 ? "無料" : `¥${annualJpy.toLocaleString()}`, raw: annualJpy };
    },
    best: "min",
  },
  {
    type: "data", label: "月額住居費", sub: "円換算",
    getValue: (id, fx) => {
      const c = COUNTRY_DATA[id];
      const jpy = Math.round(c.rentPerMonth * fx[c.currency]);
      return { display: `¥${jpy.toLocaleString()}`, raw: jpy };
    },
    best: "min",
  },
  {
    type: "data", label: "月額生活費", sub: "円換算",
    getValue: (id, fx) => {
      const c = COUNTRY_DATA[id];
      const jpy = Math.round(c.livingPerMonth * fx[c.currency]);
      return { display: `¥${jpy.toLocaleString()}`, raw: jpy };
    },
    best: "min",
  },
  {
    type: "data", label: "資金証明額", sub: "ビザ申請時に必要・円換算",
    getValue: (id, fx) => {
      const c = COUNTRY_DATA[id];
      const jpy = Math.round(c.proofOfFunds * fx[c.currency]);
      return { display: `¥${jpy.toLocaleString()}`, raw: jpy };
    },
    best: "min",
  },

  { type: "section", label: "ビザ・審査" },
  {
    type: "data", label: "ビザ難易度",
    sub: "承認率・審査日数・面接の有無・資金証明の複雑さ等を踏まえた総合評価",
    getValue: (id) => {
      const c = COUNTRY_DATA[id];
      return { display: c.visaLabel, raw: c.visaDifficulty };
    },
    best: "min",
  },
  {
    type: "data", label: "ビザ承認率",
    getValue: (id) => {
      const c = COUNTRY_DATA[id];
      return { display: `${c.approvalRate}%`, raw: c.approvalRate };
    },
    best: "max",
  },
  {
    type: "data", label: "審査期間（目安）",
    getValue: (id) => {
      const c = COUNTRY_DATA[id];
      return { display: `${c.processingDays}日`, raw: c.processingDays };
    },
    best: "min",
  },

  { type: "section", label: "リスク" },
  {
    type: "data", label: "為替リスク",
    getValue: (id) => {
      const c = COUNTRY_DATA[id];
      return { display: c.fxExposure, raw: c.fxLevel };
    },
    best: "min",
  },
  {
    type: "data", label: "主要都市",
    getValue: (id) => {
      const c = COUNTRY_DATA[id];
      return { display: c.cities.capital, raw: 0 };
    },
    best: "none",
    format: "text",
  },
];

// ─── ベスト値の判定 ──────────────────────────────────────────────────────────
function getBestIndex(row: DataRow, countryIds: CountryId[], fx: Fx, studyType: StudyType): number {
  if (row.best === "none") return -1;
  const vals = countryIds.map((id) => row.getValue(id, fx, studyType).raw);
  if (row.best === "min") return vals.indexOf(Math.min(...vals));
  return vals.indexOf(Math.max(...vals));
}

// ─── 国ヘッダーカード ─────────────────────────────────────────────────────────
function CountryHeader({ id, accent }: { id: CountryId; accent: string }) {
  const c = COUNTRY_DATA[id];
  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px 12px 16px",
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>{c.flag}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#141d33", letterSpacing: "-0.01em" }}>
        {c.name}
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, fontFamily: '"IBM Plex Mono", monospace' }}>
        {c.currency}
      </div>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export function ComparisonView({ fx, studyType }: ComparisonViewProps) {
  const isSM = useWindowWidth() < 768;

  const studyTypeLabel = { DEGREE: "正規留学", EXCHANGE: "交換留学", LANGUAGE: "語学留学" }[studyType];

  // 総費用でベスト国を算出（サマリー用）
  const totalCosts = COUNTRY_ORDER.map((id) => ({
    id,
    jpy: calcCosts(id, DURATION, fx, "capital", studyType).totalJPY,
  }));
  const bestCountry = totalCosts.reduce((a, b) => (a.jpy < b.jpy ? a : b));

  // グリッド列定義
  const labelColWidth = isSM ? 110 : 160;
  const countryColWidth = isSM ? 100 : 148;
  const totalWidth = labelColWidth + countryColWidth * 4;

  return (
    <div style={{ padding: isSM ? "20px 0" : "36px 0", maxWidth: 900, margin: "0 auto" }}>

      {/* ─── ページヘッダー ─────────────────────────────────────────── */}
      <div style={{ padding: isSM ? "0 16px 24px" : "0 40px 32px" }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#94a3b8",
            display: "block",
            marginBottom: 8,
          }}
        >
          各国比較 · {studyTypeLabel} · {DURATION}ヶ月
        </span>
        <h2
          style={{
            fontSize: isSM ? 24 : 30,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.03em",
            margin: "0 0 6px",
          }}
        >
          4カ国を比較する
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          英・米・豪・加を費用・ビザ・リスクで横断比較
        </p>
      </div>

      {/* ─── 比較テーブル（モバイル: 横スクロールなしの国別カード） ───────────── */}
      {isSM ? (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          {COUNTRY_ORDER.map((id) => {
            const c = COUNTRY_DATA[id];
            return (
              <div
                key={id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  overflow: "hidden",
                  borderTop: `3px solid ${c.accent}`,
                }}
              >
                {/* 国ヘッダー */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 28 }}>{c.flag}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#141d33", letterSpacing: "-0.01em" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: '"IBM Plex Mono", monospace' }}>{c.currency}</div>
                  </div>
                </div>

                {/* 各指標 */}
                {ROWS.map((row, ri) => {
                  if (row.type === "section") {
                    return (
                      <div
                        key={ri}
                        style={{
                          padding: "8px 16px",
                          background: "#f8fafc",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#64748b",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontFamily: '"IBM Plex Mono", monospace',
                          borderTop: ri > 0 ? "1px solid #e2e8f0" : "none",
                        }}
                      >
                        {row.label}
                      </div>
                    );
                  }
                  const bestIdx = getBestIndex(row, COUNTRY_ORDER, fx, studyType);
                  const isBest = COUNTRY_ORDER.indexOf(id) === bestIdx;
                  const val = row.getValue(id, fx, studyType);
                  return (
                    <div
                      key={ri}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 16px",
                        borderTop: "1px solid #f1f5f9",
                        background: isBest ? "#f0fdf4" : "transparent",
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{row.label}</div>
                        {row.sub && (
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{row.sub}</div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isBest ? 700 : 600,
                            color: isBest ? "#15803d" : "#1e293b",
                            fontFamily: '"IBM Plex Mono", monospace',
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {val.display}
                        </span>
                        {isBest && (
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            最良
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ minWidth: totalWidth }}>

          {/* 国ヘッダー行 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${labelColWidth}px repeat(4, ${countryColWidth}px)`,
              background: "#fff",
              borderBottom: "1px solid #f1f5f9",
              position: "sticky",
              top: 0,
              zIndex: 10,
              boxShadow: "0 1px 0 #f1f5f9",
            }}
          >
            <div style={{ padding: "20px 16px 16px", borderRight: "1px solid #f8fafc" }} />
            {COUNTRY_ORDER.map((id) => (
              <CountryHeader key={id} id={id} accent={COUNTRY_DATA[id].accent} />
            ))}
          </div>

          {/* データ行 */}
          {ROWS.map((row, ri) => {
            if (row.type === "section") {
              return (
                <div
                  key={ri}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `${labelColWidth}px repeat(4, ${countryColWidth}px)`,
                    background: "#f8fafc",
                    borderTop: ri > 0 ? "1px solid #e2e8f0" : "none",
                  }}
                >
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      padding: "10px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontFamily: '"IBM Plex Mono", monospace',
                    }}
                  >
                    {row.label}
                  </div>
                </div>
              );
            }

            // DataRow
            const bestIdx = getBestIndex(row, COUNTRY_ORDER, fx, studyType);
            const values = COUNTRY_ORDER.map((id) => row.getValue(id, fx, studyType));

            return (
              <div
                key={ri}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${labelColWidth}px repeat(4, ${countryColWidth}px)`,
                  background: "#fff",
                  borderTop: "1px solid #f1f5f9",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafcff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                {/* ラベルセル */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderRight: "1px solid #f1f5f9",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{row.label}</span>
                  {row.sub && (
                    <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{row.sub}</span>
                  )}
                </div>

                {/* 値セル */}
                {values.map((val, ci) => {
                  const isBest = ci === bestIdx;
                  return (
                    <div
                      key={ci}
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        background: isBest ? "#f0fdf4" : "transparent",
                        borderLeft: isBest ? "none" : "none",
                        position: "relative",
                      }}
                    >
                      {isBest && (
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#16a34a",
                          }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: row.format === "text" ? (isSM ? 11 : 13) : (isSM ? 12 : 13),
                          fontWeight: isBest ? 700 : 600,
                          color: isBest ? "#15803d" : "#1e293b",
                          fontFamily: '"IBM Plex Mono", monospace',
                          letterSpacing: "-0.01em",
                          whiteSpace: row.format === "text" ? "normal" : "nowrap",
                          wordBreak: row.format === "text" ? "break-word" : "normal",
                          lineHeight: row.format === "text" ? 1.4 : 1.2,
                        }}
                      >
                        {val.display}
                      </span>
                      {isBest && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#16a34a",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            fontFamily: '"IBM Plex Mono", monospace',
                          }}
                        >
                          最良
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* ボトムスペーサー */}
          <div style={{ height: 1, background: "#e2e8f0" }} />
        </div>
      </div>
      )}

      {/* ─── サマリーバナー ─────────────────────────────────────────── */}
      <div style={{ padding: isSM ? "24px 16px 0" : "28px 40px 0" }}>
        <div
          style={{
            background: "#0f172a",
            borderRadius: 16,
            padding: "20px 26px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: COUNTRY_DATA[bestCountry.id].accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {COUNTRY_DATA[bestCountry.id].flag}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              総費用で最安
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {COUNTRY_DATA[bestCountry.id].name}{" "}
              <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 13 }}>
                — {studyTypeLabel} {DURATION}ヶ月 · 首都圏で ¥{bestCountry.jpy.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 推定総費用の内訳（積み上げ棒グラフ・円換算） ─────────────────── */}
      <div style={{ padding: isSM ? "20px 16px 24px" : "24px 40px 32px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: isSM ? "18px 18px" : "22px 26px" }}>
          <p
            style={{
              fontSize: 11, fontWeight: 700, color: "#64748b",
              letterSpacing: "0.08em", textTransform: "uppercase",
              fontFamily: '"IBM Plex Mono", monospace', margin: "0 0 20px",
            }}
          >
            推定総費用の内訳（円換算・送金手数料抜き・{studyTypeLabel} {DURATION}ヶ月・首都圏）
          </p>

          {(() => {
            const maxJpy = Math.max(...totalCosts.map((t) => t.jpy));
            const maxBarPx = isSM ? 160 : 220;
            const barWidth = isSM ? 48 : 72;
            const STACK_ORDER: { key: string; label: string; color: string }[] = [
              { key: "tuition", label: "年間学費", color: "#3b82f6" },
              { key: "housing", label: "月額住居費", color: "#10b981" },
              { key: "visa_insurance", label: "ビザ・保険料", color: "#8b5cf6" },
              { key: "living", label: "月額生活費", color: "#f59e0b" },
              { key: "reserve", label: "資金証明額", color: "#ef4444" },
            ];

            return (
              <>
                <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: '"IBM Plex Mono", monospace' }}>円</span>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 8, marginTop: 4 }}>
                  {COUNTRY_ORDER.map((id) => {
                    const tc = totalCosts.find((t) => t.id === id)!;
                    const costs = calcCosts(id, DURATION, fx, "capital", studyType);
                    const barHeightPx = maxJpy > 0 ? Math.max(4, (tc.jpy / maxJpy) * maxBarPx) : 0;
                    const isBest = id === bestCountry.id;
                    return (
                      <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            fontSize: isSM ? 11 : 12, fontWeight: 700,
                            color: isBest ? "#16a34a" : "#1e293b",
                            fontFamily: '"IBM Plex Mono", monospace', whiteSpace: "nowrap",
                          }}
                        >
                          ¥{tc.jpy.toLocaleString()}
                        </span>
                        <div
                          style={{
                            width: barWidth, height: barHeightPx,
                            display: "flex", flexDirection: "column",
                            borderRadius: "6px 6px 0 0", overflow: "hidden",
                            boxShadow: isBest ? "0 0 0 2px #16a34a" : "none",
                          }}
                        >
                          {STACK_ORDER.map(({ key, label, color }) => {
                            const item = costs.items.find((i) => i.key === key);
                            if (!item || item.pct <= 0) return null;
                            return (
                              <div
                                key={key}
                                style={{ height: `${item.pct * 100}%`, background: color }}
                                title={`${label}: ${Math.round(item.pct * 100)}%`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* x軸ライン */}
                <div style={{ borderTop: "1.5px solid #cbd5e1", marginTop: 2 }} />

                {/* 国ラベル */}
                <div style={{ display: "flex", justifyContent: "space-around", gap: 8, marginTop: 8 }}>
                  {COUNTRY_ORDER.map((id) => {
                    const c = COUNTRY_DATA[id];
                    const isBest = id === bestCountry.id;
                    return (
                      <div key={id} style={{ width: barWidth, textAlign: "center" }}>
                        <div style={{ fontSize: isSM ? 12 : 13, fontWeight: 600, color: "#1e293b" }}>
                          {c.flag} {c.name}
                        </div>
                        {isBest && (
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", letterSpacing: "0.04em", marginTop: 2 }}>
                            最安
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", fontFamily: '"IBM Plex Mono", monospace', marginTop: 6 }}>
                  国
                </div>

                {/* 凡例 */}
                <div style={{ display: "grid", gridTemplateColumns: isSM ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10, marginTop: 22, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                  {STACK_ORDER.map(({ key, label, color }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#475569" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default ComparisonView;
