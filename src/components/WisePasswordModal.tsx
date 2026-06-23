import { useState } from "react";

interface WisePasswordModalProps {
  onUnlock: () => void;
  onClose: () => void;
}

export function WisePasswordModal({ onUnlock, onClose }: WisePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (password === "uniroute2026") {
      localStorage.setItem("wise_unlocked", "true");
      onUnlock();
      setPassword("");
      setError("");
    } else {
      setError("パスワードが正しくありません");
      setPassword("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

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
          maxWidth: 400,
          boxShadow: "0 20px 60px rgba(20,29,51,.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#141d33", marginTop: 0, marginBottom: 20 }}>
          Wise機能ロック解除
        </h2>
        <p style={{ fontSize: 13, color: "#5e6b86", marginBottom: 20 }}>
          この機能を利用するにはパスワードを入力してください。
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="パスワードを入力"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #e3e9f5",
            fontSize: 14,
            color: "#1c2740",
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            boxSizing: "border-box",
            marginBottom: error ? 8 : 20,
          }}
          autoFocus
        />
        {error && (
          <p style={{ fontSize: 12, color: "#d32f2f", margin: "0 0 20px" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "#f0f4ff",
              color: "#5e6b86",
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e3e9f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0f4ff")}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "#2f63e6",
              color: "#fff",
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1f49b8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2f63e6")}
          >
            ロック解除
          </button>
        </div>
      </div>
    </div>
  );
}

export default WisePasswordModal;
