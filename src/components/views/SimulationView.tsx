import type { CSSProperties } from "react";
import { useState, useEffect } from "react";
import { CITY_TIERS, COUNTRY_DATA } from "../../constants/countries";
import { calcCosts } from "../../utils/calculator";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { WisePasswordModal } from "../WisePasswordModal";
import type { CityTierKey, CountryId, Fx, StudyType } from "../../types";

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
}: SimulationViewProps) {
  const isSM = useWindowWidth() < 1024;
  const c = COUNTRY_DATA[country];
  const costs = calcCosts(country, duration, fx, cityTier, studyType);
  const rate = fx[c.currency];
  const [remitanceMode, setRemitanceMode] = useState<"bank" | "wise">("bank");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [wiseUnlocked, setWiseUnlocked] = useState(false);
  const [showWisePasswordModal, setShowWisePasswordModal] = useState(false);

  // 初期化時 localStorage から Wise ロック状態を読み込む
  useEffect(() => {
    if (localStorage.getItem("wise_unlocked") === "true") {
      setWiseUnlocked(true);
    }
  }, []);

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
  const savingsJpy = bankFeeJpy - wiseFeeJpy;

  const finalTotalJpy =
    remitanceMode === "wise" ? costs.totalJPY - wiseFeeJpy : costs.totalJPY + bankFeeJpy;

  return (
    <div className="sim-outer-wrap" style={{ maxWidth: 1160, margin: "0 auto" }}>
      <div style={{ marginBottom: 26 }}>
        <span style={{ ...simLabelStyle, display: "block", marginBottom: 6 }}>詳細シミュレーション</span>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#141d33", letterSpacing: "-0.02em", margin: 0 }}>
          総費用試算
        </h2>
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
                    onClick={() => {
                      if (wiseUnlocked) {
                        setRemitanceMode("wise");
                      } else {
                        setShowWisePasswordModal(true);
                      }
                    }}
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
                      opacity: wiseUnlocked ? 1 : 0.6,
                    }}
                  >
                    Wise {!wiseUnlocked && "🔒"}
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (wiseUnlocked) {
                      setShowDetailModal(true);
                    } else {
                      setShowWisePasswordModal(true);
                    }
                  }}
                  style={{
                    fontSize: 10,
                    color: wiseUnlocked ? "#5e6b86" : "#ccc",
                    background: "none",
                    border: "none",
                    cursor: wiseUnlocked ? "pointer" : "not-allowed",
                    textDecoration: "none",
                    transition: "color 0.12s",
                    padding: 0,
                    opacity: wiseUnlocked ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (wiseUnlocked) e.currentTarget.style.color = "#2f63e6";
                  }}
                  onMouseLeave={(e) => {
                    if (wiseUnlocked) e.currentTarget.style.color = "#5e6b86";
                  }}
                >
                  詳細を確認 {!wiseUnlocked && "🔒"} →
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

            {/* Remittance cost UI */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0f4ff" }}>
              {remitanceMode === "bank" ? (
                <div
                  style={{
                    background: "#f5f5f5",
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    padding: "14px 16px",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 14, flexShrink: 0 }}>⚠️</div>
                  <div>
                    <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
                      ※一般的な銀行送金の場合、為替スプレッド等により約 <strong>¥{bankFeeJpy.toLocaleString()}</strong> の隠れコストが含まれています。
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 24,
                          background: "#ddd",
                          borderRadius: 4,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: "#999",
                            borderRadius: 4,
                            width: "100%",
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>銀行手数料</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#e8f5e9",
                    border: "1px solid #4caf50",
                    borderRadius: 8,
                    padding: "14px 16px",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 14, flexShrink: 0 }}>✨</div>
                  <div>
                    <div style={{ fontSize: 12, color: "#1b5e20", lineHeight: 1.6, fontWeight: 600 }}>
                      Wiseの利用により、送金コストを約 <strong>¥{savingsJpy.toLocaleString()}</strong> 節約できます。
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 24,
                          background: "#ddd",
                          borderRadius: 4,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: "#4caf50",
                            borderRadius: 4,
                            width: `${(wiseFeeJpy / bankFeeJpy) * 100}%`,
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: "#4caf50", fontWeight: 600 }}>Wise手数料</div>
                    </div>
                    <a
                      href="#"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 10,
                        fontSize: 11,
                        color: "#4caf50",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          background: "#f0f0f0",
                          color: "#666",
                          padding: "2px 4px",
                          borderRadius: 3,
                          fontWeight: 700,
                        }}
                      >
                        [PR]
                      </span>
                      Wiseで送金シミュレーションを行う ↗
                    </a>
                  </div>
                </div>
              )}
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

      {/* Detail modal */}
      {showDetailModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(20, 29, 51, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: isSM ? "20px 16px" : "32px 40px",
              maxWidth: 600,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(20, 29, 51, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#141d33", margin: 0 }}>
                海外送金コスト詳細説明
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#5e6b86",
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Bank explanation */}
              <div style={{ paddingBottom: 16, borderBottom: "1px solid #e3e9f5" }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#141d33", marginBottom: 10 }}>
                  🏦 銀行送金の実態
                </h4>
                <p style={{ fontSize: 13, color: "#5e6b86", lineHeight: 1.6, margin: 0, marginBottom: 8 }}>
                  一般的な銀行送金では、表面上の送金手数料とは別に、<strong>為替スプレッド</strong>という形で以下のコストが隠れています。
                </p>
                <div style={{ background: "#f8faff", padding: 12, borderRadius: 8, marginTop: 8 }}>
                  <p style={{ fontSize: 12, color: "#141d33", margin: 0, lineHeight: 1.6 }}>
                    • アメリカ（USD）: 総額の <strong>1.0%</strong>
                    <br />
                    • イギリス（GBP）: 総額の <strong>2.5%</strong>
                    <br />
                    • オーストラリア（AUD）: 総額の <strong>2.5%</strong>
                    <br />
                    • カナダ（CAD）: 総額の <strong>1.8%</strong>
                  </p>
                </div>
              </div>

              {/* Wise explanation */}
              <div style={{ paddingBottom: 16, borderBottom: "1px solid #e3e9f5" }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#141d33", marginBottom: 10 }}>
                  ✨ Wiseの優位性
                </h4>
                <p style={{ fontSize: 13, color: "#5e6b86", lineHeight: 1.6, margin: 0, marginBottom: 8 }}>
                  Wiseは<strong>ミッドマーケットレート</strong>（実際の為替相場）を適用し、為替スプレッドをゼロに削減。
                  純粋な手数料のみで着金できます。
                </p>
                <div style={{ background: "#e8f5e9", padding: 12, borderRadius: 8, marginTop: 8 }}>
                  <p style={{ fontSize: 12, color: "#1b5e20", margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
                    国に関わらず、送金対象額に対し一律 <strong>0.6%</strong> の手数料のみ。
                  </p>
                </div>
              </div>

              {/* Calculation base */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#141d33", marginBottom: 10 }}>
                  📊 誠実な計算根拠
                </h4>
                <p style={{ fontSize: 13, color: "#5e6b86", lineHeight: 1.6, margin: 0 }}>
                  本計算では、以下の費用を<strong>送金対象から正しく除外</strong>しています。
                  これらは事前の海外送金が不要な費用です。
                </p>
                <div style={{ background: "#f8faff", padding: 12, borderRadius: 8, marginTop: 8 }}>
                  <p style={{ fontSize: 12, color: "#5e6b86", margin: 0, lineHeight: 1.6 }}>
                    ✓ <strong>生活費（残高証明用）</strong>: ビザ審査のための形式的な証明であり、実際には現地で使用
                    <br />
                    ✓ <strong>航空券代</strong>: 事前の海外送金対象ではなく、現地到着時の支払い
                  </p>
                </div>
                <p style={{ fontSize: 12, color: "#8899bb", marginTop: 12, marginBottom: 0 }}>
                  送金対象 = 授業料（学費）+ 住居費（滞在デポジット）
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                width: "100%",
                marginTop: 28,
                padding: "10px 16px",
                background: "#2f63e6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1f49b8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2f63e6";
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* Wise パスワード保護 Modal */}
      {showWisePasswordModal && (
        <WisePasswordModal
          onUnlock={() => {
            setWiseUnlocked(true);
            setShowWisePasswordModal(false);
          }}
          onClose={() => setShowWisePasswordModal(false)}
        />
      )}
    </div>
  );
}

export default SimulationView;
