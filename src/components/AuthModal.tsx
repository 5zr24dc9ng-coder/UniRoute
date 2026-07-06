import { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";

interface AuthModalProps {
  onClose: () => void;
  initialMode?: "sign-in" | "sign-up";
}

// Clerkのブランドカラーを既存アプリのプライマリブルーに合わせる
const clerkAppearance = {
  variables: {
    colorPrimary: "#2f63e6",
    colorText: "#1c2740",
    colorTextSecondary: "#5e6b86",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#1c2740",
    borderRadius: "10px",
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  elements: {
    card: { boxShadow: "none", padding: 0, backgroundColor: "transparent" },
    cardBox: { boxShadow: "none", backgroundColor: "transparent" },
    rootBox: { width: "100%" },
    // 自作モーダル側に「ログイン/新規登録」タブがあるため、Clerkのデフォルト見出しは冗長なので非表示
    header: { display: "none" },
    formFieldLabel: { color: "#1c2740", fontWeight: 600 },
    formButtonPrimary: {
      backgroundColor: "#2f63e6",
      boxShadow: "none",
      "&:hover": { backgroundColor: "#1f49b8" },
    },
    // formFieldInput/socialButtonsBlockButton/otpCodeFieldInput/dividerLineの枠線は
    // Clerk側の内部スタイルが優先されこの指定が効かないため、index.cssで!important上書きしている
    footerActionLink: { color: "#2f63e6", fontWeight: 600 },
  },
};

export function AuthModal({ onClose, initialMode = "sign-in" }: AuthModalProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(20, 29, 51, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, padding: "28px 28px 20px",
          width: 420, maxWidth: "100%", maxHeight: "90vh", overflow: "auto",
          boxShadow: "0 20px 60px rgba(20,29,51,.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setMode("sign-in")}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: mode === "sign-in" ? "#eaf0fe" : "transparent",
                color: mode === "sign-in" ? "#2f63e6" : "#8899bb",
              }}
            >
              ログイン
            </button>
            <button
              onClick={() => setMode("sign-up")}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: mode === "sign-up" ? "#eaf0fe" : "transparent",
                color: mode === "sign-up" ? "#2f63e6" : "#8899bb",
              }}
            >
              新規登録
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, background: "#f0f4ff", color: "#5e6b86",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", border: "none",
            }}
          >
            ✕
          </button>
        </div>

        {/* routing="virtual": このSPAにはURLベースのルーターが無いため、モーダル内で完結させる */}
        {mode === "sign-in" ? (
          <SignIn
            routing="virtual"
            signUpUrl="#"
            afterSignInUrl="/"
            appearance={clerkAppearance}
          />
        ) : (
          <SignUp
            routing="virtual"
            signInUrl="#"
            afterSignUpUrl="/"
            appearance={clerkAppearance}
          />
        )}
      </div>
    </div>
  );
}

export default AuthModal;
