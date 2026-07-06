import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { getTasksByCountryAndType, type TaskMaster } from "../../constants/tasks";
import { COUNTRY_DATA } from "../../constants/countries";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { useCloudColumn } from "../../hooks/useCloudColumn";
import { DocumentChecklist } from "../DocumentChecklist";
import { SaveProgressModal } from "../SaveProgressModal";
import type { CountryId, StudyType } from "../../types";

interface TaskCloudState {
  completedIds: string[];
  departureDate: string;
  customTasksMap: Record<string, TaskMaster[]>;
  orderMap: Record<string, Record<string, string[]>>;
}

// ─── 型定義 ───────────────────────────────────────────────────────────────────
interface TaskViewProps {
  country: CountryId;
  studyType: StudyType;
  isPremium: boolean;
  onUpgradeClick: () => void;
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
  isCustom?: boolean;
  editable?: boolean;
  onEditCustom?: () => void;
  onDeleteCustom?: () => void;
  onDragHandleStart?: () => void;
  onDragHandleEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

function TaskCard({
  task,
  isExpanded,
  isCompleted,
  onToggleExpand,
  onToggleComplete,
  isCustom = false,
  editable = false,
  onEditCustom,
  onDeleteCustom,
  onDragHandleStart,
  onDragHandleEnd,
  isDragging = false,
  isDragOver = false,
}: TaskCardProps) {
  return (
    <div
      style={{
        border: `1.5px solid ${isDragOver ? "#2f63e6" : isCompleted ? "#bbf7d0" : "#c8d9fd"}`,
        borderRadius: 12,
        overflow: "hidden",
        background: isCompleted ? "#f0fdf4" : "#eef4ff",
        boxShadow: isDragOver ? "0 0 0 2px rgba(47,99,230,.25)" : "0 1px 2px rgba(20,29,51,.03)",
        opacity: isDragging ? 0.4 : isCompleted ? 0.75 : 1,
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}
      >
        {/* ドラッグハンドル（並び替え用） */}
        {editable && (
          <div
            draggable
            onDragStart={(e) => { e.stopPropagation(); onDragHandleStart?.(); }}
            onDragEnd={() => onDragHandleEnd?.()}
            title="ドラッグして並び替え"
            style={{ cursor: isDragging ? "grabbing" : "grab", color: "#b8c2d9", fontSize: 14, flexShrink: 0, lineHeight: 1, userSelect: "none" }}
          >
            ≡
          </div>
        )}

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
          {isCustom && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 700,
                color: "#8899bb",
                background: "#eef1f7",
                borderRadius: 4,
                padding: "1px 6px",
                letterSpacing: "0.02em",
              }}
            >
              カスタム
            </span>
          )}
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
          {task.links && task.links.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {task.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#2f63e6",
                    textDecoration: "none",
                    width: "fit-content",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  🔗 {link.label} ↗
                </a>
              ))}
            </div>
          )}
          {isCustom && editable && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, paddingTop: 10, borderTop: "1px solid #d4e4fd" }}>
              <button
                onClick={(e) => { e.stopPropagation(); onEditCustom?.(); }}
                style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#2f63e6", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
              >
                編集
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteCustom?.(); }}
                style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#cf4a4a", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
              >
                削除
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 進捗保存バッジ（未ログイン時のみ表示。常時表示・完了数に応じてトーンだけ変化） ───
function SaveProgressBadge({ completedCount, onClick }: { completedCount: number; onClick: () => void }) {
  const isReady = completedCount >= 3;
  return (
    <span
      onClick={onClick}
      title={isReady ? "他の端末でも続きから再開できるようにする" : "この進捗は今の端末にのみ保存されています"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: isReady ? 700 : 500,
        color: isReady ? "#2f63e6" : "#8899bb",
        background: isReady ? "#eaf1ff" : "transparent",
        border: `1px solid ${isReady ? "#c8d9fd" : "#e3e9f5"}`,
        borderRadius: 999,
        padding: "3px 10px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.2s ease",
      }}
    >
      {isReady ? "他の端末でも使えるようにする" : "この端末のみ"}
    </span>
  );
}

