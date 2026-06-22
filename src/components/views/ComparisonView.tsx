import { useState } from "react";
import { COUNTRY_DATA } from "../../constants/countries";
import { calcCosts } from "../../utils/calculator";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import type { CostResult, Country, CountryId, Fx, StudyType } from "../../types";

type SortKey = "totalJPY" | "reserve" | "visaRisk";
type MatrixRow = Country & { costs: CostResult };

interface TableMetric {
  label: string;
  render: (r: MatrixRow) => string;
  sub: (r: MatrixRow) => string;
  vals: number[];
  best: "min" | "max";
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        background: color + "1a",
        border: `1px solid ${color}44`,
        borderRadius: 5,
        padding: "3px 9px",
        fontFamily: '"IBM Plex Mono", monospace',
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

function CountryCard({ row, isBest, sortBy, fx }: { row: MatrixRow; isBest: boolean; sortBy: SortKey; fx: Fx }) {
  // sortBy の状態に応じてメイン数値とサブ数値を動的に切り替え
  const isReservePrimary = sortBy === "reserve";
  const isVisaRiskPrimary = sortBy === "visaRisk";

  const visaDifficultyColor =
    row.visaDifficulty === 1 ? "#1f9268" : row.visaDifficulty === 2 ? "#c2792a" : "#cf4a4a";

  let mainLabel: string;
  let mainContent: React.ReactNode;
  let subValue: string;

  if (isVisaRiskPrimary) {
    // ビザ取得難易度選択時：複合指標ブロック
    mainLabel = "ビザ取得難易度";
    mainContent = (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "8px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#5e6b86" }}>難易度:</span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: visaDifficultyColor,
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            {row.visaLabel}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#d5e5ff" }}>|</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#5e6b86" }}>承認率:</span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1c2740",
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            {row.approvalRate}%
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#d5e5ff" }}>|</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#5e6b86" }}>目安:</span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1c2740",
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            {row.processingDays}日
          </span>
        </div>
      </div>
    );
    subValue = `総費用: ¥${row.costs.totalJPY.toLocaleString()}`;
  } else if (isReservePrimary) {
    // 必要残高選択時
    mainLabel = "必要残高";
    mainContent = (
      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 20, fontWeight: 700, color: "#141d33", whiteSpace: "nowrap" }}>
        {row.symbol}
        {row.proofOfFunds.toLocaleString()}
      </span>
    );
    subValue = `¥${Math.round(row.proofOfFunds * fx[row.currency]).toLocaleString()}`;
  } else {
    // 総費用選択時（デフォルト）
    mainLabel = "総費用";
    mainContent = (
      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 20, fontWeight: 700, color: "#141d33", whiteSpace: "nowrap" }}>
        ¥{row.costs.totalJPY.toLocaleString()}
      </span>
    );
    subValue = `${row.symbol}${Math.round(row.costs.total).toLocaleString()} · 10ヶ月`;
  }

  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${isBest ? "#2f63e6" : "#e3e9f5"}`,
        borderRadius: 14,
        padding: "22px 24px",
        position: "relative",
        boxShadow: isBest
          ? "0 2px 4px rgba(47,99,230,.12), 0 16px 36px -16px rgba(47,99,230,.32)"
          : "0 1px 3px rgba(20,29,51,.04)",
        transition: "box-shadow 0.2s",
      }}
    >
      {isBest && (
        <div
          style={{
            position: "absolute",
            top: 13,
            right: 13,
            background: "#2f63e6",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 4,
            fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: "0.06em",
          }}
        >
          最良
        </div>
      )}
      <div style={{ fontSize: 30, marginBottom: 10 }}>{row.flag}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#141d33", marginBottom: 14 }}>{row.name}</div>
      <div style={{ fontSize: 11, fontFamily: '"IBM Plex Mono", monospace', color: "#5e6b86", marginBottom: 8 }}>
        {mainLabel}
      </div>
      <div style={{ marginBottom: 12, overflow: "hidden" }}>{mainContent}</div>
      <div style={{ fontSize: 12, color: "#5e6b86", fontFamily: '"IBM Plex Mono", monospace', marginBottom: 16 }}>
        {subValue}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Tag
          label={row.visaLabel}
          color={row.visaDifficulty === 1 ? "#1f9268" : row.visaDifficulty === 2 ? "#c2792a" : "#cf4a4a"}
        />
        <Tag label={`${row.approvalRate}%`} color="#5e6b86" />
        <Tag label={`${row.processingDays}d`} color="#5e6b86" />
      </div>
    </div>
  );
}

interface ComparisonViewProps {
  fx: Fx;
  studyType: StudyType;
}

export function ComparisonView({ fx, studyType }: ComparisonViewProps) {
  const isSM = useWindowWidth() < 1024;
  const [sortBy, setSortBy] = useState<SortKey>("totalJPY");

  // 比較用の固定期間（10ヶ月） - studyType に基づく動的計算を適用
  const DURATION = 10;
  const rows: MatrixRow[] = (Object.keys(COUNTRY_DATA) as CountryId[])
    .map((id) => ({
      ...COUNTRY_DATA[id],
      // 各国の学費計算を studyType に応じて動的に実行
      // LANGUAGE 選択時は月額学費 × DURATION で計算
      costs: calcCosts(id, DURATION, fx, "capital", studyType),
    }))
    .sort((a, b) => {
      if (sortBy === "totalJPY") return a.costs.totalJPY - b.costs.totalJPY;
      if (sortBy === "reserve") return a.proofOfFunds - b.proofOfFunds;
      if (sortBy === "visaRisk") return a.visaDifficulty - b.visaDifficulty;
      return 0;
    });

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "totalJPY", label: "総費用" },
    { key: "reserve", label: "必要残高" },
    { key: "visaRisk", label: "ビザ取得難易度" },
  ];

  const tableMetrics: TableMetric[] = [
    {
      label: "総費用",
      render: (r) => `¥${r.costs.totalJPY.toLocaleString()}`,
      sub: (r) => `${r.symbol}${Math.round(r.costs.total).toLocaleString()}`,
      vals: rows.map((r) => r.costs.totalJPY),
      best: "min",
    },
    {
      label: "必要残高",
      render: (r) => `${r.symbol}${r.proofOfFunds.toLocaleString()}`,
      sub: (r) => `¥${Math.round(r.proofOfFunds * fx[r.currency]).toLocaleString()}`,
      vals: rows.map((r) => r.proofOfFunds),
      best: "min",
    },
    {
      label: "ビザ難易度",
      render: (r) => r.visaLabel,
      sub: (r) => `審査 ${r.processingDays}日`,
      vals: rows.map((r) => r.visaDifficulty),
      best: "min",
    },
    {
      label: "為替リスク",
      render: (r) => r.fxExposure,
      sub: () => "",
      vals: rows.map((r) => r.fxLevel),
      best: "min",
    },
    {
      label: "承認率",
      render: (r) => `${r.approvalRate}%`,
      sub: () => "",
      vals: rows.map((r) => r.approvalRate),
      best: "max",
    },
  ];

  const sortLabels: Record<SortKey, string> = {
    totalJPY: "総費用",
    reserve: "必要残高",
    visaRisk: "ビザ取得難易度",
  };
  const bestRow = rows[0];

  return (
    <div style={{ padding: isSM ? "20px 16px" : "36px 40px", maxWidth: 1160, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#5e6b86",
            display: "block",
            marginBottom: 6,
          }}
        >
          各国比較マトリクス
        </span>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#141d33", letterSpacing: "-0.02em", margin: 0 }}>
          渡航先リスク評価
        </h2>
      </div>

      {/* Sort controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#5e6b86", marginRight: 4 }}>並び替え:</span>
        {sortOptions.map((o) => (
          <button
            key={o.key}
            onClick={() => setSortBy(o.key)}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: sortBy === o.key ? 600 : 400,
              border: `1.5px solid ${sortBy === o.key ? "#2f63e6" : "#e3e9f5"}`,
              background: sortBy === o.key ? "#eaf0fe" : "#fff",
              color: sortBy === o.key ? "#1f49b8" : "#5e6b86",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Country cards — Tailwind grid: 1col mobile / 2col tablet / 4col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-[26px]">
        {rows.map((row, idx) => (
          <CountryCard key={row.id} row={row} isBest={idx === 0} sortBy={sortBy} fx={fx} />
        ))}
      </div>

      {/* Detail table */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "visible",
          position: "relative",
          border: "1px solid #e3e9f5",
          borderRadius: 14,
          boxShadow: "0 1px 3px rgba(20,29,51,.04), 0 8px 24px -8px rgba(20,29,51,.12)",
          marginBottom: 16,
          paddingBottom: 4,
        }}
      >
        <div style={{ minWidth: "max-content" }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "140px repeat(4, 140px)", background: "#141d33" }}>
          <div
            style={{
              fontSize: 11,
              color: "#5e6b86",
              fontFamily: '"IBM Plex Mono", monospace',
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              position: "sticky",
              left: 0,
              background: "#141d33",
              zIndex: 20,
              padding: "14px 16px",
              boxShadow: "2px 0 5px -2px rgba(0,0,0,0.3)",
            }}
          >
            指標
          </div>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 8px",
              }}
            >
              <span style={{ fontSize: 18 }}>{row.flag}</span>
              <span>{row.short}</span>
            </div>
          ))}
        </div>

        {/* Data rows */}
        {tableMetrics.map((metric, mi) => {
          const extreme = metric.best === "min" ? Math.min(...metric.vals) : Math.max(...metric.vals);
          const highlights = metric.vals.map((v) => v === extreme);
          const rowBg = mi % 2 === 0 ? "#fff" : "#fafcff";
          return (
            <div
              key={mi}
              style={{
                display: "grid",
                gridTemplateColumns: "140px repeat(4, 140px)",
                borderTop: "1px solid #f0f4ff",
                background: rowBg,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#5e6b86",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  position: "sticky",
                  left: 0,
                  backgroundColor: rowBg,
                  zIndex: 20,
                  padding: "10px 16px",
                  borderRight: "1px solid #e5e7eb",
                  boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
                }}
              >
                {metric.label}
              </div>
              {rows.map((row, ri) => (
                <div key={row.id} style={{ textAlign: "center", padding: "2px 8px" }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "7px 13px",
                      borderRadius: 8,
                      background: highlights[ri] ? "#e8f4ed" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: 13,
                        fontWeight: 600,
                        color: highlights[ri] ? "#1f9268" : "#1c2740",
                      }}
                    >
                      {metric.render(row)}
                    </div>
                    {metric.sub(row) && <div style={{ fontSize: 11, color: "#5e6b86", marginTop: 2 }}>{metric.sub(row)}</div>}
                    {highlights[ri] && (
                      <div
                        style={{
                          fontSize: 9,
                          color: "#1f9268",
                          marginTop: 3,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          fontFamily: '"IBM Plex Mono", monospace',
                        }}
                      >
                        最良
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        </div>{/* end min-width wrapper */}
      </div>

      {/* Recommendation banner */}
      <div style={{ background: "#141d33", borderRadius: 12, padding: "16px 22px", display: "flex", alignItems: "center", gap: 14 }}>
        <span
          style={{
            fontSize: 10,
            fontFamily: '"IBM Plex Mono", monospace',
            color: "#7aa2ff",
            border: "1px solid #2a3a63",
            borderRadius: 4,
            padding: "4px 10px",
            flexShrink: 0,
            letterSpacing: "0.06em",
          }}
        >
          ★ 推薦
        </span>
        <p style={{ margin: 0, fontSize: 14, color: "#cdd7ee" }}>
          <span style={{ color: "#fff", fontWeight: 700 }}>並び替え条件 · {sortLabels[sortBy]}: </span>
          {bestRow.flag} <span style={{ color: "#fff" }}>{bestRow.name}</span> が最良 —
          {sortBy === "totalJPY"
            ? ` ¥${bestRow.costs.totalJPY.toLocaleString()} — 10ヶ月で最安値の渡航先です。`
            : sortBy === "reserve"
              ? ` 必要残高 ${bestRow.symbol}${bestRow.proofOfFunds.toLocaleString()} — 比較対象で最低です。`
              : ` ビザ難易度「${bestRow.visaLabel}」· 承認率 ${bestRow.approvalRate}% · 審査 ${bestRow.processingDays}日。`}
        </p>
      </div>
    </div>
  );
}

export default ComparisonView;
