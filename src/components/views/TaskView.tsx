import { useState } from "react";
import { getTasksByCountryAndType, type TaskMaster } from "../../constants/tasks";
import { COUNTRY_DATA } from "../../constants/countries";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import type { CountryId, StudyType } from "../../types";

interface TaskViewProps {
  country: CountryId;
  studyType: StudyType;
}

interface MasterTaskCardProps {
  task: TaskMaster;
  isSelected: boolean;
  onSelect: () => void;
}

function MasterTaskCard({ task, isSelected, onSelect }: MasterTaskCardProps) {
  return (
    <div
      style={{
        border: "1.5px solid #c8d9fd",
        borderRadius: 12,
        overflow: "hidden",
        background: "#eef4ff",
        boxShadow: "0 1px 2px rgba(20,29,51,.03)",
      }}
    >
      {/* Main row */}
      <div onClick={onSelect} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1c2740" }}>
              {task.title}
            </span>
          </div>
          {task.dependsOn && task.dependsOn.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "#8899bb", fontFamily: '"IBM Plex Mono", monospace' }}>
                → 依存: {task.dependsOn.join(", ")}
              </span>
            </div>
          )}
        </div>
        <div style={{ color: "#c4cdd8", fontSize: 11, flexShrink: 0 }}>{isSelected ? "▲" : "▼"}</div>
      </div>

      {/* Expanded detail */}
      {isSelected && (
        <div style={{ padding: "14px 16px", borderTop: "1px solid #d4e4fd", background: "rgba(248,250,255,0.7)" }}>
          <p style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.7, margin: 0 }}>{task.description}</p>
        </div>
      )}
    </div>
  );
}

export function TaskView({ country: defaultCountry, studyType }: TaskViewProps) {
  const isSM = useWindowWidth() < 1024;
  const [selectedCountry, setSelectedCountry] = useState<CountryId>(defaultCountry);
  const countryName = COUNTRY_DATA[selectedCountry].name;
  const studyTypeLabel = { DEGREE: "正規留学", EXCHANGE: "交換留学", LANGUAGE: "語学留学" }[studyType];

  const masterTasks = getTasksByCountryAndType(selectedCountry, studyType);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

  // timing から月数を抽出し、降順ソート（大きい月が上）
  const getMonth = (timing: string): number => {
    const match = timing.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const sortedTasks = [...masterTasks].sort((a, b) => getMonth(b.timing) - getMonth(a.timing));

  // timing をキーにグループ化
  const grouped = sortedTasks.reduce<{ timing: string; tasks: TaskMaster[] }[]>((acc, task) => {
    const existing = acc.find((g) => g.timing === task.timing);
    if (existing) {
      existing.tasks.push(task);
    } else {
      acc.push({ timing: task.timing, tasks: [task] });
    }
    return acc;
  }, []);

  const COUNTRIES: CountryId[] = ["US", "UK", "AU", "CA"];

  return (
    <div style={{ padding: isSM ? "20px 16px" : "36px 40px", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
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

        {/* Country Selection Tabs */}
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
          国別・種類別の動的タスク管理（{masterTasks.length} タスク）
        </p>
      </div>

      {/* Timeline */}
      {masterTasks.length === 0 ? (
        <p style={{ color: "#8899bb", fontSize: 14, marginTop: 32 }}>該当するタスクがありません</p>
      ) : (
        <div style={{ position: "relative" }}>
          {/* Continuous vertical line */}
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

          {grouped.map(({ timing, tasks }, gi) => (
            <div key={timing} style={{ marginTop: gi > 0 ? 28 : 0 }}>
              {/* Period badge row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                {/* Dot on the line */}
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
                {/* Badge */}
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
              </div>

              {/* Task cards */}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}
                >
                  {/* Node on the line */}
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#fff",
                      border: "2px solid #c8d9fd",
                      flexShrink: 0,
                      marginTop: 14,
                      position: "relative",
                      zIndex: 1,
                    }}
                  />
                  {/* Card */}
                  <div style={{ flex: 1 }}>
                    <MasterTaskCard
                      task={task}
                      isSelected={selectedMasterId === task.id}
                      onSelect={() => setSelectedMasterId((prev) => (prev === task.id ? null : task.id))}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Terminal node — 出国でタイムラインを締める */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 28 }}>
            {/* Goal dot on the line */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#1f9268",
                border: "3px solid #f8faff",
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
              }}
            />
            {/* Goal badge */}
            <span
              style={{
                background: "#1f9268",
                color: "#fff",
                borderRadius: 6,
                padding: "5px 14px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.04em",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🛫 出国
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskView;
