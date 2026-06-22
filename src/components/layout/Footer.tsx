import { useState } from "react";
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from "../../constants/legalTexts";
import { FeedbackModal } from "../FeedbackModal";

interface FooterProps {
  isSmall: boolean;
}

function LegalModal({ title, content, onClose }: { title: string; content: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 29, 51, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 32,
          maxWidth: 700,
          maxHeight: 700,
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(20,29,51,.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#141d33", marginTop: 0, marginBottom: 20 }}>
          {title}
        </h2>
        <div style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {content}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 24,
            padding: "8px 16px",
            borderRadius: 6,
            background: "#f0f4ff",
            color: "#2f63e6",
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e3e9f5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f0f4ff")}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

export function Footer({ isSmall }: FooterProps) {
  const [hov, setHov] = useState<string | null>(null);
  const [modal, setModal] = useState<"terms" | "privacy" | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleClick = (label: string) => {
    if (label === "利用規約") setModal("terms");
    else if (label === "プライバシーポリシー") setModal("privacy");
  };

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
        <div style={{ display: "flex", gap: isSmall ? 12 : 24 }}>
          {["利用規約", "プライバシーポリシー"].map((l) => (
            <button
              key={l}
              onClick={() => handleClick(l)}
              onMouseEnter={() => setHov(l)}
              onMouseLeave={() => setHov(null)}
              style={{
                fontSize: isSmall ? 10 : 11,
                color: hov === l ? "#2f63e6" : "#8899bb",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.12s",
                fontFamily: '"IBM Plex Mono", monospace',
                padding: 0,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </footer>

      {modal === "terms" && (
        <LegalModal
          title="利用規約"
          content={TERMS_OF_SERVICE}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "privacy" && (
        <LegalModal
          title="プライバシーポリシー"
          content={PRIVACY_POLICY}
          onClose={() => setModal(null)}
        />
      )}

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
