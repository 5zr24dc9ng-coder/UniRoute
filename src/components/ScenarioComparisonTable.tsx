import { useWindowWidth } from "../hooks/useWindowWidth";
import { ROWS, getBestIndex } from "../utils/comparisonRows";
import type { Fx, SimScenario } from "../types";

interface ScenarioComparisonTableProps {
  scenarios: SimScenario[];
  fx: Fx;
  onClose: () => void;
}

export function ScenarioComparisonTable({ scenarios, fx, onClose }: ScenarioComparisonTableProps) {
  const isSM = useWindowWidth() < 768;
  const labelColWidth = isSM ? 110 : 150;
  const scenarioColWidth = isSM ? 120 : 160;
  const totalWidth = labelColWidth + scenarioColWidth * scenarios.length;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(20,29,51,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1200, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 900,
          maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(20,29,51,.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 24px", borderBottom: "1px solid #e3e9f5", flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>P</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#141d33", margin: 0 }}>シナリオ比較</h3>
            </div>
            <p style={{ fontSize: 12, color: "#8899bb", margin: 0 }}>
              保存した{scenarios.length}件のシナリオを横並びで比較（緑＝最安）
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#5e6b86", lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        {/* テーブル本体 */}
        <div style={{ overflow: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ minWidth: totalWidth }}>
            {/* シナリオ名ヘッダー行 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `${labelColWidth}px repeat(${scenarios.length}, ${scenarioColWidth}px)`,
                background: "#fff",
                borderBottom: "1px solid #f0f4ff",
                position: "sticky", top: 0, zIndex: 10,
              }}
            >
              <div style={{ padding: "14px 16px", borderRight: "1px solid #f8fafc" }} />
              {scenarios.map((s) => (
                <div key={s.id} style={{ textAlign: "center", padding: "14px 10px", borderTop: "3px solid #4f46e5" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#141d33", wordBreak: "break-word" }}>{s.name}</div>
                </div>
              ))}
            </div>

            {/* データ行 */}
            {ROWS.map((row, ri) => {
              const bestIdx = getBestIndex(row, scenarios, fx);
              const values = scenarios.map((s) => row.getValue(s, fx));
              return (
                <div
                  key={ri}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `${labelColWidth}px repeat(${scenarios.length}, ${scenarioColWidth}px)`,
                    borderTop: "1px solid #f1f5f9",
                    background: row.label === "推定総額" ? "#f8faff" : "#fff",
                  }}
                >
                  <div style={{ padding: "12px 16px", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: "#334155", fontWeight: row.label === "推定総額" ? 700 : 500 }}>{row.label}</span>
                    {row.sub && <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{row.sub}</span>}
                  </div>
                  {values.map((val, ci) => {
                    const isBest = ci === bestIdx;
                    return (
                      <div
                        key={ci}
                        style={{
                          padding: "10px 8px", textAlign: "center",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                          background: isBest ? "#f0fdf4" : "transparent",
                          position: "relative",
                        }}
                      >
                        {isBest && (
                          <div style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                        )}
                        <span
                          style={{
                            fontSize: isSM ? 11 : 12,
                            fontWeight: isBest ? 700 : 600,
                            color: isBest ? "#15803d" : "#1e293b",
                            fontFamily: '"IBM Plex Mono", monospace',
                            whiteSpace: "nowrap",
                          }}
                        >
                          {val.display}
                        </span>
                        {isBest && row.best !== "none" && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", letterSpacing: "0.04em" }}>最安</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "12px 24px", borderTop: "1px solid #e3e9f5", flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: "#8899bb", margin: 0, lineHeight: 1.6 }}>
            ※ 為替レートは現在シミュレーション画面で設定中のレートを使用しています。各項目の最安値はその項目単体の比較で、必ずしも総額最安のシナリオと一致しない場合があります。
          </p>
        </div>
      </div>
    </div>
  );
}

export default ScenarioComparisonTable;
