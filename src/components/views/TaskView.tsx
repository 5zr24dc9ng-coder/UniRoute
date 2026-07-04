import { useState, useEffect } from "react";
import { getTasksByCountryAndType, type TaskMaster } from "../../constants/tasks";
import { COUNTRY_DATA } from "../../constants/countries";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import type { CountryId, StudyType } from "../../types";

// ─── 型定義 ───────────────────────────────────────────────────────────────────
interface Scenario {
  id: string;
  name: string;
  country: CountryId;
  studyType: StudyType;
  departureDate: string;
}

interface TaskViewProps {
  country: CountryId;
  studyType: StudyType;
  isPremium: boolean;
  onUpgrade: () => void;
}

// ─── ユーティリティ ─────────────────────────────────────────────────────────
/** timing文字列から「あとX日」を計算 */
function getDaysUntilDeadline(timing: string, departureDate: string): number | null {
  if (!departureDate) return null;
  const dep = new Date(departureDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 数値をすべて抽出
  const nums = timing.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return null;

  // "週間" が含まれれば週単位、それ以外は月単位
  const isWeeks = timing.includes("週間");
  // 小さい数字 = タスクを「終わらせるべき」期限
  const deadline = new Date(dep);
  if (isWeeks) {
    deadline.setDate(deadline.getDate() - Math.min(...nums) * 7);
  } else {
    deadline.setMonth(deadline.getMonth() - Math.min(...nums));
  }
  return Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
}

function CountdownBadge({ days }: { days: number }) {
  const isOverdue = days < 0;
  const isUrgent = days >= 0 && days <= 30;
  const bg = isOverdue ? "#dc2626" : isUrgent ? "#f59e0b" : "#1f9268";
  const label = isOverdue ? `${Math.abs(days)}日超過` : `あと${days}日`;
  return (
    <span
      style={{
        background: bg,
        color: "#fff",
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        fontFamily: '"IBM Plex Mono", monospace',
        letterSpacing: "0.04em",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

// ─── タスクカード ────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: TaskMaster;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
}

function TaskCard({ task, isExpanded, isCompleted, onToggleExpand, onToggleComplete }: TaskCardProps) {
  return (
    <div
      style={{
        border: `1.5px solid ${isCompleted ? "#bbf7d0" : "#c8d9fd"}`,
        borderRadius: 12,
        overflow: "hidden",
        background: isCompleted ? "#f0fdf4" : "#eef4ff",
        boxShadow: "0 1px 2px rgba(20,29,51,.03)",
        opacity: isCompleted ? 0.75 : 1,
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}
      >
        {/* チェックボックス */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            border: `2px solid ${isCompleted ? "#16a34a" : "#94b3fa"}`,
            background: isCompleted ? "#16a34a" : "transparent",
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          {isCompleted && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* タイトル */}
        <div
          onClick={onToggleExpand}
          style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isCompleted ? "#15803d" : "#1c2740",
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {task.title}
          </span>
          {task.dependsOn && task.dependsOn.length > 0 && (
            <div style={{ marginTop: 3 }}>
              <span style={{ fontSize: 11, color: "#8899bb", fontFamily: '"IBM Plex Mono", monospace' }}>
                → 依存: {task.dependsOn.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* 展開矢印 */}
        <div
          onClick={onToggleExpand}
          style={{ color: "#c4cdd8", fontSize: 11, flexShrink: 0, cursor: "pointer" }}
        >
          {isExpanded ? "▲" : "▼"}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: "14px 16px", borderTop: "1px solid #d4e4fd", background: "rgba(248,250,255,0.7)" }}>
          <p style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.7, margin: 0 }}>{task.description}</p>
        </div>
      )}
    </div>
  );
}

// ─── プレミアムロックバナー ───────────────────────────────────────────────────
function PremiumLockBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      style={{
        border: "1.5px dashed #a5b4fc",
        borderRadius: 12,
        padding: "16px 20px",
        background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4338ca" }}>プレミアム機能</div>
          <div style={{ fontSize: 12, color: "#6366f1", marginTop: 2 }}>出国日カウントダウン・シナリオ保存を解放</div>
        </div>
      </div>
      <button
        onClick={onUpgrade}
        style={{
          padding: "8px 18px",
          borderRadius: 8,
          border: "none",
          background: "#4f46e5",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#3730a3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#4f46e5")}
      >
        プレミアムを解放
      </button>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export function TaskView({ country: defaultCountry, studyType, isPremium, onUpgrade }: TaskViewProps) {
  const isSM = useWindowWidth() < 1024;
  const [selectedCountry, setSelectedCountry] = useState<CountryId>(defaultCountry);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 完了タスク (localStorage)
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("uniroute_completed_tasks");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  // 出国日 (premium)
  const [departureDate, setDepartureDate] = useState<string>(() =>
    localStorage.getItem("uniroute_departure_date") ?? ""
  );

  // シナリオ (premium)
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const raw = localStorage.getItem("uniroute_scenarios");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(
    () => localStorage.getItem("uniroute_active_scenario_id")
  );
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  // persistences
  useEffect(() => {
    localStorage.setItem("uniroute_completed_tasks", JSON.stringify([...completedIds]));
  }, [completedIds]);

  useEffect(() => {
    if (departureDate) localStorage.setItem("uniroute_departure_date", departureDate);
  }, [departureDate]);

  useEffect(() => {
    localStorage.setItem("uniroute_scenarios", JSON.stringify(scenarios));
  }, [scenarios]);

  useEffect(() => {
    if (activeScenarioId) localStorage.setItem("uniroute_active_scenario_id", activeScenarioId);
  }, [activeScenarioId]);

  // シナリオを切り替えたら表示を更新
  function loadScenario(s: Scenario) {
    setSelectedCountry(s.country);
    if (s.departureDate) setDepartureDate(s.departureDate);
    setActiveScenarioId(s.id);
  }

  function saveScenario() {
    if (!scenarioName.trim()) return;
    const newS: Scenario = {
      id: Date.now().toString(),
      name: scenarioName.trim(),
      country: selectedCountry,
      studyType,
      departureDate,
    };
    const updated = [...scenarios, newS];
    setScenarios(updated);
    setActiveScenarioId(newS.id);
    setScenarioName("");
    setSaveModalOpen(false);
  }

  function deleteScenario(id: string) {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    if (activeScenarioId === id) setActiveScenarioId(null);
  }

  const countryName = COUNTRY_DATA[selectedCountry].name;
  const studyTypeLabel = { DEGREE: "正規留学", EXCHANGE: "交換留学", LANGUAGE: "語学留学" }[studyType];
  const masterTasks = getTasksByCountryAndType(selectedCountry, studyType);

  const getMonth = (timing: string): number => {
    const match = timing.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const sortedTasks = [...masterTasks].sort((a, b) => getMonth(b.timing) - getMonth(a.timing));
  const grouped = sortedTasks.reduce<{ timing: string; tasks: TaskMaster[] }[]>((acc, task) => {
    const existing = acc.find((g) => g.timing === task.timing);
    if (existing) existing.tasks.push(task);
    else acc.push({ timing: task.timing, tasks: [task] });
    return acc;
  }, []);

  const completedCount = masterTasks.filter((t) => completedIds.has(t.id)).length;
  const totalCount = masterTasks.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const COUNTRIES: CountryId[] = ["US", "UK", "AU", "CA"];

  function toggleComplete(id: string) {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ padding: isSM ? "20px 16px" : "36px 40px", maxWidth: 800, margin: "0 auto" }}>

      {/* ─── ヘッダー ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#5e6b86",
            display: "block",
            marginBottom: 6,
          }}
        >
          クリティカルパス · タスク管理
        </span>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#141d33", letterSpacing: "-0.02em", margin: "0 0 18px" }}>
          {countryName} · {studyTypeLabel} · 2026
        </h2>

        {/* 国タブ */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {COUNTRIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: selectedCountry === c ? 600 : 500,
                color: selectedCountry === c ? "#fff" : "#5e6b86",
                background: selectedCountry === c ? "#2f63e6" : "#e8ecf3",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: selectedCountry === c ? "0 2px 8px rgba(47,99,230,.3)" : "none",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: "#5e6b86", margin: 0 }}>
          国別・種類別の動的タスク管理（{totalCount} タスク）
        </p>
      </div>

      {/* ─── 進捗バー ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#5e6b86" }}>進捗</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: completedCount === totalCount ? "#16a34a" : "#1c2740" }}>
            {completedCount} / {totalCount} 完了
          </span>
        </div>
        <div style={{ height: 6, background: "#e3e9f5", borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: progressPct === 100 ? "#16a34a" : "#2f63e6",
              borderRadius: 3,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* ─── プレミアム機能エリア ───────────────────────────────────── */}
      {!isPremium ? (
        <div style={{ marginBottom: 28 }}>
          <PremiumLockBanner onUpgrade={onUpgrade} />
        </div>
      ) : (
        <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 出国日入力 */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e3e9f5",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1c2740", flexShrink: 0 }}>✈️ 出国日</span>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              style={{
                border: "1.5px solid #c8d9fd",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 13,
                color: "#1c2740",
                background: "#f8faff",
                cursor: "pointer",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {departureDate && (
              <span style={{ fontSize: 12, color: "#5e6b86" }}>
                {new Date(departureDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
          </div>

          {/* シナリオ保存 */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e3e9f5",
              borderRadius: 12,
              padding: "14px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: scenarios.length > 0 ? 12 : 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1c2740" }}>📁 シナリオ</span>
              <button
                onClick={() => setSaveModalOpen(true)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "1.5px solid #2f63e6",
                  background: "transparent",
                  color: "#2f63e6",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + 現在の設定を保存
              </button>
            </div>

            {scenarios.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {scenarios.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      borderRadius: 20,
                      border: `1.5px solid ${activeScenarioId === s.id ? "#2f63e6" : "#e3e9f5"}`,
                      background: activeScenarioId === s.id ? "#eef4ff" : "#f8faff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onClick={() => loadScenario(s)}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: activeScenarioId === s.id ? "#2f63e6" : "#5e6b86" }}>
                      {s.name}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {s.country} · {{ DEGREE: "正規", EXCHANGE: "交換", LANGUAGE: "語学" }[s.studyType]}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteScenario(s.id); }}
                      style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, padding: 0, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {scenarios.length === 0 && (
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0 0" }}>
                国・出国日の組み合わせをシナリオとして保存できます
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── 保存モーダル ─────────────────────────────────────────── */}
      {saveModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,29,51,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setSaveModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 28,
              width: 320,
              boxShadow: "0 20px 60px rgba(20,29,51,.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#141d33", margin: "0 0 16px" }}>シナリオを保存</h3>
            <p style={{ fontSize: 12, color: "#5e6b86", margin: "0 0 12px" }}>
              {selectedCountry} · {studyTypeLabel}{departureDate ? ` · 出国 ${new Date(departureDate).toLocaleDateString("ja-JP")}` : ""}
            </p>
            <input
              type="text"
              placeholder="例：ロンドン正規2年"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveScenario()}
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1.5px solid #c8d9fd",
                fontSize: 14,
                color: "#1c2740",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                marginBottom: 14,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setSaveModalOpen(false)}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #e3e9f5", background: "#f8faff", fontSize: 13, cursor: "pointer", color: "#5e6b86" }}
              >
                キャンセル
              </button>
              <button
                onClick={saveScenario}
                disabled={!scenarioName.trim()}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, border: "none",
                  background: scenarioName.trim() ? "#2f63e6" : "#e3e9f5",
                  color: scenarioName.trim() ? "#fff" : "#94a3b8",
                  fontSize: 13, fontWeight: 600, cursor: scenarioName.trim() ? "pointer" : "not-allowed",
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── タイムライン ─────────────────────────────────────────── */}
      {masterTasks.length === 0 ? (
        <p style={{ color: "#8899bb", fontSize: 14, marginTop: 32 }}>該当するタスクがありません</p>
      ) : (
        <div style={{ position: "relative" }}>
          {/* 縦ライン */}
          <div
            style={{
              position: "absolute",
              left: 7,
              top: 0,
              bottom: 0,
              width: 2,
              background: "#e3e9f5",
              borderRadius: 1,
            }}
          />

          {grouped.map(({ timing, tasks }, gi) => {
            const days = isPremium && departureDate ? getDaysUntilDeadline(timing, departureDate) : null;
            return (
              <div key={timing} style={{ marginTop: gi > 0 ? 28 : 0 }}>
                {/* 期間バッジ */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#2f63e6",
                      border: "3px solid #f8faff",
                      flexShrink: 0,
                      position: "relative",
                      zIndex: 1,
                    }}
                  />
                  <span
                    style={{
                      background: "#2f63e6",
                      color: "#fff",
                      borderRadius: 6,
                      padding: "4px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: '"IBM Plex Mono", monospace',
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    {timing}
                  </span>
                  {days !== null && <CountdownBadge days={days} />}
                </div>

                {/* タスクカード */}
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: completedIds.has(task.id) ? "#16a34a" : "#fff",
                        border: `2px solid ${completedIds.has(task.id) ? "#16a34a" : "#c8d9fd"}`,
                        flexShrink: 0,
                        marginTop: 14,
                        position: "relative",
                        zIndex: 1,
                        transition: "all 0.2s ease",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <TaskCard
                        task={task}
                        isExpanded={expandedId === task.id}
                        isCompleted={completedIds.has(task.id)}
                        onToggleExpand={() => setExpandedId((prev) => (prev === task.id ? null : task.id))}
                        onToggleComplete={() => toggleComplete(task.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* 出国ゴール */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 28 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: completedCount === totalCount ? "#16a34a" : "#1f9268",
                border: "3px solid #f8faff",
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
              }}
            />
            <span
              style={{
                background: completedCount === totalCount ? "#16a34a" : "#1f9268",
                color: "#fff",
                borderRadius: 6,
                padding: "5px 14px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {completedCount === totalCount ? "✓ 準備完了 · 出国" : "出国"}
            </span>
            {departureDate && (
              <span style={{ fontSize: 12, color: "#5e6b86" }}>
                {new Date(departureDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskView;
