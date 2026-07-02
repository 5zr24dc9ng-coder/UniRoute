import { useState } from "react";

interface RemittanceCostComparisonProps {
  affiliateLink?: string;
  hideAnchor?: boolean;
}

export function RemittanceCostComparison({ affiliateLink = "https://wise.prf.hn/click/camref:1101l5Nsvb", hideAnchor = false }: RemittanceCostComparisonProps) {
  const [rawAmount, setRawAmount] = useState("100000");

  const amount = parseInt(rawAmount, 10);
  const hasValue = !isNaN(amount) && amount > 0;

  // 計算ロジック（有効値のみ）
  const bankCost = hasValue ? Math.round(amount * 0.035 + 2500) : 0;
  const wiseCost = hasValue ? Math.round(amount * 0.0087 + 50) : 0;
  const savings = bankCost - wiseCost;

  const handleScroll = () => {
    const widget = document.getElementById("remittance-widget");
    if (widget) {
      widget.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* アンカーリンク（ページ上部用） */}
      {!hideAnchor && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <button
            onClick={handleScroll}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#2f63e6",
              fontWeight: 600,
              padding: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            約11万円の隠れコスト（銀行手数料）を削る方法を見る ↓
          </button>
        </div>
      )}

      {/* メインウィジェット */}
      <div
        id="remittance-widget"
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e3e9f5",
          padding: "28px 24px",
          maxWidth: 500,
          margin: "0 auto",
          boxShadow: "0 4px 12px rgba(20,29,51,.08)",
        }}
      >
        {/* タイトル */}
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#141d33",
            margin: "0 0 20px",
          }}
        >
          送金コスト シミュレーター
        </h3>

        {/* 送金額入力 */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#5e6b86",
              marginBottom: 8,
            }}
          >
            送金予定額（円）
          </label>
          <input
            type="number"
            value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e3e9f5",
              fontSize: 14,
              color: "#1c2740",
              fontFamily: '"IBM Plex Mono", monospace',
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* コスト比較カード */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {/* 銀行送金 */}
          <div
            style={{
              background: "#fafcff",
              borderRadius: 12,
              padding: "16px",
              border: "1px solid #f0f4ff",
            }}
          >
            <div style={{ fontSize: 11, color: "#5e6b86", fontWeight: 600, marginBottom: 8 }}>
              銀行振込
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#cf4a4a",
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              {hasValue ? `¥${bankCost.toLocaleString()}` : "—"}
            </div>
            <div style={{ fontSize: 10, color: "#8899bb", marginTop: 6 }}>
              +3.5% + ¥2,500
            </div>
          </div>

          {/* Wise */}
          <div
            style={{
              background: "#e8f5e9",
              borderRadius: 12,
              padding: "16px",
              border: "1px solid #c8e6c9",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#1b5e20", fontWeight: 600 }}>Wise</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#4a9e6a",
                  background: "#d4edda",
                  padding: "1px 4px",
                  borderRadius: 3,
                  letterSpacing: "0.03em",
                }}
              >
                PR
              </span>
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#1f9268",
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              {hasValue ? `¥${wiseCost.toLocaleString()}` : "—"}
            </div>
            <div style={{ fontSize: 10, color: "#2d7a4a", marginTop: 6 }}>
              +0.87% + ¥50
            </div>
          </div>
        </div>

        {/* 節約額 + CTAボタン ブロック（強く統合） */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%)",
            borderRadius: 12,
            border: "2px solid #2f63e6",
            padding: "18px 20px",
            marginBottom: 0,
          }}
        >
          {/* 節約額表示 */}
          <div style={{ marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#5e6b86", fontWeight: 600, marginBottom: 6 }}>
              🎯 このシミュレーションで節約可能
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#1f9268",
                fontFamily: '"IBM Plex Mono", monospace',
                letterSpacing: "-0.5px",
              }}
            >
              {hasValue ? `¥${savings.toLocaleString()}` : "—"}
            </div>
            <div style={{ fontSize: 10, color: "#2d7a4a", marginTop: 4 }}>
              {hasValue ? `${((savings / bankCost) * 100).toFixed(0)}% のコスト削減` : "金額を入力してください"}
            </div>
          </div>

          {/* CTA ボタン */}
          <a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "12px 16px",
              background: "#2f63e6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "none",
              transition: "all 0.2s ease",
              boxSizing: "border-box",
              boxShadow: "0 2px 8px rgba(47,99,230,.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1f49b8";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(47,99,230,.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2f63e6";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(47,99,230,.3)";
            }}
          >
            現在の為替レートをキープして初回送金へ ↗
          </a>
        </div>

        {/* 注釈 */}
        <div
          style={{
            fontSize: 11,
            color: "#8899bb",
            marginTop: 16,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          ※ 手数料計算は一般的な銀行 and Wise の平均レートを基準としています。
        </div>
      </div>
    </>
  );
}

export default RemittanceCostComparison;
