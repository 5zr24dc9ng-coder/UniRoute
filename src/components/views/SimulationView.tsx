import type { CSSProperties } from "react";
import { useState } from "react";
import { CITY_TIERS, COUNTRY_DATA } from "../../constants/countries";
import { calcCosts } from "../../utils/calculator";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import type { CityTierKey, CountryId, Fx, StudyType } from "../../types";
import { RemittanceCostComparison } from "../RemittanceCostComparison";

const simCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e3e9f5",
  borderRadius: 12,
  padding: "20px 22px",
  boxShadow: "0 1px 2px rgba(20,29,51,.04)",
};
const simLabelStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: '"IBM Plex Mono", monospace',
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#5e6b86",
  marginBottom: 13,
  display: "block",
};
const simStepBtn: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: "1.5px solid #e3e9f5",
  background: "#f8faff",
  fontSize: 20,
  cursor: "pointer",
  color: "#5e6b86",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 400,
  lineHeight: 1,
  flexShrink: 0,
};

function Tooltip({ label, description }: { label: string; description: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 14, color: "#1c2740" }}>{label}</span>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1.5px solid #a0aec0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
          color: "#5e6b86",
          cursor: "pointer",
          flexShrink: 0,
          background: "#f8faff",
          transition: "all 0.15s",
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        ?
      </div>
      {show && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            background: "#141d33",
            color: "#fff",
            fontSize: 12,
            padding: "10px 14px",
            borderRadius: 6,
            whiteSpace: "normal",
            zIndex: 10,
            maxWidth: 200,
            boxShadow: "0 4px 12px rgba(20,29,51,.3)",
            pointerEvents: "none",
            lineHeight: 1.5,
          }}
        >
          {description}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 8,
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #141d33",
            }}
          />
        </div>
      )}
    </div>
  );
}