// ─── プレミアムロックバナー ───────────────────────────────────────────────────
function PremiumLockBanner({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1.5px dashed #a5b4fc",
        borderRadius: 12,
        padding: "14px 18px",
        background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 16 }}>🔒</span>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>P</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#4338ca" }}>プレミアム機能</span>
        </div>
        <div style={{ fontSize: 12, color: "#6366f1", marginTop: 2 }}>出国日カウントダウン・カスタムタスクの追加はプレミアムプランで利用できます</div>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export function TaskView({ country: defaultCountry, studyType, isPremium, onUpgradeClick }: TaskViewProps) {
  const isSM = useWindowWidth() < 1024;
  const [selectedCountry, setSelectedCountry] = useState<CountryId>(defaultCountry);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "documents">("tasks");

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

  // タスク編集 (premium): カスタムタスク・並び順 は国×留学タイプごとに保存
  const [customTasksMap, setCustomTasksMap] = useState<Record<string, TaskMaster[]>>(() => {
    try { return JSON.parse(localStorage.getItem("uniroute_custom_tasks") ?? "{}"); }
    catch { return {}; }
  });
  const [orderMap, setOrderMap] = useState<Record<string, Record<string, string[]>>>(() => {
    try { return JSON.parse(localStorage.getItem("uniroute_task_order") ?? "{}"); }
    catch { return {}; }
  });

  const [saveProgressModalOpen, setSaveProgressModalOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskTiming, setNewTaskTiming] = useState("");
  const [useCustomTiming, setUseCustomTiming] = useState(false);
  const [newTaskTimingCustom, setNewTaskTimingCustom] = useState("");

  // ドラッグ中のタスクID・グループ・現在ドラッグオーバー中のタスクID（並び替え用）
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedTiming, setDraggedTiming] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  // persistences
  useEffect(() => {
    localStorage.setItem("uniroute_completed_tasks", JSON.stringify([...completedIds]));
  }, [completedIds]);

  useEffect(() => {
    if (departureDate) localStorage.setItem("uniroute_departure_date", departureDate);
  }, [departureDate]);

  useEffect(() => {
    localStorage.setItem("uniroute_custom_tasks", JSON.stringify(customTasksMap));
  }, [customTasksMap]);

  useEffect(() => {
    localStorage.setItem("uniroute_task_order", JSON.stringify(orderMap));
  }, [orderMap]);

  // ログイン中ユーザーのタスク進捗をSupabaseと同期する（未ログイン時は何もしない）
  const { user } = useUser();
  const { cloudValue, loaded, saveCloudValue } = useCloudColumn<TaskCloudState>("task_state");
  const appliedCloudForUserRef = useRef<string | null>(null);

  // ログイン直後、クラウドに保存済みの進捗があれば一度だけ復元する
  useEffect(() => {
    if (!loaded || !user) return;
    if (appliedCloudForUserRef.current === user.id) return;
    if (cloudValue) {
      setCompletedIds(new Set(cloudValue.completedIds));
      setDepartureDate(cloudValue.departureDate);
      setCustomTasksMap(cloudValue.customTasksMap);
      setOrderMap(cloudValue.orderMap);
    }
    appliedCloudForUserRef.current = user.id;
  }, [loaded, cloudValue, user]);

  // 復元が済んだあとは、進捗が変わるたびにクラウドへ自動保存する（ログイン中のみ）
  useEffect(() => {
    if (!user || appliedCloudForUserRef.current !== user.id) return;
    saveCloudValue({
      completedIds: [...completedIds],
      departureDate,
      customTasksMap,
      orderMap,
    });
  }, [completedIds, departureDate, customTasksMap, orderMap, user]);

  const countryName = COUNTRY_DATA[selectedCountry].name;
  const studyTypeLabel = { DEGREE: "正規留学", EXCHANGE: "交換留学", LANGUAGE: "語学留学" }[studyType];
  const masterTasks = getTasksByCountryAndType(selectedCountry, studyType);

  // 現在の国×留学タイプの組み合わせキー
  const comboKey = `${selectedCountry}_${studyType}`;
  const customTasks = customTasksMap[comboKey] ?? [];
  const groupOrder = orderMap[comboKey] ?? {};

  // デフォルトタスク＋カスタムタスクを結合
  const visibleTasks = [...masterTasks, ...customTasks];

  const getMonth = (timing: string): number => {
    const match = timing.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const sortedTasks = [...visibleTasks].sort((a, b) => getMonth(b.timing) - getMonth(a.timing));
  const grouped = sortedTasks.reduce<{ timing: string; tasks: TaskMaster[] }[]>((acc, task) => {
    const existing = acc.find((g) => g.timing === task.timing);
    if (existing) existing.tasks.push(task);
    else acc.push({ timing: task.timing, tasks: [task] });
    return acc;
  }, []);

  // タイミンググループごとに、ユーザーがドラッグで並び替えた順序があれば適用（未知のIDは末尾に自然な順で追加）
  grouped.forEach((g) => {
    const manual = groupOrder[g.timing];
    if (!manual || manual.length === 0) return;
    const manualIndex = new Map(manual.map((id, i) => [id, i]));
    const known = g.tasks.filter((t) => manualIndex.has(t.id)).sort(
      (a, b) => manualIndex.get(a.id)! - manualIndex.get(b.id)!
    );
    const unknown = g.tasks.filter((t) => !manualIndex.has(t.id));
    g.tasks = [...known, ...unknown];
  });

  const existingTimings = grouped.map((g) => g.timing);

  const completedCount = visibleTasks.filter((t) => completedIds.has(t.id)).length;
  const totalCount = visibleTasks.length;
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

  function resetTaskForm() {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskTiming("");
    setNewTaskTimingCustom("");
    setUseCustomTiming(false);
    setEditingTaskId(null);
  }

  function openAddModal() {
    resetTaskForm();
    setAddTaskModalOpen(true);
  }

  function openEditModal(task: TaskMaster) {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description);
    if (existingTimings.includes(task.timing)) {
      setUseCustomTiming(false);
      setNewTaskTiming(task.timing);
      setNewTaskTimingCustom("");
    } else {
      setUseCustomTiming(true);
      setNewTaskTimingCustom(task.timing);
      setNewTaskTiming("");
    }
    setAddTaskModalOpen(true);
  }

  function closeTaskModal() {
    setAddTaskModalOpen(false);
    resetTaskForm();
  }

  function saveCustomTask() {
    const timing = useCustomTiming ? newTaskTimingCustom.trim() : newTaskTiming;
    if (!newTaskTitle.trim() || !timing) return;

    if (editingTaskId) {
      setCustomTasksMap((prev) => ({
        ...prev,
        [comboKey]: (prev[comboKey] ?? []).map((t) =>
          t.id === editingTaskId
            ? { ...t, title: newTaskTitle.trim(), description: newTaskDescription.trim(), timing }
            : t
        ),
      }));
    } else {
      const task: TaskMaster = {
        id: `custom-${Date.now()}`,
        countries: [selectedCountry],
        types: [studyType],
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        timing,
      };
      setCustomTasksMap((prev) => ({
        ...prev,
        [comboKey]: [...(prev[comboKey] ?? []), task],
      }));
    }
    resetTaskForm();
    setAddTaskModalOpen(false);
  }

  function deleteCustomTask(id: string) {
    setCustomTasksMap((prev) => ({
      ...prev,
      [comboKey]: (prev[comboKey] ?? []).filter((t) => t.id !== id),
    }));
  }

  function handleDropOnTask(timing: string, targetTaskId: string) {
    if (!draggedTaskId || draggedTiming !== timing || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      setDraggedTiming(null);
      setDragOverTaskId(null);
      return;
    }
    const group = grouped.find((g) => g.timing === timing);
    if (!group) return;
    const ids = group.tasks.map((t) => t.id);
    const fromIdx = ids.indexOf(draggedTaskId);
    const toIdx = ids.indexOf(targetTaskId);
    if (fromIdx === -1 || toIdx === -1) return;
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, draggedTaskId);
    setOrderMap((prev) => ({
      ...prev,
      [comboKey]: { ...(prev[comboKey] ?? {}), [timing]: ids },
    }));
    setDraggedTaskId(null);
    setDraggedTiming(null);
    setDragOverTaskId(null);
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

        <p style={{ fontSize: 13, color: "#5e6b86", margin: "0 0 16px" }}>
          国別・種類別の動的タスク管理（{totalCount} タスク）
        </p>

        {/* サブタブ：タスク／書類チェックリスト */}
        <div style={{ display: "flex", gap: 4, background: "#eef1f7", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {(["tasks", "documents"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "7px 16px",
                borderRadius: 7,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                color: activeTab === tab ? "#1c2740" : "#8899bb",
                background: activeTab === tab ? "#fff" : "transparent",
                boxShadow: activeTab === tab ? "0 1px 2px rgba(20,29,51,.08)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab === "tasks" ? "タスク" : "書類チェックリスト"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "documents" ? (
        <DocumentChecklist country={selectedCountry} studyType={studyType} isPremium={isPremium} onUpgradeClick={onUpgradeClick} />
      ) : (
      <>
      {/* ─── 進捗バー ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#5e6b86" }}>進捗</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: completedCount === totalCount ? "#16a34a" : "#1c2740" }}>
              {completedCount} / {totalCount} 完了
            </span>
            {!user && (
              <SaveProgressBadge
                completedCount={completedCount}
                onClick={() => setSaveProgressModalOpen(true)}
              />
            )}
          </div>
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
          <PremiumLockBanner onClick={onUpgradeClick} />
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
            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em", flexShrink: 0 }}>P</span>
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

          {/* タスク編集：カスタムタスク追加 */}
          <div>
            <button
              onClick={openAddModal}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1.5px dashed #c8d9fd",
                background: "#fff",
                color: "#2f63e6",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + カスタムタスクを追加
            </button>
          </div>
        </div>
      )}

      {/* 進捗保存の案内モーダル */}
      {saveProgressModalOpen && (
        <SaveProgressModal onClose={() => setSaveProgressModalOpen(false)} />
      )}

      {/* カスタムタスク追加モーダル */}
      {addTaskModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(20,29,51,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={closeTaskModal}
        >
          <div
            style={{ background: "#fff", borderRadius: 14, padding: 28, width: 380, maxWidth: "100%", boxShadow: "0 20px 60px rgba(20,29,51,.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#141d33", margin: "0 0 14px" }}>
              {editingTaskId ? "カスタムタスクを編集" : "カスタムタスクを追加"}
            </h3>

            <p style={{ fontSize: 11, color: "#8899bb", margin: "0 0 6px" }}>タスク名</p>
            <input
              type="text"
              placeholder="例：海外旅行保険の加入"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              autoFocus
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #c8d9fd", fontSize: 14, color: "#1c2740",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12,
              }}
            />

            <p style={{ fontSize: 11, color: "#8899bb", margin: "0 0 6px" }}>メモ（任意）</p>
            <textarea
              placeholder="詳細や参考リンクなど"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1.5px solid #c8d9fd", fontSize: 13, color: "#1c2740",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12, resize: "vertical",
              }}
            />

            <p style={{ fontSize: 11, color: "#8899bb", margin: "0 0 6px" }}>時期</p>
            {!useCustomTiming ? (
              <>
                <select
                  value={newTaskTiming}
                  onChange={(e) => setNewTaskTiming(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    border: "1.5px solid #c8d9fd", fontSize: 13, color: "#1c2740",
                    outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 8,
                    background: "#fff",
                  }}
                >
                  <option value="">選択してください</option>
                  {existingTimings.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={() => setUseCustomTiming(true)}
                  style={{ background: "none", border: "none", color: "#2f63e6", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 12 }}
                >
                  ＋ 新しい時期を入力する
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="例：渡航3ヶ月前"
                  value={newTaskTimingCustom}
                  onChange={(e) => setNewTaskTimingCustom(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8,
                    border: "1.5px solid #c8d9fd", fontSize: 14, color: "#1c2740",
                    outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 4,
                  }}
                />
                <p style={{ fontSize: 10, color: "#8899bb", margin: "0 0 8px" }}>
                  「〇ヶ月前」「〇週間前」の形式で入力すると、カウントダウン表示が正しく機能します
                </p>
                <button
                  onClick={() => { setUseCustomTiming(false); setNewTaskTimingCustom(""); }}
                  style={{ background: "none", border: "none", color: "#2f63e6", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 12 }}
                >
                  ← 既存の時期から選ぶ
                </button>
              </>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                onClick={closeTaskModal}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #e3e9f5", background: "#f8faff", fontSize: 13, cursor: "pointer", color: "#5e6b86" }}
              >
                キャンセル
              </button>
              <button
                onClick={saveCustomTask}
                disabled={!newTaskTitle.trim() || !(useCustomTiming ? newTaskTimingCustom.trim() : newTaskTiming)}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, border: "none",
                  background: newTaskTitle.trim() && (useCustomTiming ? newTaskTimingCustom.trim() : newTaskTiming) ? "#2f63e6" : "#e3e9f5",
                  color: newTaskTitle.trim() && (useCustomTiming ? newTaskTimingCustom.trim() : newTaskTiming) ? "#fff" : "#94a3b8",
                  fontSize: 13, fontWeight: 600,
                  cursor: newTaskTitle.trim() && (useCustomTiming ? newTaskTimingCustom.trim() : newTaskTiming) ? "pointer" : "not-allowed",
                }}
              >
                {editingTaskId ? "保存" : "追加"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── タイムライン ─────────────────────────────────────────── */}
      {visibleTasks.length === 0 ? (
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
                    onDragEnter={() => { if (draggedTaskId && draggedTaskId !== task.id) setDragOverTaskId(task.id); }}
                    onDragOver={(e) => { if (draggedTaskId) e.preventDefault(); }}
                    onDrop={(e) => { e.preventDefault(); handleDropOnTask(timing, task.id); }}
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
                        isCustom={customTasks.some((t) => t.id === task.id)}
                        editable={isPremium}
                        onEditCustom={() => openEditModal(task)}
                        onDeleteCustom={() => deleteCustomTask(task.id)}
                        onDragHandleStart={() => { setDraggedTaskId(task.id); setDraggedTiming(timing); }}
                        onDragHandleEnd={() => { setDraggedTaskId(null); setDraggedTiming(null); setDragOverTaskId(null); }}
                        isDragging={draggedTaskId === task.id}
                        isDragOver={dragOverTaskId === task.id}
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
      </>
      )}
    </div>
  );
}

export default TaskView;
