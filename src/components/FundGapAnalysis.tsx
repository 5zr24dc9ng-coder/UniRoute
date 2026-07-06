import { useEffect, useMemo, useState } from "react";

interface FundGapAnalysisProps {
  /** シミュレーションの推定総額（円） */
  targetAmountJpy: number;
  isPremium: boolean;
  onUpgradeClick: () => void;
}

function fmtYen(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

function formatDateJp(date: Date): string {
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

function PremiumLockBanner({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1.5px dashed #a5b4fc",
        borderRadius: 12,
        padding: "14px 18px",
        background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 16 }}>🔒</span>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>P</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#4338ca" }}>プレミアム機能</span>
        </div>
        <div style={{ fontSize: 12, color: "#6366f1", marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}

/** 出国日までの残り月数（切り上げ、最低1ヶ月） */
function monthsUntil(departureDateStr: string): number | null {
  if (!departureDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dep = new Date(departureDateStr + "T00:00:00");
  const diffDays = Math.ceil((dep.getTime() - today.getTime()) / 86_400_000);
  if (diffDays <= 0) return 0;
  return Math.max(1, Math.ceil(diffDays / 30.44));
}

export function FundGapAnalysis({ targetAmountJpy, isPremium, onUpgradeClick }: FundGapAnalysisProps) {
  const [currentSavings, setCurrentSavings] = useState<number>(() => {
    const raw = localStorage.getItem("uniroute_current_savings_jpy");
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  });

  const [departureDate, setDepartureDate] = useState<string>(
    () => localStorage.getItem("uniroute_departure_date") ?? ""
  );

  useEffect(() => {
    localStorage.setItem("uniroute_current_savings_jpy", String(currentSavings));
  }, [currentSavings]);

  useEffect(() => {
    if (departureDate) localStorage.setItem("uniroute_departure_date", departureDate);
  }, [departureDate]);

  const monthsRemaining = useMemo(() => monthsUntil(departureDate), [departureDate]);

  const gap = targetAmountJpy - currentSavings;
  const isAchieved = gap <= 0;
  const progressPct = targetAmountJpy > 0
    ? Math.min(100, Math.max(0, (currentSavings / targetAmountJpy) * 100))
    : 0;

  const monthlyNeeded =
    !isAchieved && monthsRemaining && monthsRemaining > 0
      ? Math.ceil(gap / monthsRemaining)
      : 0;

  // ─── グラフ用データ：今日から出国日まで、線形に積み立てた場合の累計貯蓄額 ───
  const chartPoints = useMemo(() => {
    if (!monthsRemaining || monthsRemaining < 1 || isAchieved) return [];
    const pts: { month: number; value: number }[] = [];
    for (let i = 0; i <= monthsRemaining; i++) {
      pts.push({ month: i, value: currentSavings + (gap * i) / monthsRemaining });
    }
    return pts;
  }, [monthsRemaining, currentSavings, gap, isAchieved]);

  const chartW = 600;
  const chartH = 180;
  const padL = 8;
  const padR = 8;
  const padT = 14;
  const padB = 28;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const maxVal = Math.max(targetAmountJpy, currentSavings, 1);

  function xFor(i: number): number {
    if (!monthsRemaining) return padL;
    return padL + (i / monthsRemaining) * plotW;
  }
  function yFor(v: number): number {
    return padT + plotH - (v / maxVal) * plotH;
  }

  const pathD = chartPoints
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xFor(p.month).toFixed(1)} ${yFor(p.value).toFixed(1)}`)
    .join(" ");

  const dateInputStyle: React.CSSProperties = {
    border: "1.5px solid #c7d2fe",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    color: "#1c2740",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e3e9f5", overflow: "hidden" }}>
      <div style={{ background: "#eef2ff", padding: "16px 24px", borderBottom: "1px solid #e3e9f5" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
          <span
            style={{
              width: 22, height: 22, borderRadius: 6,
              background: "#4f46e5", color: "#fff",
              fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            $
          </span>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#4338ca", margin: 0 }}>資金ギャップ分析</p>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>P</span>
        </div>
        <p style={{ fontSize: 11, color: "#8899bb", margin: 0 }}>
          今いくらあれば、月いくら貯めれば目標に届くか
        </p>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {!isPremium ? (
          <PremiumLockBanner text="現在の所持金から逆算した貯蓄プランの表示はプレミアムプランで利用できます" onClick={onUpgradeClick} />
        ) : (
          <>
            {/* ── 入力エリア ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: "#8899bb", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                  現在の所持金（円）
                </p>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={currentSavings || ""}
                  onChange={(e) => setCurrentSavings(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="例：500000"
                  style={{
                    border: "1.5px solid #c7d2fe",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 14,
                    fontFamily: '"IBM Plex Mono", monospace',
                    color: "#1c2740",
                    width: 160,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#8899bb", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                  出国予定日
                </p>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  style={dateInputStyle}
                />
              </div>
            </div>

            {/* ── 結果サマリー ── */}
            {isAchieved && targetAmountJpy > 0 ? (
              <div
                style={{
                  background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
                  padding: "16px 18px", textAlign: "center",
                }}
              >
                <p style={{ fontSize: 15, fontWeight: 700, color: "#16a34a", margin: 0 }}>
                  🎉 目標額まで到達済みです（余裕 ¥{fmtYen(-gap)}）
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: "1 1 140px", background: "#f8faff", borderRadius: 10, padding: "12px 16px" }}>
                    <p style={{ fontSize: 11, color: "#8899bb", margin: "0 0 4px" }}>目標額まであと</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                      ¥{fmtYen(gap)}
                    </p>
                  </div>
                  <div style={{ flex: "1 1 140px", background: "#eef2ff", borderRadius: 10, padding: "12px 16px", border: "1px solid #c7d2fe" }}>
                    <p style={{ fontSize: 11, color: "#6366f1", margin: "0 0 4px" }}>
                      {monthsRemaining ? `月々の貯蓄目安（残り${monthsRemaining}ヶ月）` : "月々の貯蓄目安"}
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#4338ca", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                      {monthsRemaining ? `¥${fmtYen(monthlyNeeded)}` : "出国日を入力"}
                    </p>
                  </div>
                </div>

                {/* ── 進捗バー ── */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5e6b86", marginBottom: 6 }}>
                    <span>現在 ¥{fmtYen(currentSavings)}</span>
                    <span>目標 ¥{fmtYen(targetAmountJpy)}</span>
                  </div>
                  <div style={{ height: 10, background: "#e3e9f5", borderRadius: 5, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${progressPct}%`,
                        background: "#4f46e5",
                        borderRadius: 5,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: "#8899bb", margin: "6px 0 0", textAlign: "right" }}>
                    達成率 {progressPct.toFixed(1)}%
                  </p>
                </div>

                {/* ── 貯蓄プラン グラフ ── */}
                {monthsRemaining !== null && monthsRemaining > 0 && chartPoints.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 8px" }}>
                      毎月均等に貯蓄した場合の累計残高の推移
                    </p>
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height={chartH} style={{ display: "block" }}>
                      {/* 目標ライン */}
                      <line
                        x1={padL} x2={chartW - padR}
                        y1={yFor(targetAmountJpy)} y2={yFor(targetAmountJpy)}
                        stroke="#a0aec0" strokeDasharray="4 4" strokeWidth={1}
                      />
                      <text x={chartW - padR} y={yFor(targetAmountJpy) - 6} textAnchor="end" fontSize="10" fill="#8899bb">
                        目標 ¥{fmtYen(targetAmountJpy)}
                      </text>

                      {/* 積立ライン */}
                      <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinecap="round" />

                      {/* 開始点・終了点 */}
                      <circle cx={xFor(0)} cy={yFor(currentSavings)} r={4} fill="#4f46e5" />
                      <circle cx={xFor(monthsRemaining)} cy={yFor(targetAmountJpy)} r={4} fill="#4f46e5" />

                      {/* 軸ラベル */}
                      <text x={padL} y={chartH - 6} fontSize="10" fill="#8899bb">
                        今日
                      </text>
                      <text x={chartW - padR} y={chartH - 6} textAnchor="end" fontSize="10" fill="#8899bb">
                        {formatDateJp(new Date(departureDate + "T00:00:00"))}
                      </text>
                    </svg>
                  </div>
                )}

                {monthsRemaining === 0 && (
                  <p style={{ fontSize: 12, color: "#cf4a4a", margin: 0 }}>
                    ※ 出国予定日を過ぎているか、本日が出国日です。至急資金を確保してください。
                  </p>
                )}
              </>
            )}

            <p style={{ fontSize: 11, color: "#8899bb", margin: "16px 0 0", lineHeight: 1.7 }}>
              ※ 目標額はシミュレーションの推定総額（送金手数料込み）です。実際の貯蓄計画は、収入・支出の変動を考慮して余裕を持って立ててください。
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default FundGapAnalysis;
