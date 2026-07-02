import { SvgIcon } from "../ui/SvgIcon";
import type { Fx, StudyType } from "../../types";

interface HeaderProps {
  fx: Fx;
  onMenuClick: () => void;
  isSmall: boolean;
  studyType: StudyType;
  setStudyType: (s: StudyType) => void;
}

const STUDY_TYPES: { id: StudyType; label: string }[] = [
  { id: "DEGREE", label: "正規留学" },
  { id: "EXCHANGE", label: "交換留学" },
  { id: "LANGUAGE", label: "語学留学" },
];

function FxPair({ label, val, chg, isSmall }: { label: string; val: number; chg: number; isSmall: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      <span
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: isSmall ? 10 : 11,
          color: "#8899bb",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: isSmall ? 12 : 14,
          fontWeight: 600,
          color: "#1c2740",
        }}
      >
        {val.toFixed(1)}
      </span>
      <span
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10,
          color: chg > 0 ? "#1f9268" : "#cf4a4a",
        }}
      >
        {chg > 0 ? "▲" : "▼"}
        {Math.abs(chg).toFixed(1)}
      </span>
    </div>
  );
}

export function Header({ fx, onMenuClick, isSmall, studyType, setStudyType }: HeaderProps) {
  const allPairs = [
    { label: "GBP/JPY", val: fx.GBP, chg: +0.3 },
    { label: "USD/JPY", val: fx.USD, chg: -0.8 },
    { label: "AUD/JPY", val: fx.AUD, chg: +1.2 },
    { label: "CAD/JPY", val: fx.CAD, chg: -0.2 },
  ];

  const menuButton = (
    <button
      onClick={onMenuClick}
      className="xl:hidden items-center"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "4px 2px",
      }}
    >
      <SvgIcon name="menu" size={22} color="#5e6b86" />
    </button>
  );

  const studyToggle = (
    <div style={{ display: "flex", gap: 4, background: "#f0f4ff", padding: "4px", borderRadius: 6 }}>
      {STUDY_TYPES.map((st) => (
        <button
          key={st.id}
          onClick={() => setStudyType(st.id)}
          style={{
            padding: "6px 11px",
            borderRadius: 4,
            border: "none",
            background: studyType === st.id ? "#fff" : "transparent",
            color: studyType === st.id ? "#2f63e6" : "#8899bb",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.12s",
            whiteSpace: "nowrap",
          }}
        >
          {st.label}
        </button>
      ))}
    </div>
  );

  // 縦長・小画面: 上段(メニュー+留学タイプ) / 下段(為替4通貨を2x2グリッド)の2段レイアウト
  if (isSmall) {
    return (
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e3e9f5",
          flexShrink: 0,
          padding: "8px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          {menuButton}
          {studyToggle}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", rowGap: 8, columnGap: 12 }}>
          {allPairs.map((p) => (
            <FxPair key={p.label} label={p.label} val={p.val} chg={p.chg} isSmall={isSmall} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "1px solid #e3e9f5",
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 40px",
        flexShrink: 0,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        {menuButton}
        {allPairs.map((p) => (
          <FxPair key={p.label} label={p.label} val={p.val} chg={p.chg} isSmall={isSmall} />
        ))}
      </div>

      {studyToggle}
    </div>
  );
}

export default Header;
