import type { CSSProperties } from "react";
import { useState, useEffect } from "react";
import { CITY_TIERS, COUNTRY_DATA } from "../../constants/countries";
import { calcCosts } from "../../utils/calculator";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import type { CityTierKey, CostItem, CountryId, Fx, SimScenario, StudyType } from "../../types";
import { RemittanceCostComparison } from "../RemittanceCostComparison";
import { FundGapAnalysis } from "../FundGapAnalysis";
import { ScholarshipOffset } from "../ScholarshipOffset";
import { ScenarioComparisonTable } from "../ScenarioComparisonTable";
import { b64EncodeUnicode } from "../../utils/base64";

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

// ─── 費用内訳の円グラフ（ドーナツチャート） ─────────────────────────────────────
function CostDonutChart({
  items,
  centerLabel,
  centerValue,
}: {
  items: CostItem[];
  centerLabel: string;
  centerValue: string;
}) {
  const size = 160;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const visibleItems = items.filter((item) => item.value > 0);

  // 12時位置(-90deg)を起点に、各項目のpctから弧の開始・終了角度を算出する。
  // 以前はstroke-dasharray/-dashoffsetを使い5つの円を重ねて描画していたが、
  // 各circle要素ごとに独立してdash長を計算するため浮動小数点誤差が蓄積し、
  // 12時位置（最後の項目と最初の項目のつなぎ目）にわずかな隙間/重なりが visualに
  // 現れるバグがあった。角度ベースのパス（弧）で1本ずつ描く方式に変更し解消する。
  let cumulativeAngle = -90;
  const arcs = visibleItems.map((item) => {
    const startAngle = cumulativeAngle;
    const endAngle = startAngle + item.pct * 360;
    cumulativeAngle = endAngle;
    return { item, startAngle, endAngle };
  });

  function pointOnCircle(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", position: "relative", marginBottom: 18 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f0f4ff" strokeWidth={strokeWidth} />
        {arcs.length === 1 ? (
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={arcs[0].item.color} strokeWidth={strokeWidth}>
            <title>{`${arcs[0].item.label}: 100%`}</title>
          </circle>
        ) : (
          arcs.map(({ item, startAngle, endAngle }) => {
            const start = pointOnCircle(startAngle);
            const end = pointOnCircle(endAngle);
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            return (
              <path
                key={item.key}
                d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
              >
                <title>{`${item.label}: ${Math.round(item.pct * 100)}%`}</title>
              </path>
            );
          })
        )}
      </svg>
      <div
        style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          textAlign: "center", pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: 10, color: "#8899bb", letterSpacing: "0.06em" }}>{centerLabel}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#141d33", fontFamily: '"IBM Plex Mono", monospace' }}>
          {centerValue}
        </div>
      </div>
    </div>
  );
}

const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  DEGREE: "正規留学",
  EXCHANGE: "交換留学",
  LANGUAGE: "語学留学",
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

function RiskCard({ label, level, value, tooltip }: { label: string; level: number; value: string; tooltip?: string }) {
  const [showTip, setShowTip] = useState(false);
  const palette = ["#1f9268", "#c2792a", "#cf4a4a"];
  const color = palette[Math.min(level - 1, 2)];
  return (
    <div style={{ ...simCardStyle, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 13, position: "relative" }}>
        <span style={{ ...simLabelStyle, marginBottom: 0 }}>{label}</span>
        {tooltip && (
          <div
            style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "1.5px solid #a0aec0", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: "#8899bb", cursor: "pointer", flexShrink: 0,
              background: "#f8faff",
            }}
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            onClick={() => setShowTip((v) => !v)}
          >
            ?
          </div>
        )}
        {showTip && tooltip && (
          <div
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0,
              background: "#141d33", color: "#fff", fontSize: 12,
              padding: "10px 14px", borderRadius: 6, whiteSpace: "normal",
              zIndex: 10, maxWidth: 220, boxShadow: "0 4px 12px rgba(20,29,51,.3)",
              pointerEvents: "none", lineHeight: 1.5,
            }}
          >
            {tooltip}
          </div>
        )}
      </div>
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
  setStudyType: (t: StudyType) => void;
  duration: number;
  setDuration: (d: number) => void;
  fx: Fx;
  setFx: React.Dispatch<React.SetStateAction<Fx>>;
  cityTier: CityTierKey;
  setCityTier: (t: CityTierKey) => void;
  lastUpdated?: Date | null;
  isPremium: boolean;
  onUpgradeClick: () => void;
}

