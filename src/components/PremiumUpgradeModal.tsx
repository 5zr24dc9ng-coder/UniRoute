import { useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useWindowWidth } from "../hooks/useWindowWidth";

interface PremiumUpgradeModalProps {
  onClose: () => void;
}

type FeatureKey =
  | "scenario"
  | "share"
  | "fundgap"
  | "scholarship"
  | "checklist"
  | "taskedit"
  | "visaschedule";

const PREMIUM_ROWS: { key: FeatureKey; label: string; freeText: string }[] = [
  { key: "scenario", label: "シナリオ比較", freeText: "–" },
  { key: "share", label: "家族への共有レポート", freeText: "–" },
  { key: "fundgap", label: "資金ギャップ分析", freeText: "–" },
  { key: "scholarship", label: "奨学金オフセット計算", freeText: "–" },
  { key: "checklist", label: "書類チェックリスト", freeText: "–" },
  { key: "taskedit", label: "タスクのカスタム編集", freeText: "閲覧のみ" },
  { key: "visaschedule", label: "ビザ逆算スケジュール", freeText: "–" },
];

const mono = '"IBM Plex Mono", monospace';

function CheckMark() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── プレビューカードの共通シェル ────────────────────────────────────────────
function PreviewCard({ children, padded }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e4fc",
        borderRadius: 12,
        width: 220,
        margin: "0 auto",
        textAlign: "left",
        overflow: "hidden",
        padding: padded ? "12px 14px" : 0,
      }}
    >
      {children}
    </div>
  );
}

function DemoSection({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <div key={title} className="pum-popin">
      <div style={{ fontSize: 12, fontWeight: 800, color: "#4338ca", marginBottom: 10, textAlign: "center" }}>{title}</div>
      {children}
      <p style={{ fontSize: 11.5, color: "#5e6b86", margin: "12px 0 0", lineHeight: 1.5, textAlign: "center" }}>{caption}</p>
    </div>
  );
}

// ─── 7種のミニデモ ───────────────────────────────────────────────────────────
function ScenarioDemo() {
  return (
    <DemoSection title="シナリオ比較" caption="留学タイプ・都市を変えて保存したシナリオを横並びで比較">
      <PreviewCard>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ padding: "7px 8px", borderTop: "3px solid #c7d6fb", background: "#f8faff" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#1c2740" }}>ロンドン案</div>
            <div style={{ fontSize: 8, color: "#8899bb", marginTop: 1 }}>正規留学・首都</div>
          </div>
          <div style={{ padding: "7px 8px", borderTop: "3px solid #4f46e5", background: "#f8faff", borderLeft: "1px solid #eef0f8" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#1c2740" }}>シドニー案</div>
            <div style={{ fontSize: 8, color: "#8899bb", marginTop: 1 }}>交換留学・首都</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ padding: "6px 8px", fontSize: 9.5, color: "#5e6b86", fontFamily: mono }}>授業料 ¥2.1M</div>
          <div style={{ padding: "6px 8px", fontSize: 9.5, color: "#5e6b86", fontFamily: mono, borderLeft: "1px solid #f1f5f9" }}>授業料 ¥0.4M</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #f1f5f9", background: "#f8faff" }}>
          <div style={{ padding: "7px 8px", fontSize: 9, color: "#334155", fontWeight: 700, textAlign: "center" }}>推定総額</div>
          <div style={{ padding: "7px 8px", fontSize: 9, color: "#334155", fontWeight: 700, borderLeft: "1px solid #eef0f8", textAlign: "center" }}>推定総額</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ padding: "6px 8px 9px", fontSize: 11, fontWeight: 700, color: "#1e293b", fontFamily: mono, textAlign: "center" }}>
            ¥3,240,000
          </div>
          <div
            style={{
              position: "relative", padding: "6px 8px 9px", fontSize: 11, fontWeight: 800, color: "#15803d",
              fontFamily: mono, background: "#f0fdf4", borderLeft: "1px solid #d3f5df",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
            }}
          >
            <span className="pum-pulsedot" style={{ position: "absolute", top: 5, right: 6, width: 5, height: 5, borderRadius: "50%", background: "#16a34a" }} />
            <span>¥1,180,000</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: "#16a34a", letterSpacing: "0.04em" }}>最安</span>
          </div>
        </div>
      </PreviewCard>
    </DemoSection>
  );
}