function RiskCard({ label, level, value }: { label: string; level: number; value: string }) {
  const palette = ["#1f9268", "#c2792a", "#cf4a4a"];
  const color = palette[Math.min(level - 1, 2)];
  return (
    <div style={{ ...simCardStyle, padding: "16px 18px" }}>
      <span style={simLabelStyle}>{label}</span>
      <div style={{ fontSize: 19, fontWeight: 700, color, marginBottom: 10 }}>{value}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= level ? color : "#e3e9f5",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface SimulationViewProps {
  country: CountryId;
  setCountry: (c: CountryId) => void;
  studyType: StudyType;
  duration: number;
  setDuration: (d: number) => void;
  fx: Fx;
  setFx: React.Dispatch<React.SetStateAction<Fx>>;
  cityTier: CityTierKey;
  setCityTier: (t: CityTierKey) => void;
  lastUpdated?: Date | null;
}

export function SimulationView({
  country,
  setCountry,
  studyType,
  duration,
  setDuration,
  fx,
  setFx,
  cityTier,
  setCityTier,
  lastUpdated,
}: SimulationViewProps) {
  const isSM = useWindowWidth() < 1024;
  const c = COUNTRY_DATA[country];
  const costs = calcCosts(country, duration, fx, cityTier, studyType);
  const rate = fx[c.currency];
  const [remitanceMode, setRemitanceMode] = useState<"bank" | "wise">("bank");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRemittanceWidget, setShowRemittanceWidget] = useState(false);

  function nudgeFx(delta: number) {
    setFx((prev) => ({
      ...prev,
      [c.currency]: Math.max(10, parseFloat((prev[c.currency] + delta).toFixed(1))),
    }));
  }

  const approvalLevel = c.approvalRate >= 90 ? 1 : c.approvalRate >= 85 ? 2 : 3;
  const tierKeys = Object.keys(CITY_TIERS) as CityTierKey[];

  const tooltips: Record<string, string> = {
    "残高証明積立":
      "ビザ審査用の一時的資金。口座に残っていることを証明するための名目金額です。支払って消えるお金ではなく、審査完了後に引き出せます。",
    "授業料・諸費用": "学費・登録料・施設費などの教育機関への直接支払額。",
    "住居費": "寮費または家賃。選択した都市ティアと留学期間で算出。",
    "ビザ・保険料": "ビザ申請料・健康保険など。国別の法律要件に基づいて計算。",
    "生活費": "食事・交通・通信などの月額生活費。",
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 送金コスト計算：国ごとの手数料率を適用
  // ────────────────────────────────────────────────────────────────────────────
  const bankFeesRateMap: Record<CountryId, number> = {
    US: 0.01,
    UK: 0.025,
    AU: 0.025,
    CA: 0.018,
  };

  // 国 ID から通貨コードを取得
  const currencyBankRate = bankFeesRateMap[country] || 0.025;
  const wiseRate = 0.006; // 一律 0.6%

  const remittanceAmount = costs.remittanceBase * rate;
  const bankFeeJpy = Math.round(remittanceAmount * currencyBankRate);
  const wiseFeeJpy = Math.round(remittanceAmount * wiseRate);

  const finalTotalJpy =
    remitanceMode === "wise" ? costs.totalJPY - wiseFeeJpy : costs.totalJPY + bankFeeJpy;

  return (
    <div className="sim-outer-wrap" style={{ maxWidth: 1160, margin: "0 auto" }}>
      <div style={{ marginBottom: 26 }}>
        <span style={{ ...simLabelStyle, display: "block", marginBottom: 6 }}>詳細シミュレーション</span>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#141d33", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
          総費用試算
        </h2>
        <div style={{ fontSize: 11, color: "#8899bb", fontFamily: '"IBM Plex Mono", monospace' }}>
          {lastUpdated
            ? `為替レート基準日時：${lastUpdated.getFullYear()}年${lastUpdated.getMonth() + 1}月${lastUpdated.getDate()}日（24時間ごとに更新）`
            : "為替レート：デフォルト値を使用中（APIキー未設定）"}
        </div>
      </div>

      {/* Country tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {Object.values(COUNTRY_DATA).map((cd) => (
          <button
            key={cd.id}
            onClick={() => setCountry(cd.id)}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              border: `1.5px solid ${country === cd.id ? cd.accent : "#e3e9f5"}`,
              background: country === cd.id ? cd.accent : "#fff",
              color: country === cd.id ? "#fff" : "#5e6b86",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.14s",
              boxShadow: country === cd.id ? `0 4px 14px -4px ${cd.accent}66` : "none",
            }}
          >
            <span style={{ fontSize: 18 }}>{cd.flag}</span>
            <span>{cd.name}</span>
          </button>
        ))}
      </div>

      {/* Two-column layout — grid breakpoints via CSS (.sim-main-grid in index.css) */}
      <div className="sim-main-grid">
        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Duration */}
          <div style={simCardStyle}>
            <span style={simLabelStyle}>留学期間</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#5e6b86" }}>留学月数</span>
              <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 24, fontWeight: 600, color: "#141d33" }}>
                {duration}
                <span style={{ fontSize: 13, color: "#5e6b86", marginLeft: 3 }}>ヶ月</span>
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={24}
              step={1}
              value={duration}
              onChange={(e) => setDuration(+e.target.value)}
              style={{ width: "100%", accentColor: "#2f63e6" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#5e6b86",
                marginTop: 5,
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              <span>3ヶ月</span>
              <span>24ヶ月</span>
            </div>
          </div>

          {/* FX rate */}
          <div style={simCardStyle}>
            <span style={simLabelStyle}>{c.currency} / JPY · 為替レート</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <button style={simStepBtn} onClick={() => nudgeFx(-0.5)}>
                −
              </button>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 30, fontWeight: 600, color: "#141d33" }}>
                  {rate.toFixed(1)}
                </div>
                <div style={{ fontSize: 11, color: "#5e6b86", marginTop: 2 }}>
                  1 {c.currency} = ¥{rate.toFixed(1)}
                </div>
              </div>
              <button style={simStepBtn} onClick={() => nudgeFx(+0.5)}>
                +
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 11px",
                background: "#eaf0fe",
                borderRadius: 7,
                fontSize: 12,
                color: "#1f49b8",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2f63e6", flexShrink: 0 }} />
              為替リスク: <strong>{c.fxExposure}</strong> — ストレステストで調整
            </div>
          </div>

          {/* City tier */}
          <div style={simCardStyle}>
            <span style={simLabelStyle}>都市ティア</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tierKeys.map((key) => {
                const tier = CITY_TIERS[key];
                return (
                  <button
                    key={key}
                    onClick={() => setCityTier(key)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                      border: `1.5px solid ${cityTier === key ? "#2f63e6" : "#e3e9f5"}`,
                      background: cityTier === key ? "#eaf0fe" : "#fff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.12s",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: cityTier === key ? "#1f49b8" : "#1c2740" }}>
                        {tier.label}
                      </div>
                      <div style={{ fontSize: 12, color: "#5e6b86", marginTop: 2 }}>{c.cities[key]}</div>
                    </div>
                    <div
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: 12,
                        color: cityTier === key ? "#2f63e6" : "#5e6b86",
                      }}
                    >
                      ×{tier.mult.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Hero total */}
          <div
            className="sim-hero-card"
            style={{
              background: "#fff",
              border: "1px solid #e3e9f5",
              borderRadius: 14,
              boxShadow: "0 2px 4px rgba(20,29,51,.05), 0 12px 30px -12px rgba(20,29,51,.18)",
            }}
          >
            <div className="sim-hero-header" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: '"IBM Plex Mono", monospace',
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#5e6b86",
                    marginBottom: 10,
                  }}
                >
                  推定総額 · {duration} ヶ月 · {CITY_TIERS[cityTier].label}
                </div>
                <div
                  className="sim-total-cost"
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "#141d33",
                    lineHeight: 1,
                  }}
                >
                  ¥{finalTotalJpy.toLocaleString()}
                </div>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 14, color: "#5e6b86", marginTop: 8 }}>
                  {remitanceMode === "wise" && (
                    <span style={{ color: "#1f9268", fontWeight: 600 }}>
                      Wise利用時（手数料: ¥{wiseFeeJpy.toLocaleString()}）
                    </span>
                  )}
                  {remitanceMode === "bank" && (
                    <span>
                      ≈ {costs.symbol}
                      {Math.round(costs.total + costs.remittanceBase * currencyBankRate).toLocaleString()} ローカル換算
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: isSM ? "left" : "right", flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {/* Remittance label and toggle */}
                <div style={{ fontSize: 11, fontWeight: 600, color: "#5e6b86" }}>送金手段</div>
                <div style={{ display: "flex", gap: 6, background: "#f0f4ff", padding: "4px", borderRadius: 6 }}>
                  <button
                    onClick={() => setRemitanceMode("bank")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "none",
                      background: remitanceMode === "bank" ? "#fff" : "transparent",
                      color: remitanceMode === "bank" ? "#2f63e6" : "#8899bb",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    銀行
                  </button>
                  <button
                    onClick={() => setRemitanceMode("wise")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "none",
                      background: remitanceMode === "wise" ? "#fff" : "transparent",
                      color: remitanceMode === "wise" ? "#1f9268" : "#8899bb",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    Wise
                  </button>
                </div>
                <button
                  onClick={() => setShowDetailModal(true)}
                  style={{
                    fontSize: 10,
                    color: "#5e6b86",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "none",
                    transition: "color 0.12s",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#2f63e6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#5e6b86";
                  }}
                >
                  詳細を確認 →
                </button>
              </div>
            </div>

            {/* Segmented bar */}
            <div
              style={{
                height: 14,
                display: "flex",
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid #e3e9f5",
                marginBottom: 18,
              }}
            >
              {costs.items.map((item) => (
                <div
                  key={item.key}
                  style={{ width: `${item.pct * 100}%`, background: item.color, transition: "width 0.35s ease" }}
                  title={`${item.label}: ${costs.symbol}${Math.round(item.value).toLocaleString()} (${Math.round(
                    item.pct * 100
                  )}%)`}
                />
              ))}
            </div>

            {/* Breakdown rows with accordion */}
            {costs.items.map((item) => {
              const [expanded, setExpanded] = useState(false);

              return (
                <div key={item.key}>
                  <div
                    onClick={() => setExpanded(!expanded)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid #f0f4ff",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8faff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: item.color,
                          flexShrink: 0,
                          transition: "transform 0.2s",
                          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      />
                      {tooltips[item.label] ? (
                        <Tooltip label={item.label} description={tooltips[item.label]} />
                      ) : (
                        <span style={{ fontSize: 14, color: "#1c2740" }}>{item.label}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      {!isSM && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#5e6b86",
                            fontFamily: '"IBM Plex Mono", monospace',
                            minWidth: 34,
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {Math.round(item.pct * 100)}%
                        </span>
                      )}
                      <span
                        style={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: isSM ? 12 : 14,
                          fontWeight: 600,
                          color: "#1c2740",
                          minWidth: 60,
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {costs.symbol}
                        {Math.round(item.value).toLocaleString()}
                      </span>
                      <span
                        style={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: isSM ? 11 : 13,
                          color: "#5e6b86",
                          minWidth: 70,
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ¥{Math.round(item.value * rate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {expanded && (
                    <div
                      style={{
                        background: "#f8faff",
                        borderRadius: 8,
                        padding: "12px 16px",
                        margin: "8px 0 8px 16px",
                        fontSize: 12,
                        color: "#5e6b86",
                        border: "1px solid #e3e9f5",
                      }}
                    >
                      {item.key === "tuition" && (
                        <div style={{ lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 600, color: "#1c2740", marginBottom: 4 }}>年間学費の計算</div>
                          <div style={{ fontSize: 11, color: "#8899bb" }}>
                            {costs.symbol}
                            {Math.round(c.tuitionPerYear).toLocaleString()} × {(duration / 12).toFixed(1)}年
                          </div>
                        </div>
                      )}
                      {item.key === "housing" && (
                        <div style={{ lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 600, color: "#1c2740", marginBottom: 4 }}>賃料の計算</div>
                          <div style={{ fontSize: 11, color: "#8899bb" }}>
                            月額 {costs.symbol}
                            {Math.round(c.rentPerMonth).toLocaleString()} × {duration}ヶ月
                          </div>
                          <div style={{ fontSize: 11, color: "#8899bb", marginTop: 4 }}>
                            都市ティア倍率: {CITY_TIERS[cityTier].mult.toFixed(2)}× ({CITY_TIERS[cityTier].label})
                          </div>
                        </div>
                      )}
                      {item.key === "living" && (
                        <div style={{ lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 600, color: "#1c2740", marginBottom: 4 }}>生活費の計算</div>
                          <div style={{ fontSize: 11, color: "#8899bb" }}>
                            月額 {costs.symbol}
                            {Math.round(c.livingPerMonth).toLocaleString()} × {duration}ヶ月
                          </div>
                          <div style={{ fontSize: 11, color: "#8899bb", marginTop: 4 }}>
                            都市ティア倍率: {CITY_TIERS[cityTier].mult.toFixed(2)}× ({CITY_TIERS[cityTier].label})
                          </div>
                        </div>
                      )}
                      {item.key === "reserve" && (
                        <div style={{ lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 600, color: "#1c2740", marginBottom: 4 }}>資金証明額</div>
                          <div style={{ fontSize: 11, color: "#8899bb", marginBottom: 6 }}>
                            固定要件: {costs.symbol}
                            {Math.round(item.value).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 11, color: "#a0aec0" }}>{c.proofRule}</div>
                        </div>
                      )}
                      {item.key === "visa_insurance" && (
                        <div style={{ lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 600, color: "#1c2740", marginBottom: 4 }}>ビザ・保険料の計算</div>
                          {(country === "US" || country === "CA") && (
                            <div style={{ fontSize: 11, color: "#8899bb", marginBottom: 8 }}>
                              <div style={{ marginBottom: 6 }}>
                                ※{country === "US" ? "US" : "CA"}は義務的な公的医療保険制度がないため、民間医療保険への加入を想定し、目安として月額150（現地通貨）× {duration}ヶ月を計上しています。
                              </div>
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "#8899bb" }}>
                            国別のビザ・保険費用: {costs.symbol}
                            {Math.round(item.value).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Remittance cost anchor link */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0f4ff" }}>
              <button
                onClick={() => setShowRemittanceWidget(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 12,
                  color: "#2f63e6",
                  fontWeight: 600,
                  textAlign: "left",
                  lineHeight: 1.5,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                銀行とWiseでの送金手数料を比較する ↓
              </button>
            </div>
          </div>

          {/* Risk indicators — grid breakpoints via CSS (.sim-risk-grid in index.css) */}
          <div className="sim-risk-grid">
            <RiskCard label="ビザ難易度" level={c.visaDifficulty} value={c.visaLabel} />
            <RiskCard label="為替リスク" level={c.fxLevel} value={c.fxExposure} />
            <RiskCard label="承認率" level={approvalLevel} value={`${c.approvalRate}%`} />
          </div>

          {/* Visa note */}
          <div
            style={{
              background: "#eaf0fe",
              border: "1px solid #c8d9fd",
              borderRadius: 12,
              padding: "15px 20px",
              display: "flex",
              gap: 13,
            }}
          >
            <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>ℹ</div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: '"IBM Plex Mono", monospace',
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#2f63e6",
                  marginBottom: 6,
                }}
              >
                ビザ財政要件
              </div>
              <p style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.65, margin: 0 }}>{c.proofRule}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 送金手数料比較モーダル */}
      {showRemittanceWidget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 29, 51, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: 16,
          }}
          onClick={() => setShowRemittanceWidget(false)}
        >
          <div
            style={{
              background: "#f8faff",
              borderRadius: 16,
              padding: isSM ? "16px 12px" : "28px 24px",
              maxWidth: 540,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(20,29,51,.3)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRemittanceWidget(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: "#5e6b86",
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
            <RemittanceCostComparison hideAnchor />
          </div>
        </div>
      )}

      {/* Detail modal */}
      {showDetailModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: "rgba(20,29,51,0.7)" }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full overflow-auto shadow-2xl"
            style={{ maxWidth: 600, maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold" style={{ color: "#141d33" }}>
                海外送金コスト詳細説明
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Section 1: 銀行 */}
              <div className="pb-5 border-b border-gray-100">
                <h4 className="text-sm font-bold mb-2" style={{ color: "#141d33" }}>
                  🏦 銀行送金の実態
                </h4>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#5e6b86" }}>
                  一般的な銀行送金では、表面上の送金手数料とは別に、<strong className="text-gray-700">為替スプレッド</strong>という形で以下のコストが上乗せされている場合があります（※）。
                </p>
                <div className="rounded-lg px-4 py-3" style={{ background: "#f8faff" }}>
                  <ul className="text-xs space-y-1" style={{ color: "#1c2740" }}>
                    <li>・ アメリカ（USD）：約 <strong>1.0%〜</strong></li>
                    <li>・ イギリス（GBP）：約 <strong>2.5%〜</strong></li>
                    <li>・ オーストラリア（AUD）：約 <strong>2.5%〜</strong></li>
                    <li>・ カナダ（CAD）：約 <strong>1.8%〜</strong></li>
                  </ul>
                </div>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "#8899bb" }}>
                  ※上記は主要都市銀行の一般的な為替スプレッドの目安であり、ご利用の金融機関や送金タイミングにより大きく変動します。
                </p>
              </div>

              {/* Section 2: Wise */}
              <div className="pb-5 border-b border-gray-100">
                <h4 className="text-sm font-bold mb-2" style={{ color: "#141d33" }}>
                  ✨ Wiseの優位性
                </h4>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#5e6b86" }}>
                  Wiseは<strong className="text-gray-700">ミッドマーケットレート</strong>（実際の為替相場）を適用し、為替スプレッドをゼロに削減。純粋な手数料のみで着金できます。
                </p>
                <div className="rounded-lg px-4 py-3" style={{ background: "#e8f5e9" }}>
                  <p className="text-xs leading-relaxed font-medium" style={{ color: "#1b5e20" }}>
                    当シミュレーターでは、目安として送金額の約0.6%〜1.0%前後（※）の手数料として算出しています。
                  </p>
                </div>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "#8899bb" }}>
                  ※実際の手数料は通貨ルートや送金方法によって異なります。
                </p>
              </div>

              {/* Section 3: 計算根拠 */}
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: "#141d33" }}>
                  📊 誠実な計算根拠
                </h4>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#5e6b86" }}>
                  本計算では、以下の費用を<strong className="text-gray-700">送金対象から正しく除外</strong>しています。これらは事前の海外送金が不要な費用です。
                </p>
                <div className="rounded-lg px-4 py-3" style={{ background: "#f8faff" }}>
                  <ul className="text-xs space-y-2 leading-relaxed" style={{ color: "#5e6b86" }}>
                    <li>・ <strong className="text-gray-700">生活費（残高証明用）</strong>：ビザ審査のための形式的な証明であり、実際には現地で使用</li>
                    <li>・ <strong className="text-gray-700">航空券代</strong>：事前の海外送金対象ではなく、現地到着時の支払い</li>
                  </ul>
                </div>
                <p className="text-xs mt-3 font-semibold" style={{ color: "#2f63e6" }}>
                  送金対象 ＝ 授業料（学費） ＋ 住居費（滞在デポジット）
                </p>
              </div>
            </div>

            {/* Disclaimer + Footer */}
            <div className="px-6 pb-6 flex flex-col gap-4">
              <div className="rounded-lg px-4 py-3 border border-gray-100" style={{ background: "#fafafa" }}>
                <p className="text-xs leading-relaxed" style={{ color: "#a0aec0" }}>
                  【免責事項】本シミュレーターの計算結果はあくまで概算であり、実際の送金コストや為替レートを保証するものではありません。正確な手数料や最終的な送金額については、必ず送金実行時にWise公式サイトおよび各金融機関にて直接ご確認ください。
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: "#2f63e6" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1f49b8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2f63e6")}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimulationView;
