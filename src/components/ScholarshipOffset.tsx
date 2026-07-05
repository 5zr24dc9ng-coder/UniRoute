import { useEffect, useMemo, useState } from "react";

interface ScholarshipOffsetProps {
  /** シミュレーションの推定総額（円） */
  targetAmountJpy: number;
  /** 留学期間（月） */
  durationMonths: number;
  isPremium: boolean;
}

function fmtYen(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

function PremiumLockBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        border: "1.5px dashed #a5b4fc",
        borderRadius: 12,
        padding: "14px 18px",
        background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
        display: "flex",
        alignItems: "center",
        gap: 10,
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

interface Preset {
  id: string;
  label: string;
  monthly: number;
  lumpSum: number;
  note: string;
}

// 2026年度時点の公式発表額をもとにした目安値。地域・家計基準により実際の金額は変動するため、
// 必ず各制度の公式サイト・在籍大学の窓口で最新情報を確認するよう案内する。
const PRESETS: Preset[] = [
  {
    id: "jasso-exchange",
    label: "JASSO 海外留学支援制度（協定派遣・交換留学向け）",
    monthly: 100000,
    lumpSum: 0,
    note: "月額目安 8万〜12万円（渡航先により変動）",
  },
  {
    id: "tobitate",
    label: "トビタテ！留学JAPAN（大学生等対象）",
    monthly: 120000,
    lumpSum: 150000,
    note: "月額6万/12万/16万円（家計基準・地域による）＋留学準備金15万〜25万円",
  },
  {
    id: "jasso-degree",
    label: "JASSO 学部学位取得型（正規留学）",
    monthly: 200000,
    lumpSum: 0,
    note: "月額目安 13.9万〜35.2万円（渡航先により変動）",
  },
];

export function ScholarshipOffset({ targetAmountJpy, durationMonths, isPremium }: ScholarshipOffsetProps) {
  const [monthlyAmount, setMonthlyAmount] = useState<number>(() => {
    const raw = localStorage.getItem("uniroute_scholarship_monthly_jpy");
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  });
  const [lumpSum, setLumpSum] = useState<number>(() => {
    const raw = localStorage.getItem("uniroute_scholarship_lumpsum_jpy");
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  });
  const [coverageMonths, setCoverageMonths] = useState<number>(() => {
    const raw = localStorage.getItem("uniroute_scholarship_coverage_months");
    const n = raw ? Number(raw) : durationMonths;
    return Number.isFinite(n) && n > 0 ? n : durationMonths;
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    () => localStorage.getItem("uniroute_scholarship_preset")
  );

  useEffect(() => {
    localStorage.setItem("uniroute_scholarship_monthly_jpy", String(monthlyAmount));
  }, [monthlyAmount]);
  useEffect(() => {
    localStorage.setItem("uniroute_scholarship_lumpsum_jpy", String(lumpSum));
  }, [lumpSum]);
  useEffect(() => {
    localStorage.setItem("uniroute_scholarship_coverage_months", String(coverageMonths));
  }, [coverageMonths]);
  useEffect(() => {
    if (selectedPreset) localStorage.setItem("uniroute_scholarship_preset", selectedPreset);
    else localStorage.removeItem("uniroute_scholarship_preset");
  }, [selectedPreset]);

  const cappedCoverageMonths = Math.min(coverageMonths, durationMonths);

  const totalScholarship = useMemo(
    () => monthlyAmount * cappedCoverageMonths + lumpSum,
    [monthlyAmount, cappedCoverageMonths, lumpSum]
  );

  const realCost = Math.max(0, targetAmountJpy - totalScholarship);
  const offsetPct = targetAmountJpy > 0 ? Math.min(100, (totalScholarship / targetAmountJpy) * 100) : 0;

  function applyPreset(p: Preset) {
    setSelectedPreset(p.id);
    setMonthlyAmount(p.monthly);
    setLumpSum(p.lumpSum);
    setCoverageMonths(durationMonths);
  }

  const numberInputStyle: React.CSSProperties = {
    border: "1.5px solid #bbf7d0",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    color: "#1c2740",
    width: 140,
    outline: "none",
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e3e9f5", overflow: "hidden" }}>
      <div style={{ background: "#f0faf5", padding: "16px 24px", borderBottom: "1px solid #e3e9f5" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
          <span
            style={{
              width: 22, height: 22, borderRadius: 6,
              background: "#1f9268", color: "#fff",
              fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            奨
          </span>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1f9268", margin: 0 }}>奨学金オフセット計算</p>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>P</span>
        </div>
        <p style={{ fontSize: 11, color: "#8899bb", margin: 0 }}>
          奨学金をもらった場合の実質負担額を計算
        </p>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {!isPremium ? (
          <PremiumLockBanner text="奨学金額を差し引いた実質負担額の表示はプレミアムプランで利用できます" />
        ) : (
          <>
            {/* ── プリセット ── */}
            <p style={{ fontSize: 11, color: "#8899bb", margin: "0 0 8px" }}>主要な奨学金制度から選ぶ（目安額）</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${selectedPreset === p.id ? "#1f9268" : "#e3e9f5"}`,
                    background: selectedPreset === p.id ? "#f0faf5" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedPreset === p.id ? "#15803d" : "#1c2740" }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#8899bb", marginTop: 2 }}>{p.note}</div>
                </button>
              ))}
            </div>

            {/* ── 入力エリア ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: "#8899bb", margin: "0 0 6px" }}>月額支給額（円）</p>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={monthlyAmount || ""}
                  onChange={(e) => { setMonthlyAmount(Math.max(0, Number(e.target.value) || 0)); setSelectedPreset(null); }}
                  placeholder="例：100000"
                  style={numberInputStyle}
                />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#8899bb", margin: "0 0 6px" }}>支給期間（ヶ月）</p>
                <input
                  type="number"
                  min={0}
                  max={durationMonths}
                  step={1}
                  value={cappedCoverageMonths || ""}
                  onChange={(e) => setCoverageMonths(Math.max(0, Math.min(durationMonths, Number(e.target.value) || 0)))}
                  style={{ ...numberInputStyle, width: 100 }}
                />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#8899bb", margin: "0 0 6px" }}>一時金（留学準備金など・任意）</p>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={lumpSum || ""}
                  onChange={(e) => { setLumpSum(Math.max(0, Number(e.target.value) || 0)); setSelectedPreset(null); }}
                  placeholder="例：150000"
                  style={numberInputStyle}
                />
              </div>
            </div>

            {/* ── 結果 ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: "1 1 140px", background: "#f0faf5", borderRadius: 10, padding: "12px 16px", border: "1px solid #bbf7d0" }}>
                <p style={{ fontSize: 11, color: "#15803d", margin: "0 0 4px" }}>奨学金総額</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#15803d", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                  ¥{fmtYen(totalScholarship)}
                </p>
              </div>
              <div style={{ flex: "1 1 140px", background: "#f8faff", borderRadius: 10, padding: "12px 16px" }}>
                <p style={{ fontSize: 11, color: "#8899bb", margin: "0 0 4px" }}>実質負担額</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                  ¥{fmtYen(realCost)}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5e6b86", marginBottom: 6 }}>
                <span>奨学金でカバー ¥{fmtYen(totalScholarship)}</span>
                <span>総額 ¥{fmtYen(targetAmountJpy)}</span>
              </div>
              <div style={{ height: 10, background: "#e3e9f5", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${offsetPct}%`, background: "#1f9268", borderRadius: 5, transition: "width 0.4s ease" }} />
              </div>
            </div>

            <p style={{ fontSize: 11, color: "#8899bb", margin: "16px 0 0", lineHeight: 1.7 }}>
              ※ プリセットの金額は2026年度時点の公式発表に基づく目安です。実際の支給額は渡航先の国・地域や家計基準、大学ごとの選考結果により異なります。必ず各制度の公式サイトおよび在籍大学の国際交流窓口で最新の金額をご確認ください。
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ScholarshipOffset;
