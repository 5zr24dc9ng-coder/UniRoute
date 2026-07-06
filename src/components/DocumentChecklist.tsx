import { useEffect, useState } from "react";
import {
  DOCUMENT_CATEGORY_ORDER,
  getDocumentsByCountryAndType,
  type DocumentMaster,
} from "../constants/documents";
import type { CountryId, StudyType } from "../types";

interface DocumentChecklistProps {
  country: CountryId;
  studyType: StudyType;
  isPremium: boolean;
  onUpgradeClick: () => void;
}

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
        <div style={{ fontSize: 12, color: "#6366f1", marginTop: 2 }}>書類チェックリストはプレミアムプランで利用できます</div>
      </div>
    </div>
  );
}

function DocumentRow({
  doc,
  isCompleted,
  isExpanded,
  onToggleComplete,
  onToggleExpand,
}: {
  doc: DocumentMaster;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggleComplete: () => void;
  onToggleExpand: () => void;
}) {
  return (
    <div
      style={{
        border: `1.5px solid ${isCompleted ? "#bbf7d0" : "#e3e9f5"}`,
        borderRadius: 12,
        overflow: "hidden",
        background: isCompleted ? "#f0fdf4" : "#fff",
        marginBottom: 8,
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
          style={{
            width: 20, height: 20, borderRadius: 6,
            border: `2px solid ${isCompleted ? "#16a34a" : "#c8d9fd"}`,
            background: isCompleted ? "#16a34a" : "transparent",
            cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {isCompleted && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <div onClick={onToggleExpand} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
          <span
            style={{
              fontSize: 14, fontWeight: 600,
              color: isCompleted ? "#15803d" : "#1c2740",
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {doc.nameJa}
          </span>
          <span style={{ fontSize: 12, color: "#8899bb", marginLeft: 8 }}>{doc.nameEn}</span>
        </div>
        <div onClick={onToggleExpand} style={{ color: "#c4cdd8", fontSize: 11, flexShrink: 0, cursor: "pointer" }}>
          {isExpanded ? "▲" : "▼"}
        </div>
      </div>
      {isExpanded && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f4ff", background: "rgba(248,250,255,0.7)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <p style={{ fontSize: 11, color: "#8899bb", letterSpacing: "0.04em", margin: "0 0 3px" }}>取得元</p>
            <p style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.6, margin: 0 }}>{doc.source}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#c2792a", letterSpacing: "0.04em", margin: "0 0 3px" }}>注意点</p>
            <p style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.7, margin: 0 }}>{doc.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentChecklist({ country, studyType, isPremium, onUpgradeClick }: DocumentChecklistProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("uniroute_completed_documents");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("uniroute_completed_documents", JSON.stringify([...completedIds]));
  }, [completedIds]);

  function toggleComplete(id: string) {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const docs = getDocumentsByCountryAndType(country, studyType);
  const grouped = DOCUMENT_CATEGORY_ORDER
    .map((category) => ({ category, docs: docs.filter((d) => d.category === category) }))
    .filter((g) => g.docs.length > 0);

  const totalCount = docs.length;
  const completedCount = docs.filter((d) => completedIds.has(d.id)).length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!isPremium) {
    return <PremiumLockBanner onClick={onUpgradeClick} />;
  }

  return (
    <div>
      {/* 進捗バー */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#5e6b86" }}>準備の進捗</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: completedCount === totalCount && totalCount > 0 ? "#16a34a" : "#1c2740" }}>
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

      {grouped.length === 0 ? (
        <p style={{ color: "#8899bb", fontSize: 14 }}>該当する書類がありません</p>
      ) : (
        grouped.map(({ category, docs: categoryDocs }) => (
          <div key={category} style={{ marginBottom: 22 }}>
            <p
              style={{
                fontSize: 11, fontFamily: '"IBM Plex Mono", monospace',
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#8899bb", margin: "0 0 10px",
              }}
            >
              {category}
            </p>
            {categoryDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                isCompleted={completedIds.has(doc.id)}
                isExpanded={expandedId === doc.id}
                onToggleComplete={() => toggleComplete(doc.id)}
                onToggleExpand={() => setExpandedId((prev) => (prev === doc.id ? null : doc.id))}
              />
            ))}
          </div>
        ))
      )}

      <p style={{ fontSize: 11, color: "#8899bb", margin: "8px 0 0", lineHeight: 1.7 }}>
        ※ 必要書類は大学・領事館・年度によって変わることがあります。最終的な要件は必ず出願先機関や大使館の公式案内でご確認ください。
      </p>
    </div>
  );
}

export default DocumentChecklist;
