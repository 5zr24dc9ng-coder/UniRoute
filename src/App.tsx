import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { useWindowWidth } from "./hooks/useWindowWidth";
import { useLiveFx } from "./hooks/useLiveFx";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { SimulationView } from "./components/views/SimulationView";
import { ComparisonView } from "./components/views/ComparisonView";
import { TaskView } from "./components/views/TaskView";
import { VisaView } from "./components/views/VisaView";
import type { CityTierKey, CountryId, StudyType, ViewId } from "./types";

function LegalModal({ onAgree }: { onAgree: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 29, 51, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 40,
          maxWidth: 600,
          maxHeight: 700,
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(20,29,51,.3)",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#141d33", marginTop: 0, marginBottom: 16 }}>
          重要なご確認
        </h2>
        <p style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.8, margin: "0 0 16px" }}>
          <strong>UniRoute</strong>（以下「本サービス」）をご利用いただきありがとうございます。本サービスで提供する算出金額およびタスク要件は、2026年現在の各国の移民法・教育機関の基準に基づく目安です。
        </p>
        <p style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.8, margin: "0 0 16px" }}>
          実際のビザ審査基準や為替レート（銀行手数料含む）は予告なく変動する可能性があり、本サービスはビザの発給や正確な総費用を法的に保証するものではありません。
        </p>
        <p style={{ fontSize: 13, color: "#1c2740", lineHeight: 1.8, margin: "0 0 24px" }}>
          最新情報は必ず各国の大使館または移民局の公式ウェブサイトでご確認ください。本サービスを利用することで、上記の免責事項に同意したものとみなされます。
        </p>
        <button
          onClick={onAgree}
          style={{
            width: "100%",
            padding: "12px 24px",
            borderRadius: 8,
            background: "#2f63e6",
            color: "#fff",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(47,99,230,.3)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1f49b8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#2f63e6")}
        >
          同意してサービスを利用する
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [legalAgreed, setLegalAgreed] = useState(true);
  const [view, setView] = useState<ViewId>("sim");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [country, setCountry] = useState<CountryId>("UK");
  const [studyType, setStudyType] = useState<StudyType>("DEGREE");
  const [duration, setDuration] = useState(10);
  const { fx, setFx } = useLiveFx();
  const [cityTier, setCityTier] = useState<CityTierKey>("capital");
  const w = useWindowWidth();
  const isSmall = w < 1024;

  // 初期化時 localStorage をチェック
  useEffect(() => {
    const agreed = localStorage.getItem("uniroute_legal_agreed");
    if (agreed === "true") {
      setLegalAgreed(true);
    } else {
      setLegalAgreed(false);
    }

    // 他の状態を復元
    const savedCountry = localStorage.getItem("uniroute_country") as CountryId | null;
    const savedStudyType = localStorage.getItem("uniroute_studyType") as StudyType | null;
    const savedDuration = localStorage.getItem("uniroute_duration");
    const savedCityTier = localStorage.getItem("uniroute_cityTier") as CityTierKey | null;

    if (savedCountry) setCountry(savedCountry);
    if (savedStudyType) setStudyType(savedStudyType);
    if (savedDuration) setDuration(parseInt(savedDuration, 10));
    if (savedCityTier) setCityTier(savedCityTier);

    // ?admin=true を踏んだら Analytics 計測を除外
    if (window.location.search.includes("admin=true")) {
      localStorage.setItem("ignore_analytics", "true");
      alert("【設定完了】この端末からのAnalytics計測を除外しました。");
    }
  }, []);

  // 状態の変更を自動保存
  useEffect(() => {
    localStorage.setItem("uniroute_country", country);
  }, [country]);

  useEffect(() => {
    localStorage.setItem("uniroute_studyType", studyType);
  }, [studyType]);

  useEffect(() => {
    localStorage.setItem("uniroute_duration", duration.toString());
  }, [duration]);

  useEffect(() => {
    localStorage.setItem("uniroute_cityTier", cityTier);
  }, [cityTier]);

  const handleLegalAgree = () => {
    localStorage.setItem("uniroute_legal_agreed", "true");
    setLegalAgreed(true);
  };

  if (!legalAgreed) {
    return <LegalModal onAgree={handleLegalAgree} />;
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', background: "#f8faff" }}
    >
      <Sidebar
        view={view}
        setView={setView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden relative xl:pl-64">
        <Header
          fx={fx}
          onMenuClick={() => setSidebarOpen(true)}
          isSmall={isSmall}
          studyType={studyType}
          setStudyType={setStudyType}
        />
        <main style={{ flex: 1, overflow: "auto", background: "#f8faff" }}>
          {view === "sim" && (
            <SimulationView
              country={country}
              setCountry={setCountry}
              studyType={studyType}
              duration={duration}
              setDuration={setDuration}
              fx={fx}
              setFx={setFx}
              cityTier={cityTier}
              setCityTier={setCityTier}
            />
          )}
          {view === "matrix" && <ComparisonView fx={fx} studyType={studyType} />}
          {view === "tasks" && <TaskView country={country} studyType={studyType} />}
          {view === "visa" && <VisaView />}
        </main>
        <Footer isSmall={isSmall} />
      </div>
      {/* Vercel Analytics の計測タグ — ignore_analytics が true なら除外 */}
      <Analytics
        beforeSend={(event) => {
          if (typeof window !== "undefined" && localStorage.getItem("ignore_analytics") === "true") {
            return null;
          }
          return event;
        }}
      />
    </div>
  );
}
