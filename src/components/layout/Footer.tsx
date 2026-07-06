import { useState } from "react";
import { FeedbackModal } from "../FeedbackModal";

interface FooterProps {
  isSmall: boolean;
}

const LEGAL_LINKS: { label: string; param: string }[] = [
  { label: "利用規約", param: "terms" },
  { label: "プライバシーポリシー", param: "privacy" },
  { label: "特定商取引法に基づく表示", param: "tokushoho" },
];

export function Footer({ isSmall }: FooterProps) {
  const [hov, setHov] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <footer
        style={{
          background: "#fff",
          borderTop: "1px solid #e3e9f5",
          padding: isSmall ? "10px 16px" : "10px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: "#aab6c8" }}>
          © 2026 UniRoute
        </span>
        <div style={{ display: "flex", gap: isSmall ? 12 : 24, flexWrap: "wrap" }}>
          {LEGAL_LINKS.map(({ label, param }) => (
            <a
              key={param}
              href={`?legal=${param}`}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHov(label)}
              onMouseLeave={() => setHov(null)}
              style={{
                fontSize: isSmall ? 10 : 11,
                color: hov === label ? "#2f63e6" : "#8899bb",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.12s",
                fontFamily: '"IBM Plex Mono", monospace',
                padding: 0,
                textDecoration: "none",
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </footer>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}

      {/* Floating feedback button */}
      <button
        onClick={() => setFeedbackOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#2f63e6",
          color: "#fff",
          border: "none",
          fontSize: 20,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(47,99,230,.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          zIndex: 9996,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#1f49b8";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(47,99,230,.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#2f63e6";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(47,99,230,.3)";
        }}
        title="フィードバックを送信"
      >
        💬
      </button>
    </>
  );
}

export default Footer;