function ShareDemo() {
  return (
    <DemoSection title="家族への共有レポート" caption="ログイン不要のリンクで家族に共有">
      <PreviewCard padded>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8faff", border: "1px solid #e3e9f5", borderRadius: 8, padding: "6px 8px", marginBottom: 8 }}>
          <span style={{ fontSize: 9.5, color: "#5e6b86", fontFamily: mono, flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            uniroute.app/share/8f2a91
          </span>
          <span className="pum-pulsedot" style={{ fontSize: 8.5, fontWeight: 700, color: "#fff", background: "#2f63e6", padding: "3px 7px", borderRadius: 6, flexShrink: 0 }}>
            コピー済
          </span>
        </div>
        <div className="pum-cardslide" style={{ border: "1px solid #e3e9f5", borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#8899bb" }}>留学費用レポート・UK 正規留学</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1c2740", fontFamily: mono, marginTop: 2 }}>¥3,240,000</div>
          <div style={{ height: 5, background: "#e3e9f5", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "62%", background: "#2f63e6", borderRadius: 3 }} />
          </div>
        </div>
      </PreviewCard>
    </DemoSection>
  );
}

function FundGapDemo() {
  return (
    <DemoSection title="資金ギャップ分析" caption="現在の所持金・出国日から逆算した貯蓄プラン">
      <PreviewCard>
        <div style={{ background: "#eef2ff", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#4338ca" }}>資金ギャップ分析</div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8.5, color: "#8899bb", marginBottom: 4 }}>
            <span>現在 ¥500,000</span>
            <span>目標 ¥3,240,000</span>
          </div>
          <div style={{ height: 8, background: "#e3e9f5", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
            <div className="pum-fillgap" style={{ height: "100%", background: "#4f46e5", borderRadius: 4 }} />
          </div>
          <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 7, padding: "6px 8px" }}>
            <div style={{ fontSize: 8, color: "#6366f1" }}>月々の貯蓄目安（残り14ヶ月）</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#4338ca", fontFamily: mono }}>¥195,700</div>
          </div>
        </div>
      </PreviewCard>
    </DemoSection>
  );
}

function ScholarshipDemo() {
  return (
    <DemoSection title="奨学金オフセット計算" caption="奨学金を差し引いた実質負担額を自動計算">
      <PreviewCard>
        <div style={{ background: "#f0faf5", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#1f9268" }}>奨学金オフセット計算</div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: "#15803d", background: "#f0faf5", border: "1.5px solid #1f9268", borderRadius: 7, padding: "5px 8px", marginBottom: 8 }}>
            JASSO 海外留学支援制度
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1, background: "#f0faf5", border: "1px solid #bbf7d0", borderRadius: 6, padding: "5px 6px" }}>
              <div style={{ fontSize: 7.5, color: "#15803d" }}>奨学金総額</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", fontFamily: mono }}>¥1,000,000</div>
            </div>
            <div style={{ flex: 1, background: "#f8faff", borderRadius: 6, padding: "5px 6px" }}>
              <div style={{ fontSize: 7.5, color: "#8899bb" }}>実質負担額</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1c2740", fontFamily: mono }}>¥2,240,000</div>
            </div>
          </div>
          <div style={{ height: 8, background: "#e3e9f5", borderRadius: 4, overflow: "hidden" }}>
            <div className="pum-offsetgrow" style={{ height: "100%", background: "#1f9268", borderRadius: 4 }} />
          </div>
        </div>
      </PreviewCard>
    </DemoSection>
  );
}

function ChecklistDemo() {
  return (
    <DemoSection title="書類チェックリスト" caption="国・留学タイプ別の必要書類を管理">
      <PreviewCard padded>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#5e6b86", marginBottom: 6 }}>
          <span>準備の進捗</span>
          <span style={{ fontWeight: 700, color: "#1c2740" }}>2 / 4 完了</span>
        </div>
        <div style={{ height: 5, background: "#e3e9f5", borderRadius: 3, overflow: "hidden", marginBottom: 9 }}>
          <div style={{ height: "100%", width: "50%", background: "#16a34a", borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, border: "1.5px solid #16a34a", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CheckMark />
            </div>
            <span style={{ fontSize: 10.5, color: "#15803d", textDecoration: "line-through" }}>パスポート</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, border: "1.5px solid #16a34a", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CheckMark />
            </div>
            <span style={{ fontSize: 10.5, color: "#15803d", textDecoration: "line-through" }}>在学証明書</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div className="pum-checklive-box" style={{ width: 14, height: 14, borderRadius: 4, border: "1.5px solid #c8d9fd", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="pum-checklive-mark" style={{ display: "flex" }}>
                <CheckMark />
              </span>
            </div>
            <span className="pum-checklive-text" style={{ fontSize: 10.5, color: "#1c2740" }}>残高証明書</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, border: "1.5px solid #c8d9fd", flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: "#8899bb" }}>健康診断書</span>
          </div>
        </div>
      </PreviewCard>
    </DemoSection>
  );
}

function TaskEditDemo() {
  return (
    <DemoSection title="タスクのカスタム編集" caption="並び替え・追加 + 出国日カウントダウン">
      <PreviewCard padded>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 9.5, color: "#5e6b86" }}>出国予定日まで</span>
          <span className="pum-counttick" style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "#1f9268", padding: "3px 9px", borderRadius: 7, fontFamily: mono }}>
            あと127日
          </span>
        </div>
        <div style={{ position: "relative", height: 64 }}>
          <div className="pum-taskswap-a" style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e3e9f5", borderRadius: 6, padding: "6px 8px" }}>
            <span style={{ color: "#c7d0e6", fontSize: 10 }}>⠿</span>
            <span style={{ fontSize: 10, color: "#1c2740" }}>IELTS受験</span>
          </div>
          <div className="pum-taskswap-b" style={{ position: "absolute", top: 34, left: 0, right: 0, display: "flex", alignItems: "center", gap: 6, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 6, padding: "6px 8px" }}>
            <span style={{ color: "#8fa3e8", fontSize: 10 }}>⠿</span>
            <span style={{ fontSize: 10, color: "#3b5bdb", fontWeight: 600 }}>SEVIS手数料納付</span>
          </div>
        </div>
      </PreviewCard>
    </DemoSection>
  );
}

function VisaScheduleDemo() {
  return (
    <DemoSection title="ビザ逆算スケジュール" caption="国別の資金投入期限を逆算表示">
      <PreviewCard>
        <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#1c2740", borderBottom: "1px solid #f0f4ff" }}>
          28日ルール：UK 資金証明
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 8.5, color: "#8899bb", marginBottom: 8 }}>
            <span>申請予定日</span>
            <span style={{ background: "#fffaf3", border: "1.5px solid #f3d9b8", borderRadius: 6, padding: "3px 8px", color: "#1c2740", fontFamily: mono }}>
              2026-09-12
            </span>
          </div>
          <span className="pum-counttick" style={{ display: "inline-block", background: "#c2792a", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 700, fontFamily: mono }}>
            投入期限まであと18日
          </span>
        </div>
      </PreviewCard>
    </DemoSection>
  );
}

const DEMO_MAP: Record<FeatureKey, () => JSX.Element> = {
  scenario: ScenarioDemo,
  share: ShareDemo,
  fundgap: FundGapDemo,
  scholarship: ScholarshipDemo,
  checklist: ChecklistDemo,
  taskedit: TaskEditDemo,
  visaschedule: VisaScheduleDemo,
};

export function PremiumUpgradeModal({ onClose }: PremiumUpgradeModalProps) {
  const [activeFeature, setActiveFeature] = useState<FeatureKey | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const isSmall = useWindowWidth() < 1024;
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  // クリックは常に「選択」であり、トグル（開いている時に閉じる）にはしない。
  // PCではクリック前に必ずhoverが発生するため、トグルにすると
  // 「hoverで開く→クリックした瞬間に閉じる」という誤動作になる。
  function selectFeature(key: FeatureKey) {
    setActiveFeature(key);
  }

  async function handlePurchase() {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    setCheckoutLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("決済ページの作成に失敗しました。時間をおいて再度お試しください。");
        setCheckoutLoading(false);
      }
    } catch {
      alert("決済ページの作成に失敗しました。時間をおいて再度お試しください。");
      setCheckoutLoading(false);
    }
  }

  const ActiveDemo = activeFeature ? DEMO_MAP[activeFeature] : null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(20,29,51,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 16,
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes pumPopIn { from { opacity:0; transform:translateY(-4px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes pumPulseDot { 0%,100% { opacity:.45; transform:scale(.9); } 50% { opacity:1; transform:scale(1.15); } }
        @keyframes pumCardSlide { 0% { transform:translateY(10px); opacity:0; } 30%,70% { transform:translateY(0); opacity:1; } 100% { transform:translateY(10px); opacity:0; } }
        @keyframes pumFillGapReal { 0%,10% { width:0%; } 55%,90% { width:15%; } 100% { width:0%; } }
        @keyframes pumOffsetGrow { 0% { width:8%; } 50% { width:62%; } 100% { width:8%; } }
        @keyframes pumCheckLiveBox { 0%,25% { background:#fff; border-color:#c8d9fd; } 26%,100% { background:#16a34a; border-color:#16a34a; } }
        @keyframes pumCheckLiveText { 0%,25% { color:#1c2740; text-decoration:none; } 26%,100% { color:#15803d; text-decoration:line-through; } }
        @keyframes pumCheckLiveMark { 0%,20% { opacity:0; transform:scale(.4); } 30%,100% { opacity:1; transform:scale(1); } }
        @keyframes pumTaskSwapA { 0%,15% { transform:translateY(0); } 45%,75% { transform:translateY(34px); } 100% { transform:translateY(0); } }
        @keyframes pumTaskSwapB { 0%,15% { transform:translateY(0); } 45%,75% { transform:translateY(-34px); } 100% { transform:translateY(0); } }
        @keyframes pumCountTick { 0%,100% { opacity:1; } 50% { opacity:.45; } }
        .pum-popin { animation: pumPopIn .18s ease-out; }
        .pum-pulsedot { animation: pumPulseDot 2.2s ease-in-out infinite; }
        .pum-cardslide { animation: pumCardSlide 2.4s ease-in-out infinite; }
        .pum-fillgap { animation: pumFillGapReal 2.6s ease-in-out infinite; }
        .pum-offsetgrow { animation: pumOffsetGrow 2.3s ease-in-out infinite; }
        .pum-checklive-box { animation: pumCheckLiveBox 2.4s ease-in-out infinite; }
        .pum-checklive-mark { animation: pumCheckLiveMark 2.4s ease-in-out infinite; }
        .pum-checklive-text { animation: pumCheckLiveText 2.4s ease-in-out infinite; }
        .pum-taskswap-a { animation: pumTaskSwapA 2.4s ease-in-out infinite; }
        .pum-taskswap-b { animation: pumTaskSwapB 2.4s ease-in-out infinite; }
        .pum-counttick { animation: pumCountTick 1.8s ease-in-out infinite; }
        .pum-row:hover { background: #fafaff; }
      `}</style>

      <div
        style={{
          width: 900, maxWidth: "100%", background: "#fff", borderRadius: 20,
          boxShadow: "0 30px 70px rgba(10,15,30,.35)", overflow: "hidden",
          display: "flex", flexDirection: "column", maxHeight: "92vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #e3e9f5", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#141d33", color: "#7aa2ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>
              U
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#141d33", letterSpacing: "-0.02em" }}>プランを比較して選ぶ</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, background: "#f0f4ff", color: "#5e6b86", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", border: "none" }}
          >
            ✕
          </button>
        </div>

        {/* 本文 */}
        <div style={{ display: "flex", flexDirection: isSmall ? "column" : "row", overflow: "auto" }}>
          {/* 左: 比較表 */}
          <div style={{ flex: 1, padding: "20px 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px", alignItems: "center", paddingBottom: 8 }}>
              <div />
              <div style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "#8899bb" }}>Free</div>
              <div style={{ textAlign: "center", fontSize: 11.5, fontWeight: 800, color: "#4338ca" }}>Premium</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px", alignItems: "center", padding: "6px 0" }}>
              <div style={{ fontSize: 13, color: "#1c2740" }}>費用シミュレーション</div>
              <div style={{ textAlign: "center", color: "#1f9268" }}>✓</div>
              <div style={{ textAlign: "center", color: "#1f9268" }}>✓</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px", alignItems: "center", padding: "6px 0 12px", borderBottom: "1px solid #e3e9f5" }}>
              <div style={{ fontSize: 13, color: "#1c2740" }}>国比較・基本タスク管理</div>
              <div style={{ textAlign: "center", color: "#1f9268" }}>✓</div>
              <div style={{ textAlign: "center", color: "#1f9268" }}>✓</div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 800, color: "#4338ca", letterSpacing: "0.06em", textTransform: "uppercase", margin: "14px 0 4px" }}>
              プレミアムだけの機能
            </div>

            {PREMIUM_ROWS.map((row, i) => (
              <div
                key={row.key}
                className="pum-row"
                onMouseEnter={() => selectFeature(row.key)}
                onClick={() => selectFeature(row.key)}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 70px 70px", alignItems: "center", padding: "9px 0",
                  cursor: "pointer", background: activeFeature === row.key ? "#fafaff" : "transparent",
                  borderBottom: i < PREMIUM_ROWS.length - 1 ? "1px solid #f6f7fc" : "none",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1c2740" }}>{row.label}</div>
                <div style={{ textAlign: "center", fontSize: row.freeText === "閲覧のみ" ? 10.5 : 13, color: "#c7d0e6" }}>{row.freeText}</div>
                <div style={{ textAlign: "center", color: "#4338ca", fontWeight: 700 }}>✓</div>
              </div>
            ))}

            <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8faff", borderRadius: 12, padding: "14px 18px", flexWrap: "wrap", gap: 10 }}>
              <div>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#141d33", fontFamily: mono }}>¥980</span>
                <span style={{ fontSize: 11, color: "#5e6b86", marginLeft: 6 }}>買い切り・サブスクなし</span>
              </div>
              <button
                onClick={handlePurchase}
                disabled={checkoutLoading}
                style={{
                  padding: "10px 22px", borderRadius: 9, border: "none",
                  background: "linear-gradient(135deg, #2f63e6, #4338ca)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: checkoutLoading ? "default" : "pointer",
                  opacity: checkoutLoading ? 0.7 : 1,
                  boxShadow: "0 8px 20px rgba(67,56,202,.35)",
                }}
              >
                {checkoutLoading ? "処理中..." : isSignedIn ? "プレミアムを購入" : "ログインして購入"}
              </button>
            </div>
          </div>

          {/* 右: プレビューパネル（デスクトップはインライン表示） */}
          {!isSmall && (
            <div
              style={{
                width: 290, flexShrink: 0,
                background: "#f8faff", borderLeft: "1px solid #e3e9f5",
                padding: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
                minHeight: 320,
              }}
            >
              {ActiveDemo ? (
                <ActiveDemo key={activeFeature} />
              ) : (
                <div>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px dashed #c7d0e6", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 12, color: "#8899bb", lineHeight: 1.6, margin: 0 }}>
                    機能名にカーソルを合わせると
                    <br />
                    プレビューが表示されます
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* モバイルはスクロールせずに見えるよう、選択中のプレビューをポップアップで表示 */}
      {isSmall && ActiveDemo && (
        <div
          className="pum-popin"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 10001,
            background: "#f8faff", borderRadius: 16, border: "1px solid #e3e9f5",
            boxShadow: "0 12px 32px rgba(10,15,30,.3)",
            padding: "20px 22px", textAlign: "center",
          }}
        >
          <button
            onClick={() => setActiveFeature(null)}
            style={{
              position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: 7,
              background: "#fff", border: "1px solid #e3e9f5", color: "#5e6b86",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer",
            }}
          >
            ✕
          </button>
          <ActiveDemo key={activeFeature} />
        </div>
      )}
    </div>
  );
}

export default PremiumUpgradeModal;
