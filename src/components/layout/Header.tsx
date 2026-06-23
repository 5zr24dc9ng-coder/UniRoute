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

export function Header({ fx, onMenuClick, isSmall, studyType, setStudyType }: HeaderProps) {
  const allPairs = [
    { label: "GBP/JPY", val: fx.GBP, chg: +0.3 },
    { label: "USD/JPY", val: fx.USD, chg: -0.8 },
    { label: "AUD/JPY", val: fx.AUD, chg: +1.2 },
    { label: "CAD/JPY", val: fx.CAD, chg: -0.2 },
  ];
  const pairs = isSmall ? allPairs.slice(0, 2) : allPairs;
  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "1px solid #e3e9f5",
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${isSmall ? "8px" : "12px"} ${isSmall ? 16 : 40}px`,
        flexShrink: 0,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: isSmall ? 14 : 26 }}>
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
        {pairs.map((p) => (
          <div key={p.label} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: isSmall ? 10 : 11,
                color: "#8899bb",
                letterSpacing: "0.05em",
              }}
            >
              {p.label}
            </span>
            <span
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: isSmall ? 12 : 14,
                fontWeight: 600,
                color: "#1c2740",
              }}
            >
              {p.val.toFixed(1)}
            </span>
            <span
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 10,
                color: p.chg > 0 ? "#1f9268" : "#cf4a4a",
              }}
            >
              {p.chg > 0 ? "▲" : "▼"}
              {Math.abs(p.chg).toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Study type toggle */}
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

    </div>
  );
}

export default Header;
