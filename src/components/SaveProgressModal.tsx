import { useClerk } from "@clerk/clerk-react";

interface SaveProgressModalProps {
  onClose: () => void;
}

const RISKS = [
  { text: "端末の機種変更・買い替え" },
  { text: "ブラウザのキャッシュ・履歴の削除" },
  { text: "別のブラウザ・別の端末からアクセス" },
];

export function SaveProgressModal({ onClose }: SaveProgressModalProps) {
  const { openSignUp } = useClerk();

  function handleCreateAccount() {
    onClose();
    openSignUp();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,29,51,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 380,
          maxWidth: "100%",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(20,29,51,.3)",
          padding: 28,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#141d33", margin: "0 0 8px" }}>
          今の進捗は、この端末だけに保存されています
        </h3>
        <p style={{ fontSize: 13, color: "#5e6b86", lineHeight: 1.7, margin: "0 0 16px" }}>
          次のようなケースでは、これまで入力した内容が失われます。
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {RISKS.map((r) => (
            <div
              key={r.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#f8faff",
                border: "1px solid #e3e9f5",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <span style={{ fontSize: 13, color: "#1c2740" }}>{r.text}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
            border: "1px solid #c7d2fe",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 13, color: "#4338ca", fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
            アカウントを作ると、どの端末からでも続きから再開できます
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              border: "1.5px solid #e3e9f5",
              background: "#f8faff",
              fontSize: 13,
              cursor: "pointer",
              color: "#5e6b86",
            }}
          >
            後で
          </button>
          <button
            onClick={handleCreateAccount}
            style={{
              flex: 1.4,
              padding: "10px",
              borderRadius: 8,
              border: "none",
              background: "#2f63e6",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(47,99,230,.3)",
            }}
          >
            アカウントを作る
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveProgressModal;
