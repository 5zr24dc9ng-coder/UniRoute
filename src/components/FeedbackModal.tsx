import { useState } from "react";

interface FeedbackModalProps {
  onClose: () => void;
}

type FeedbackType = "不具合の報告" | "改善のアイデア" | "その他";
type SubmitState = "form" | "sending" | "success" | "error";

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>("改善のアイデア");
  const [text, setText] = useState("");
  const [state, setState] = useState<SubmitState>("form");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("メッセージを入力してください");
      return;
    }

    setState("sending");
    setError(null);

    try {
      const country = localStorage.getItem("uniroute_country") || "UK";
      const studyType = localStorage.getItem("uniroute_studyType") || "DEGREE";
      const taskCountStr = localStorage.getItem("uniroute_completedTasksCount") || "0";
      const taskCount = parseInt(taskCountStr, 10);

      const payload = {
        type,
        message: text,
        country,
        studyType,
        taskCount,
      };

      const endpointUrl =
        "https://script.google.com/macros/s/AKfycbx2O9GFluGAXRYnX_8xPRX0TvkVjVrDDuM5HGRTf8wIJZF1HRk8Nt15cAVcSsGgJwOKxw/exec";

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("送信に失敗しました");
      }

      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
      setState("form");
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
        zIndex: 9997,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 32,
          maxWidth: 500,
          maxHeight: 600,
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(20,29,51,.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(state === "form" || state === "sending") && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#141d33", marginTop: 0, marginBottom: 20 }}>
              フィードバックをお寄せください
            </h2>

            {/* Type selection */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5e6b86", marginBottom: 8, display: "block" }}>
                種類
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["不具合の報告", "改善のアイデア", "その他"] as FeedbackType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: `1.5px solid ${type === t ? "#2f63e6" : "#e3e9f5"}`,
                      background: type === t ? "#2f63e6" : "#fff",
                      color: type === t ? "#fff" : "#5e6b86",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Text input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5e6b86", marginBottom: 8, display: "block" }}>
                メッセージ
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="具体的な状況やご意見をお聞かせください"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 6,
                  border: "1px solid #e3e9f5",
                  fontSize: 13,
                  color: "#1c2740",
                  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                  minHeight: 120,
                  boxSizing: "border-box",
                  resize: "none",
                }}
              />
              <p style={{ fontSize: 11, color: "#999", marginTop: 8, marginBottom: 16 }}>
                ※個人情報（氏名や連絡先等）は絶対に入力しないでください
              </p>
              {error && <p style={{ fontSize: 12, color: "#d32f2f", marginTop: 8, margin: 0 }}>{error}</p>}
            </div>

            {/* Buttons */}
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
                disabled={state === "sending"}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "#2f63e6",
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: state === "sending" ? "not-allowed" : "pointer",
                  opacity: state === "sending" ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (state !== "sending") e.currentTarget.style.background = "#1f49b8";
                }}
                onMouseLeave={(e) => {
                  if (state !== "sending") e.currentTarget.style.background = "#2f63e6";
                }}
              >
                {state === "sending" ? "送信中..." : "送信する"}
              </button>
            </div>
          </>
        )}

        {state === "success" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#141d33", marginBottom: 12 }}>
              ✓ ご送信ありがとうございます
            </p>
            <p style={{ fontSize: 13, color: "#5e6b86", marginBottom: 24 }}>
              貴重なご意見ありがとうございます。今後のアップデートの参考にさせていただきます。
            </p>
            <button
              onClick={onClose}
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
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;
