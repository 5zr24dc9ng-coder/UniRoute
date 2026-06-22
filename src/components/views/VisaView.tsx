import { useState, useMemo } from "react";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { useVisaCostCalculator } from "../../hooks/useVisaCostCalculator";
import { useProofOfFundsCalculator } from "../../hooks/useProofOfFundsCalculator";
import type { VisaInput } from "../../hooks/useVisaCostCalculator";
import type { StudyType, DependentsInput } from "../../hooks/useProofOfFundsCalculator";
import type { CountryCodeVisa } from "../../types";

const COUNTRIES: { id: CountryCodeVisa; label: string; flag: string }[] = [
  { id: "US", label: "アメリカ", flag: "🇺🇸" },
  { id: "CA", label: "カナダ", flag: "🇨🇦" },
  { id: "AU", label: "オーストラリア", flag: "🇦🇺" },
  { id: "UK", label: "イギリス", flag: "🇬🇧" },
];

const STUDY_TYPES: { id: StudyType; label: string }[] = [
  { id: "DEGREE", label: "正規留学" },
  { id: "EXCHANGE", label: "交換留学" },
  { id: "LANGUAGE", label: "語学留学" },
];

const DOC_CURRENCY_SYMBOL: Record<string, string> = { USD: "US$", CAD: "CA$", AUD: "A$" };