export function SimulationView({
  country,
  setCountry,
  studyType,
  setStudyType,
  duration,
  setDuration,
  fx,
  setFx,
  cityTier,
  setCityTier,
  lastUpdated,
  isPremium,
  onUpgradeClick,
}: SimulationViewProps) {
  const isSM = useWindowWidth() < 1024;
  const c = COUNTRY_DATA[country];
  const costs = calcCosts(country, duration, fx, cityTier, studyType);
  const rate = fx[c.currency];
  const [remitanceMode, setRemitanceMode] = useState<"bank" | "wise">("bank");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRemittanceWidget, setShowRemittanceWidget] = useState(false);

  // ─── シナリオ (premium) ──────────────────────────────────────────────────
  const [scenarios, setScenarios] = useState<SimScenario[]>(() => {
    try { return JSON.parse(localStorage.getItem("uniroute_sim_scenarios") ?? "[]"); }
    catch { return []; }
  });
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // ─── 家族への共有レポート (premium) ─────────────────────────────────────────
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareSections, setShareSections] = useState({ total: true, breakdown: true, visa: true });
  const [compareShareIds, setCompareShareIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("uniroute_sim_scenarios", JSON.stringify(scenarios));
  }, [scenarios]);

  function buildShareUrl(overrideCompareIds?: string[]): string {
    const params = new URLSearchParams();
    params.set("share", "1");
    params.set("country", country);
    params.set("studyType", studyType);
    params.set("duration", String(duration));
    params.set("cityTier", cityTier);
    params.set("remit", remitanceMode);
    params.set("gbp", String(fx.GBP));
    params.set("usd", String(fx.USD));
    params.set("aud", String(fx.AUD));
    params.set("cad", String(fx.CAD));
    try {
      const schMonthly = localStorage.getItem("uniroute_scholarship_monthly_jpy");
      const schLump = localStorage.getItem("uniroute_scholarship_lumpsum_jpy");
      const schMonths = localStorage.getItem("uniroute_scholarship_coverage_months");
      if (schMonthly && Number(schMonthly) > 0) params.set("schMonthly", schMonthly);
      if (schLump && Number(schLump) > 0) params.set("schLump", schLump);
      if (schMonths && Number(schMonths) > 0) params.set("schMonths", schMonths);
    } catch {
      // localStorage が使えない環境では奨学金情報を省略して続行
    }
    const chosenSections = Object.entries(shareSections)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
    params.set("sections", chosenSections.join(","));

    const compareIds = overrideCompareIds ?? compareShareIds;
    const selectedScenarios = scenarios.filter((s) => compareIds.includes(s.id));
    if (selectedScenarios.length >= 2) {
      const payload = selectedScenarios.map((s) => ({
        name: s.name,
        country: s.country,
        studyType: s.studyType ?? "DEGREE",
        duration: s.duration,
        cityTier: s.cityTier,
      }));
      params.set("cmp", b64EncodeUnicode(JSON.stringify(payload)));
    }

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  function openShareModal() {
    setCompareShareIds([]);
    setShareUrl(buildShareUrl([]));
    setShareCopied(false);
    setShareModalOpen(true);
  }

  function toggleShareSection(key: keyof typeof shareSections) {
    setShareSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleCompareShareId(id: string) {
    setCompareShareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  // チェックボックスの変更に合わせて共有URLを再生成する
  useEffect(() => {
    if (shareModalOpen) {
      setShareUrl(buildShareUrl());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareSections, compareShareIds]);

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
    } catch {
      setShareCopied(false);
    }
  }

  function saveScenario() {
    if (!scenarioName.trim()) return;
    const s: SimScenario = { id: Date.now().toString(), name: scenarioName.trim(), country, studyType, duration, cityTier };
    setScenarios((prev) => [...prev, s]);
    setActiveScenarioId(s.id);
    setScenarioName("");
    setSaveModalOpen(false);
  }

  function loadScenario(s: SimScenario) {
    setCountry(s.country);
    setStudyType(s.studyType ?? "DEGREE");
    setDuration(s.duration);
    setCityTier(s.cityTier);
    setActiveScenarioId(s.id);
  }

  function deleteScenario(id: string) {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    if (activeScenarioId === id) setActiveScenarioId(null);
  }

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

      {/* ─── シナリオバー (premium) ─────────────────────────────────────── */}
      {isPremium && (
        <div style={{ marginBottom: 22, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em", flexShrink: 0 }}>P</span>
          {scenarios.map((s) => (
            <div
              key={s.id}
              onClick={() => loadScenario(s)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 20,
                border: `1.5px solid ${activeScenarioId === s.id ? "#2f63e6" : "#e3e9f5"}`,
                background: activeScenarioId === s.id ? "#eef4ff" : "#fff",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                color: activeScenarioId === s.id ? "#2f63e6" : "#5e6b86",
                transition: "all 0.15s",
              }}
            >
              {s.name}
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>
                {s.country} · {STUDY_TYPE_LABEL[s.studyType ?? "DEGREE"]} · {s.duration}ヶ月
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteScenario(s.id); }}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setSaveModalOpen(true)}
            style={{
              padding: "5px 14px", borderRadius: 20,
              border: "1.5px dashed #c8d9fd", background: "transparent",
              color: "#2f63e6", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            + 保存
          </button>
          <button
            onClick={() => setCompareModalOpen(true)}
            disabled={scenarios.length < 2}
            title={scenarios.length < 2 ? "比較するには2件以上シナリオを保存してください" : undefined}
            style={{
              padding: "5px 14px", borderRadius: 20,
              border: "1.5px solid #4f46e5",
              background: scenarios.length < 2 ? "#eef2ff" : "#4f46e5",
              color: scenarios.length < 2 ? "#a5b4fc" : "#fff",
              fontSize: 12, fontWeight: 600,
              cursor: scenarios.length < 2 ? "not-allowed" : "pointer",
              opacity: scenarios.length < 2 ? 0.7 : 1,
            }}
          >
            ⇄ 比較する
          </button>
          <button
            onClick={openShareModal}
            style={{
              padding: "5px 14px", borderRadius: 20,
              border: "1.5px solid #1f9268",
              background: "#fff",
              color: "#1f9268", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            👪 家族に共有
          </button>
        </div>
      )}

      {/* シナリオ比較モーダル (premium) */}
      {compareModalOpen && (
        <ScenarioComparisonTable
          scenarios={scenarios}
          fx={fx}
          onClose={() => setCompareModalOpen(false)}
        />
      )}

      {/* 家族への共有レポート モーダル (premium) */}
      {shareModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(20,29,51,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={() => setShareModalOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: 14, padding: 28, width: 440, maxWidth: "100%", boxShadow: "0 20px 60px rgba(20,29,51,.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>P</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#141d33", margin: 0 }}>家族に共有</h3>
            </div>
            <p style={{ fontSize: 12, color: "#5e6b86", margin: "0 0 16px", lineHeight: 1.6 }}>
              このリンクを開くと、今の設定内容が閲覧専用のレポートとして表示されます。ログインは不要です。開いたページから印刷・PDF保存もできるので、親御さんへの説明にそのまま使えます。
            </p>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1c2740", marginBottom: 8 }}>PDFに含める項目</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(
                  [
                    { key: "total", label: "総額" },
                    { key: "breakdown", label: "内訳" },
                    { key: "visa", label: "ビザ・資金証明" },
                  ] as const
                ).map(({ key, label }) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#5e6b86", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={shareSections[key]}
                      onChange={() => toggleShareSection(key)}
                      style={{ width: 14, height: 14, cursor: "pointer" }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            {scenarios.length >= 2 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1c2740", marginBottom: 8 }}>
                  比較表に含めるシナリオ（最大5件）
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflow: "auto" }}>
                  {scenarios.map((s) => {
                    const checked = compareShareIds.includes(s.id);
                    const disabled = !checked && compareShareIds.length >= 5;
                    return (
                      <label
                        key={s.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, fontSize: 12.5,
                          color: disabled ? "#c7d0e6" : "#5e6b86",
                          cursor: disabled ? "not-allowed" : "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleCompareShareId(s.id)}
                          style={{ width: 14, height: 14, cursor: disabled ? "not-allowed" : "pointer" }}
                        />
                        {s.name}（{COUNTRY_DATA[s.country].name}・{STUDY_TYPE_LABEL[s.studyType ?? "DEGREE"]}・{s.duration}ヶ月）
                      </label>
                    );
                  })}
                </div>
                {compareShareIds.length >= 5 && (
                  <p style={{ fontSize: 10.5, color: "#a0aec0", margin: "6px 0 0" }}>
                    最大5件まで選択できます
                  </p>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8,
                  border: "1.5px solid #c8d9fd", fontSize: 12, color: "#5e6b86",
                  outline: "none", boxSizing: "border-box", fontFamily: '"IBM Plex Mono", monospace',
                  background: "#f8faff",
                }}
              />
              <button
                onClick={copyShareUrl}
                style={{
                  padding: "10px 16px", borderRadius: 8, border: "none",
                  background: shareCopied ? "#16a34a" : "#2f63e6", color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {shareCopied ? "コピー済み ✓" : "コピー"}
              </button>
            </div>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#2f63e6", fontWeight: 600, textDecoration: "none" }}
            >
              プレビューを開く（新しいタブ） →
            </a>
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => setShareModalOpen(false)}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #e3e9f5", background: "#f8faff", fontSize: 13, cursor: "pointer", color: "#5e6b86" }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* シナリオ保存モーダル */}
      {saveModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(20,29,51,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
          onClick={() => setSaveModalOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: 14, padding: 28, width: 320, boxShadow: "0 20px 60px rgba(20,29,51,.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#141d33", margin: "0 0 8px" }}>シナリオを保存</h3>
            <p style={{ fontSize: 12, color: "#5e6b86", margin: "0 0 14px" }}>
              {COUNTRY_DATA[country].name} · {STUDY_TYPE_LABEL[studyType]} · {duration}ヶ月 · {CITY_TIERS[cityTier].label}
            </p>
            <input
              type="text"
              placeholder="例：ロンドン正規2年"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveScenario()}
              autoFocus
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #c8d9fd", fontSize: 14, color: "#1c2740",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 14,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setSaveModalOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #e3e9f5", background: "#f8faff", fontSize: 13, cursor: "pointer", color: "#5e6b86" }}>
                キャンセル
              </button>
              <button
                onClick={saveScenario}
                disabled={!scenarioName.trim()}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: scenarioName.trim() ? "#2f63e6" : "#e3e9f5", color: scenarioName.trim() ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: 600, cursor: scenarioName.trim() ? "pointer" : "not-allowed" }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

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
                  推定総額（送金手数料込み） · {duration} ヶ月 · {CITY_TIERS[cityTier].label}
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

            {/* 内訳の円グラフ — リングは costs.items（内訳5項目）の合計に対する割合のため、
                中央表示も同じ costs.totalJPY を使う（送金手数料込みの finalTotalJpy を出すとリングと数字が一致しなくなる） */}
            <CostDonutChart items={costs.items} centerLabel="内訳合計" centerValue={`¥${costs.totalJPY.toLocaleString()}`} />


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

          {/* 資金ギャップ分析（premium） */}
          <FundGapAnalysis targetAmountJpy={finalTotalJpy} isPremium={isPremium} onUpgradeClick={onUpgradeClick} />

          {/* 奨学金オフセット計算（premium） */}
          <ScholarshipOffset targetAmountJpy={finalTotalJpy} durationMonths={duration} isPremium={isPremium} onUpgradeClick={onUpgradeClick} />

          {/* Risk indicators — grid breakpoints via CSS (.sim-risk-grid in index.css) */}
          <div className="sim-risk-grid">
            <RiskCard
              label="ビザ難易度"
              level={c.visaDifficulty}
              value={c.visaLabel}
              tooltip="承認率・平均審査日数に加え、面接の有無、資金証明の複雑さ、提出書類の煩雑さを踏まえた編集部による総合評価です。数値化しにくい要素を含むため、承認率や審査日数の数字だけとは完全には一致しません。"
            />
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
