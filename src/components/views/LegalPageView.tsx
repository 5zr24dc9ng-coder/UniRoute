import { TERMS_OF_SERVICE, PRIVACY_POLICY, TOKUSHOHO_DISPLAY } from "../../constants/legalTexts";

type LegalDoc = "terms" | "privacy" | "tokushoho";

const DOC_MAP: Record<LegalDoc, { title: string; content: string }> = {
  terms: { title: "利用規約", content: TERMS_OF_SERVICE },
  privacy: { title: "プライバシーポリシー", content: PRIVACY_POLICY },
  tokushoho: { title: "特定商取引法に基づく表示", content: TOKUSHOHO_DISPLAY },
};

// フッターや外部（Clerkのサインアップ同意リンク等）から直接開ける、独立したURL付きの規約ページ。
// ?legal=terms | privacy | tokushoho で表示内容を切り替える。
export function LegalPageView({ doc }: { doc: LegalDoc }) {
  const { title, content } = DOC_MAP[doc];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8faff",
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: "36px 40px",
          boxShadow: "0 4px 20px rgba(20,29,51,.06)",
        }}
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {(Object.keys(DOC_MAP) as LegalDoc[]).map((key) => (
            <a
              key={key}
              href={`?legal=${key}`}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: key === doc ? "#2f63e6" : "#8899bb",
                textDecoration: "none",
                borderBottom: key === doc ? "2px solid #2f63e6" : "2px solid transparent",
                paddingBottom: 4,
              }}
            >
              {DOC_MAP[key].title}
            </a>
          ))}
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#141d33", margin: "0 0 20px" }}>{title}</h1>
        <div style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {content}
        </div>

        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: 28,
            fontSize: 12,
            fontWeight: 600,
            color: "#2f63e6",
            textDecoration: "none",
          }}
        >
          ← UniRouteに戻る
        </a>
      </div>
    </div>
  );
}

export default LegalPageView;