function fmt(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

function ToggleBtn({
  active,
  onClick,
  children,
  color = "#3b5bdb",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 8,
        border: `1.5px solid ${active ? color : "#e3e9f5"}`,
        background: active ? color : "#fff",
        color: active ? "#fff" : "#5e6b86",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function VisaView() {
  const isSmall = useWindowWidth() < 1024;

  const [country, setCountry] = useState<CountryCodeVisa>("US");
  const [studyType, setStudyType] = useState<StudyType>("DEGREE");
  const [durationMonths, setDurationMonths] = useState(12);
  const [spouse, setSpouse] = useState<0 | 1>(0);
  const [children, setChildren] = useState(0);

  // オブジェクト参照を安定させて不要な再計算を防ぐ
  const visaInput = useMemo<VisaInput>(() => {
    if (country === "US") {
      return { countryCode: "US", visaType: studyType === "EXCHANGE" ? "J1" : "F1" };
    }
    if (country === "CA") return { countryCode: "CA", visaType: "STUDY_PERMIT" };
    if (country === "AU") return { countryCode: "AU", visaType: "SUBCLASS_500" };
    return { countryCode: "UK", visaType: "STUDENT" };
  }, [country, studyType]);

  const dependents = useMemo<DependentsInput>(
    () => ({ spouse, children }),
    [spouse, children]
  );

  const visaCost = useVisaCostCalculator(visaInput);
  const proofOfFunds = useProofOfFundsCalculator(country, studyType, durationMonths, dependents);

  const pofSym = DOC_CURRENCY_SYMBOL[proofOfFunds.docCurrency] ?? "";

  const pad = isSmall ? "20px 16px" : "32px 40px";

  return (
    <div style={{ padding: pad, maxWidth: 1200, margin: "0 auto" }}>
      {/* ページタイトル */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: "#8899bb", letterSpacing: "0.08em", margin: "0 0 4px" }}>
          ビザ費用シミュレーション
        </p>
        <h1
          style={{ fontSize: isSmall ? 22 : 30, fontWeight: 800, color: "#1c2740", margin: 0 }}
        >
          手続き費用 &amp; 資金証明
        </h1>
      </div>

      {/* ─── コントロールパネル ─────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e3e9f5",
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* 国選択 */}
        <div>
          <p style={{ fontSize: 11, color: "#8899bb", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            国
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {COUNTRIES.map((c) => (
              <ToggleBtn key={c.id} active={country === c.id} onClick={() => setCountry(c.id)}>
                {c.flag} {c.label}
              </ToggleBtn>
            ))}
          </div>
        </div>

        {/* 留学タイプ */}
        <div>
          <p style={{ fontSize: 11, color: "#8899bb", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            留学タイプ
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STUDY_TYPES.map((s) => (
              <ToggleBtn
                key={s.id}
                active={studyType === s.id}
                onClick={() => setStudyType(s.id)}
                color="#1f9268"
              >
                {s.label}
              </ToggleBtn>
            ))}
          </div>
        </div>

        {/* 期間スライダー */}
        <div style={{ minWidth: 200 }}>
          <p style={{ fontSize: 11, color: "#8899bb", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            留学期間：
            <strong style={{ color: "#1c2740", fontSize: 13 }}>{durationMonths} ヶ月</strong>
          </p>
          <input
            type="range"
            min={3}
            max={24}
            step={1}
            value={durationMonths}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#3b5bdb" }}
          />
          <div
            style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8899bb", marginTop: 2 }}
          >
            <span>3ヶ月</span>
            <span>24ヶ月</span>
          </div>
        </div>

        {/* 同伴家族 */}
        <div>
          <p style={{ fontSize: 11, color: "#8899bb", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            同伴家族
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: "#5e6b86", margin: "0 0 4px" }}>配偶者</p>
              <div style={{ display: "flex", gap: 4 }}>
                {([0, 1] as const).map((v) => (
                  <ToggleBtn key={v} active={spouse === v} onClick={() => setSpouse(v)}>
                    {v}
                  </ToggleBtn>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#5e6b86", margin: "0 0 4px" }}>子供</p>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2, 3].map((v) => (
                  <ToggleBtn key={v} active={children === v} onClick={() => setChildren(v)}>
                    {v}
                  </ToggleBtn>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2分割エリア ──────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isSmall ? "1fr" : "1fr 1fr",
          gap: 20,
        }}
      >
        {/* ── Section A: ビザ申請手数料 ── */}
        <div
          style={{ background: "#fff", borderRadius: 14, border: "1px solid #e3e9f5", overflow: "hidden" }}
        >
          <div
            style={{
              background: "#f0f4ff",
              padding: "16px 24px",
              borderBottom: "1px solid #e3e9f5",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: "#3b5bdb", color: "#fff",
                  fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                A
              </span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#3b5bdb", margin: 0 }}>
                ビザ申請・手続き手数料
              </p>
            </div>
            <p style={{ fontSize: 11, color: "#8899bb", margin: 0 }}>実際に支払う公的費用</p>
          </div>

          <div style={{ padding: "16px 24px" }}>
            {visaCost.breakdown.map((item) => {
              const isJpy = item.docCurrency === "JPY";
              const itemSym = isJpy ? "¥" : (DOC_CURRENCY_SYMBOL[item.docCurrency] ?? "");
              return (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "10px 0",
                    borderBottom: "1px solid #f0f4ff",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#5e6b86", flex: 1 }}>{item.label}</span>
                  <span
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 12, color: "#a0aec0", whiteSpace: "nowrap",
                    }}
                  >
                    {itemSym}{item.amountInDocCurrency.toLocaleString()}
                  </span>
                  {!isJpy && (
                    <span
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: 13, fontWeight: 600, color: "#1c2740", whiteSpace: "nowrap",
                      }}
                    >
                      ¥{fmt(item.amountJpy)}
                    </span>
                  )}
                  {isJpy && (
                    <span
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: 13, fontWeight: 600, color: "#1c2740", whiteSpace: "nowrap",
                      }}
                    >
                      ¥{fmt(item.amountInDocCurrency)}
                    </span>
                  )}
                </div>
              );
            })}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                paddingTop: 14,
                gap: 8,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1c2740" }}>合計</span>
              <span
                style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: "#a0aec0" }}
              >
                {DOC_CURRENCY_SYMBOL[visaCost.docCurrency]}{visaCost.totalCostInDocCurrency.toLocaleString()}
              </span>
              <span
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 20, fontWeight: 700, color: "#3b5bdb",
                }}
              >
                ¥{fmt(visaCost.totalCostJpy)}
              </span>
            </div>
            {!visaCost.isLive && (
              <p style={{ fontSize: 11, color: "#cf4a4a", margin: "8px 0 0" }}>
                ※ 推定レート使用中（ライブ取得前）
              </p>
            )}
          </div>
        </div>

        {/* ── Section B: 資金証明要件 ── */}
        <div
          style={{ background: "#fff", borderRadius: 14, border: "1px solid #e3e9f5", overflow: "hidden" }}
        >
          <div
            style={{
              background: "#f0faf5",
              padding: "16px 24px",
              borderBottom: "1px solid #e3e9f5",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: "#1f9268", color: "#fff",
                  fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                B
              </span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1f9268", margin: 0 }}>
                資金証明要件
              </p>
            </div>
            <p style={{ fontSize: 11, color: "#8899bb", margin: 0 }}>口座に用意すべき残高</p>
          </div>

          <div style={{ padding: "24px 24px" }}>
            {proofOfFunds.error ? (
              <p style={{ fontSize: 13, color: "#cf4a4a" }}>{proofOfFunds.error}</p>
            ) : (
              <>
                <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
                  <p
                    style={{ fontSize: 11, color: "#8899bb", letterSpacing: "0.06em", margin: "0 0 8px" }}
                  >
                    必要証明額
                  </p>
                  <p
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: isSmall ? 26 : 32,
                      fontWeight: 700, color: "#1c2740", margin: 0, lineHeight: 1.1,
                    }}
                  >
                    ¥{fmt(proofOfFunds.requiredFundsJpy)}
                  </p>
                  <p
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: 14, color: "#5e6b86", margin: "8px 0 0",
                    }}
                  >
                    ≈ {pofSym}{proofOfFunds.requiredFundsInDocCurrency.toLocaleString()}
                  </p>
                </div>

                {/* 計算根拠 */}
                <div
                  style={{ background: "#f8faff", borderRadius: 10, padding: "14px 16px" }}
                >
                  <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 8px" }}>計算根拠</p>
                  <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 5 }}>
                    {country === "US" && (
                      <>
                        <li style={{ fontSize: 12, color: "#5e6b86" }}>
                          {studyType === "DEGREE"
                            ? `都市圏生活費 US$2,800/月 × 12ヶ月`
                            : `地方生活費 US$1,400/月 × ${durationMonths}ヶ月`}
                        </li>
                        {spouse === 1 && (
                          <li style={{ fontSize: 12, color: "#5e6b86" }}>配偶者加算 US$10,800</li>
                        )}
                        {children > 0 && (
                          <li style={{ fontSize: 12, color: "#5e6b86" }}>
                            子供加算 US$5,400 × {children}人
                          </li>
                        )}
                      </>
                    )}
                    {country === "CA" && (
                      <>
                        <li style={{ fontSize: 12, color: "#5e6b86" }}>
                          連邦規定基本額 CA$22,895（1名）
                        </li>
                        {spouse + children > 0 && (
                          <li style={{ fontSize: 12, color: "#5e6b86" }}>
                            家族加算（{spouse + children}名）
                          </li>
                        )}
                      </>
                    )}
                    {country === "AU" && (
                      <>
                        <li style={{ fontSize: 12, color: "#5e6b86" }}>
                          年間生活費 A$29,710 × {(durationMonths / 12).toFixed(1)}年
                        </li>
                        {spouse === 1 && (
                          <li style={{ fontSize: 12, color: "#5e6b86" }}>配偶者加算 A$10,394/年</li>
                        )}
                        {children > 0 && (
                          <li style={{ fontSize: 12, color: "#5e6b86" }}>
                            子供加算 A$4,449/年 × {children}人
                          </li>
                        )}
                        <li style={{ fontSize: 12, color: "#5e6b86" }}>渡航費 A$2,000（固定）</li>
                      </>
                    )}
                    {country === "UK" && (
                      <>
                        <li style={{ fontSize: 12, color: "#5e6b86" }}>
                          ロンドン内生活費 £1,334/月 × {durationMonths}ヶ月
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {!proofOfFunds.isLive && (
                  <p style={{ fontSize: 11, color: "#cf4a4a", margin: "8px 0 0" }}>
                    ※ 推定レート使用中（ライブ取得前）
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisaView;
