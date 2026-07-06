import { useState, useMemo, useEffect } from "react";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { useVisaCostCalculator } from "../../hooks/useVisaCostCalculator";
import { useProofOfFundsCalculator } from "../../hooks/useProofOfFundsCalculator";
import { UK_VISA_CONSTANTS } from "../../constants/visa/uk";
import type { VisaInput } from "../../hooks/useVisaCostCalculator";
import type { StudyType, DependentsInput, UkCity } from "../../hooks/useProofOfFundsCalculator";
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

// ─── 28日ルール：日付ユーティリティ ─────────────────────────────────────────
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateJp(date: Date): string {
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * UKVI「28日ルール」：
 * ・残高証明書の対象日（closing balance date）から遡って28日間、必要額以上を維持している必要がある
 * ・その対象日は、ビザ申請日から遡って31日以内でなければならない
 * → 最も安全な対象日 = 申請日そのもの。その場合、資金は「申請日の27日前」までに入金しておく必要がある。
 */
function computeFundsSchedule(applicationDateStr: string) {
  const applicationDate = new Date(applicationDateStr + "T00:00:00");
  const depositDeadline = addDays(applicationDate, -27); // 申請日を含めて28日間
  const statementWindowStart = addDays(applicationDate, -31);
  return { applicationDate, depositDeadline, statementWindowStart };
}

/**
 * オーストラリア（Subclass 500）：
 * Genuine Student要件に基づく厳格な審査があり、直前の大口入金は「見せ金」を疑われるリスクがある。
 * 過去3ヶ月（90日）分の取引明細を求められるケースが多いため、その起点日を資金プール開始の目安とする。
 */
function computeAuSchedule(applicationDateStr: string) {
  const applicationDate = new Date(applicationDateStr + "T00:00:00");
  const poolStartDate = addDays(applicationDate, -90);
  return { applicationDate, poolStartDate };
}

/**
 * カナダ（Study Permit）：
 * SDS廃止後の通常審査ルートでは、資金の出所の透明性を示すため過去4〜6ヶ月分の取引履歴が求められることが多い。
 * 6ヶ月前を推奨開始日、4ヶ月前を最低ラインとして提示する。
 */
function computeCaSchedule(applicationDateStr: string) {
  const applicationDate = new Date(applicationDateStr + "T00:00:00");
  const recommendedStart = addDays(applicationDate, -180);
  const minimumStart = addDays(applicationDate, -120);
  return { applicationDate, recommendedStart, minimumStart };
}

/** 土日を除いた「営業日」を遡って日付を計算 */
function subtractBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return d;
}

/**
 * アメリカ（F-1）：
 * ①大学のI-20発行デッドライン →②ビザ面接日、の2段階の逆算ゴール。
 * SEVIS I-901手数料（$350）は面接の少なくとも3営業日前までに独立して支払う必要がある。
 */
function computeUsSchedule(i20DeadlineStr: string, interviewDateStr: string) {
  const i20Deadline = i20DeadlineStr ? new Date(i20DeadlineStr + "T00:00:00") : null;
  const interviewDate = interviewDateStr ? new Date(interviewDateStr + "T00:00:00") : null;
  const sevisDeadline = interviewDate ? subtractBusinessDays(interviewDate, 3) : null;
  return { i20Deadline, interviewDate, sevisDeadline };
}

const SCHEDULE_HEADER: Record<CountryCodeVisa, { title: string; subtitle: string; lockText: string }> = {
  UK: {
    title: "28日ルール：具体的スケジュール",
    subtitle: "いつまでにいくら口座に入れておくべきか、日付で確認",
    lockText: "申請予定日から逆算した資金投入期限の表示はプレミアムプランで利用できます",
  },
  AU: {
    title: "資金プール構築カウンター（Genuine Student対策）",
    subtitle: "「見せ金」と疑われないための資金準備スケジュール",
    lockText: "申請予定日から逆算した資金プール開始日の表示はプレミアムプランで利用できます",
  },
  US: {
    title: "I-20 & ビザ面接 2段階カウントダウン",
    subtitle: "I-20発行・ビザ面接・SEVIS手数料までの逆算スケジュール",
    lockText: "I-20締切や面接日から逆算したスケジュールはプレミアムプランで利用できます",
  },
  CA: {
    title: "資金履歴構築トラッカー（出所証明対策）",
    subtitle: "取引履歴の透明性を証明するための長期スケジュール",
    lockText: "渡航予定日から逆算した資金履歴の開始日表示はプレミアムプランで利用できます",
  },
};

const AMBER_DATE_INPUT_STYLE: React.CSSProperties = {
  border: "1.5px solid #f3d9b8",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  color: "#1c2740",
  background: "#fffaf3",
  cursor: "pointer",
  outline: "none",
  fontFamily: "inherit",
};

function DeadlineBadge({ days, label }: { days: number; label: string }) {
  const isOverdue = days < 0;
  const isUrgent = days >= 0 && days <= 14;
  const bg = isOverdue ? "#cf4a4a" : isUrgent ? "#c2792a" : "#1f9268";
  const text = isOverdue ? `${label}を${Math.abs(days)}日超過` : `${label}まであと${days}日`;
  return (
    <span
      style={{
        background: bg,
        color: "#fff",
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        fontFamily: '"IBM Plex Mono", monospace',
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
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

interface VisaViewProps {
  isPremium: boolean;
  onUpgradeClick: () => void;
}

export function VisaView({ isPremium, onUpgradeClick }: VisaViewProps) {
  const isSmall = useWindowWidth() < 1024;

  const [country, setCountry] = useState<CountryCodeVisa>("US");
  const [studyType, setStudyType] = useState<StudyType>("DEGREE");
  const [durationMonths, setDurationMonths] = useState(12);
  const [spouse, setSpouse] = useState<0 | 1>(0);
  const [children, setChildren] = useState(0);
  const [ukCity, setUkCity] = useState<UkCity>("LONDON");

  // 逆算スケジュール：ビザ申請予定日（premium, UK / AU / CA共通）
  const [applicationDate, setApplicationDate] = useState<string>(() =>
    localStorage.getItem("uniroute_visa_application_date") ?? ""
  );

  // アメリカ限定：I-20申請デッドライン & ビザ面接予定日（premium）
  const [i20Deadline, setI20Deadline] = useState<string>(() =>
    localStorage.getItem("uniroute_us_i20_deadline") ?? ""
  );
  const [interviewDate, setInterviewDate] = useState<string>(() =>
    localStorage.getItem("uniroute_us_interview_date") ?? ""
  );

  useEffect(() => {
    if (applicationDate) localStorage.setItem("uniroute_visa_application_date", applicationDate);
  }, [applicationDate]);

  useEffect(() => {
    if (i20Deadline) localStorage.setItem("uniroute_us_i20_deadline", i20Deadline);
  }, [i20Deadline]);

  useEffect(() => {
    if (interviewDate) localStorage.setItem("uniroute_us_interview_date", interviewDate);
  }, [interviewDate]);

  // 未入力なら出国日（TaskViewで保存済みの場合）から30日前を初期候補として提案
  useEffect(() => {
    if (applicationDate) return;
    const departureDate = localStorage.getItem("uniroute_departure_date");
    if (!departureDate) return;
    const suggested = addDays(new Date(departureDate + "T00:00:00"), -30);
    setApplicationDate(suggested.toISOString().slice(0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const proofOfFunds = useProofOfFundsCalculator(country, studyType, durationMonths, dependents, ukCity);
  const proofMonths = Math.min(durationMonths, 9);

  const pofSym = DOC_CURRENCY_SYMBOL[proofOfFunds.docCurrency] ?? "";

  const fundsSchedule = useMemo(
    () => (country === "UK" && applicationDate ? computeFundsSchedule(applicationDate) : null),
    [country, applicationDate]
  );
  const auSchedule = useMemo(
    () => (country === "AU" && applicationDate ? computeAuSchedule(applicationDate) : null),
    [country, applicationDate]
  );
  const caSchedule = useMemo(
    () => (country === "CA" && applicationDate ? computeCaSchedule(applicationDate) : null),
    [country, applicationDate]
  );
  const usSchedule = useMemo(
    () => (country === "US" ? computeUsSchedule(i20Deadline, interviewDate) : null),
    [country, i20Deadline, interviewDate]
  );

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

        {/* 都市選択（UK: ロンドン内/外で資金証明の生活費要件が変わる） */}
        {country === "UK" && (
          <div>
            <p style={{ fontSize: 11, color: "#8899bb", letterSpacing: "0.06em", margin: "0 0 8px" }}>
              滞在都市
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <ToggleBtn active={ukCity === "LONDON"} onClick={() => setUkCity("LONDON")} color="#1f9268">
                ロンドン市内
              </ToggleBtn>
              <ToggleBtn active={ukCity === "OUTSIDE_LONDON"} onClick={() => setUkCity("OUTSIDE_LONDON")} color="#1f9268">
                ロンドン以外
              </ToggleBtn>
            </div>
          </div>
        )}

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
                          {ukCity === "LONDON" ? "ロンドン市内" : "ロンドン以外"}生活費 £
                          {(ukCity === "LONDON"
                            ? UK_VISA_CONSTANTS.PROOF_OF_FUNDS.LIVING_COST_LONDON_PER_MONTH
                            : UK_VISA_CONSTANTS.PROOF_OF_FUNDS.LIVING_COST_OUTSIDE_LONDON_PER_MONTH
                          ).toLocaleString()}
                          /月 × 最大{proofMonths}ヶ月
                        </li>
                        {durationMonths > 9 && (
                          <li style={{ fontSize: 12, color: "#8899bb" }}>
                            ※ 留学期間{durationMonths}ヶ月のうち、資金証明は最大9ヶ月分で計算（28日ルール）
                          </li>
                        )}
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

      {/* ─── Section C: 資金・書類スケジュール 逆算カウンター（国別・premium） ─── */}
      <div
        style={{
          marginTop: 20,
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e3e9f5",
          overflow: "hidden",
        }}
      >
        <div style={{ background: "#fff7ed", padding: "16px 24px", borderBottom: "1px solid #e3e9f5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
            <span
              style={{
                width: 22, height: 22, borderRadius: 6,
                background: "#c2792a", color: "#fff",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              C
            </span>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#c2792a", margin: 0 }}>
              {SCHEDULE_HEADER[country].title}
            </p>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>P</span>
          </div>
          <p style={{ fontSize: 11, color: "#8899bb", margin: 0 }}>
            {SCHEDULE_HEADER[country].subtitle}
          </p>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {!isPremium ? (
            <PremiumLockBanner text={SCHEDULE_HEADER[country].lockText} onClick={onUpgradeClick} />
          ) : (
            <>
              {/* ── UK: 28日ルール ── */}
              {country === "UK" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1c2740", flexShrink: 0 }}>
                      🗓️ ビザ申請予定日
                    </span>
                    <input
                      type="date"
                      value={applicationDate}
                      onChange={(e) => setApplicationDate(e.target.value)}
                      style={AMBER_DATE_INPUT_STYLE}
                    />
                    {!applicationDate && (
                      <span style={{ fontSize: 12, color: "#8899bb" }}>日付を入力するとスケジュールが表示されます</span>
                    )}
                  </div>

                  {fundsSchedule && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          flexWrap: "wrap", gap: 8, background: "#fffaf3", borderRadius: 10,
                          padding: "14px 16px", border: "1px solid #f3d9b8",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 4px" }}>
                            この日までに £{fmt(proofOfFunds.requiredFundsInDocCurrency)} 以上を口座に入金
                          </p>
                          <p style={{ fontSize: 18, fontWeight: 700, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                            {formatDateJp(fundsSchedule.depositDeadline)}
                          </p>
                        </div>
                        <DeadlineBadge days={daysUntil(fundsSchedule.depositDeadline)} label="入金期限" />
                      </div>

                      <div style={{ background: "#f8faff", borderRadius: 10, padding: "14px 16px" }}>
                        <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 6px" }}>
                          残高証明書として使える対象日の範囲
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                          {formatDateJp(fundsSchedule.statementWindowStart)} 〜 {formatDateJp(fundsSchedule.applicationDate)}
                        </p>
                      </div>

                      <p style={{ fontSize: 11, color: "#8899bb", margin: 0, lineHeight: 1.7 }}>
                        ※ UKVIの28日ルール：残高証明書の対象日（残高の記載日）から遡って28日間、必要額以上を口座に維持している必要があります。さらにその対象日は、ビザ申請日から遡って31日以内でなければなりません。上記は最も安全な「対象日＝申請日」で計算した最終期限です。銀行の処理日数を考慮し、数日〜1週間の余裕を持たせることをおすすめします。
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ── AU: Genuine Student対策 資金プールカウンター ── */}
              {country === "AU" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1c2740", flexShrink: 0 }}>
                      🗓️ ビザ申請予定日
                    </span>
                    <input
                      type="date"
                      value={applicationDate}
                      onChange={(e) => setApplicationDate(e.target.value)}
                      style={AMBER_DATE_INPUT_STYLE}
                    />
                    {!applicationDate && (
                      <span style={{ fontSize: 12, color: "#8899bb" }}>日付を入力するとスケジュールが表示されます</span>
                    )}
                  </div>

                  {auSchedule && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          flexWrap: "wrap", gap: 8, background: "#fffaf3", borderRadius: 10,
                          padding: "14px 16px", border: "1px solid #f3d9b8",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 4px" }}>
                            この日までに基本となる資金（目安 A${fmt(proofOfFunds.requiredFundsInDocCurrency)}）を口座に入金
                          </p>
                          <p style={{ fontSize: 18, fontWeight: 700, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                            {formatDateJp(auSchedule.poolStartDate)}
                          </p>
                        </div>
                        <DeadlineBadge days={daysUntil(auSchedule.poolStartDate)} label="資金プール開始期限" />
                      </div>

                      <p style={{ fontSize: 11, color: "#8899bb", margin: 0, lineHeight: 1.7 }}>
                        ※ オーストラリアはGenuine Student要件に基づく厳格な審査があり、直前の大口入金は「見せ金」を疑われるリスクがあります。過去3ヶ月分の銀行取引明細の提出を求められるケースが多いため、上記の日付までに資金を入れ、それ以降は不自然な大口入金を避けて口座残高を安定させてください。
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ── CA: 資金履歴構築トラッカー ── */}
              {country === "CA" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1c2740", flexShrink: 0 }}>
                      🗓️ ビザ申請予定日
                    </span>
                    <input
                      type="date"
                      value={applicationDate}
                      onChange={(e) => setApplicationDate(e.target.value)}
                      style={AMBER_DATE_INPUT_STYLE}
                    />
                    {!applicationDate && (
                      <span style={{ fontSize: 12, color: "#8899bb" }}>日付を入力するとスケジュールが表示されます</span>
                    )}
                  </div>

                  {caSchedule && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          flexWrap: "wrap", gap: 8, background: "#fffaf3", borderRadius: 10,
                          padding: "14px 16px", border: "1px solid #f3d9b8",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 4px" }}>
                            資金の出入りを記録に残し始める推奨開始日（6ヶ月前）
                          </p>
                          <p style={{ fontSize: 18, fontWeight: 700, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                            {formatDateJp(caSchedule.recommendedStart)}
                          </p>
                        </div>
                        <DeadlineBadge days={daysUntil(caSchedule.recommendedStart)} label="履歴構築 推奨開始" />
                      </div>

                      <div style={{ background: "#f8faff", borderRadius: 10, padding: "14px 16px" }}>
                        <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 6px" }}>
                          最低ライン（4ヶ月前）
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                          {formatDateJp(caSchedule.minimumStart)}
                        </p>
                      </div>

                      <p style={{ fontSize: 11, color: "#8899bb", margin: 0, lineHeight: 1.7 }}>
                        ※ 2024年11月のSDS（Student Direct Stream）廃止に伴い、通常審査ルートでは資金の出所の透明性を示すため過去4〜6ヶ月分の取引明細が求められることが多くなっています。急な大口入金ではなく、日常的な入出金の履歴として残しておくことが重要です。
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ── US: I-20 & ビザ面接 2段階カウントダウン ── */}
              {country === "US" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1c2740", flexShrink: 0, minWidth: 170 }}>
                        🎓 大学のI-20申請デッドライン
                      </span>
                      <input
                        type="date"
                        value={i20Deadline}
                        onChange={(e) => setI20Deadline(e.target.value)}
                        style={AMBER_DATE_INPUT_STYLE}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1c2740", flexShrink: 0, minWidth: 170 }}>
                        🛂 ビザ面接予定日
                      </span>
                      <input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        style={AMBER_DATE_INPUT_STYLE}
                      />
                    </div>
                    {!i20Deadline && !interviewDate && (
                      <span style={{ fontSize: 12, color: "#8899bb" }}>
                        日付を入力するとスケジュールが表示されます
                      </span>
                    )}
                  </div>

                  {(usSchedule?.i20Deadline || usSchedule?.interviewDate || usSchedule?.sevisDeadline) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {usSchedule?.i20Deadline && (
                        <div
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            flexWrap: "wrap", gap: 8, background: "#fffaf3", borderRadius: 10,
                            padding: "14px 16px", border: "1px solid #f3d9b8",
                          }}
                        >
                          <div>
                            <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 4px" }}>
                              ステージ1：I-20発行に向けた残高証明の提出期限（目安 US${fmt(proofOfFunds.requiredFundsInDocCurrency)}）
                            </p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                              {formatDateJp(usSchedule.i20Deadline)}
                            </p>
                          </div>
                          <DeadlineBadge days={daysUntil(usSchedule.i20Deadline)} label="I-20締切" />
                        </div>
                      )}

                      {usSchedule?.interviewDate && (
                        <div
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            flexWrap: "wrap", gap: 8, background: "#f8faff", borderRadius: 10,
                            padding: "14px 16px",
                          }}
                        >
                          <div>
                            <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 4px" }}>
                              ステージ2：ビザ面接予定日
                            </p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                              {formatDateJp(usSchedule.interviewDate)}
                            </p>
                          </div>
                          <DeadlineBadge days={daysUntil(usSchedule.interviewDate)} label="面接日" />
                        </div>
                      )}

                      {usSchedule?.sevisDeadline && (
                        <div
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            flexWrap: "wrap", gap: 8, background: "#fffaf3", borderRadius: 10,
                            padding: "14px 16px", border: "1px solid #f3d9b8",
                          }}
                        >
                          <div>
                            <p style={{ fontSize: 12, color: "#8899bb", margin: "0 0 4px" }}>
                              SEVIS I-901手数料（US$350）の支払い期限（面接3営業日前まで）
                            </p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: "#1c2740", margin: 0, fontFamily: '"IBM Plex Mono", monospace' }}>
                              {formatDateJp(usSchedule.sevisDeadline)}
                            </p>
                          </div>
                          <DeadlineBadge days={daysUntil(usSchedule.sevisDeadline)} label="SEVIS支払期限" />
                        </div>
                      )}

                      <p style={{ fontSize: 11, color: "#8899bb", margin: 0, lineHeight: 1.7 }}>
                        ※ SEVIS I-901手数料は独立した決済プロセスで、ビザ面接の少なくとも3営業日前までに支払いが必要です（実務上は面接予約前に支払っておくのが一般的です）。I-20はまず大学へ財政証明を提出して発行してもらう必要があり、大学ごとに提出期限が異なるため、必ず担当窓口の指示を確認してください。
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VisaView;
