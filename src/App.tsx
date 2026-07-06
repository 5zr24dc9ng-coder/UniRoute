import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { Analytics } from "@vercel/analytics/react";
import { useWindowWidth } from "./hooks/useWindowWidth";
import { useLiveFx } from "./hooks/useLiveFx";
import { useCloudColumn } from "./hooks/useCloudColumn";
import { useSupabase } from "./hooks/useSupabase";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { SimulationView } from "./components/views/SimulationView";
import { ComparisonView } from "./components/views/ComparisonView";
import { TaskView } from "./components/views/TaskView";
import { VisaView } from "./components/views/VisaView";
import { ShareReportView } from "./components/views/ShareReportView";
import { PremiumUpgradeModal } from "./components/PremiumUpgradeModal";
import type { CityTierKey, CountryId, StudyType, ViewId } from "./types";

interface SimulationCloudState {
  country: CountryId;
  studyType: StudyType;
  duration: number;
  cityTier: CityTierKey;
}

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
  const { fx, setFx, lastUpdated } = useLiveFx();
  const [cityTier, setCityTier] = useState<CityTierKey>("capital");
  const [isPremium, setIsPremium] = useState(false);
  const [purchasedPremium, setPurchasedPremium] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const w = useWindowWidth();
  const isSmall = w < 1024;

  // ログイン中ユーザーのシミュレーション設定をSupabaseと同期する（未ログイン時は何もしない）
  const { user } = useUser();
  const supabase = useSupabase();
  const { cloudValue, loaded, saveCloudValue } = useCloudColumn<SimulationCloudState>("simulation_state");
  const appliedCloudForUserRef = useRef<string | null>(null);

  // ログイン中ユーザーが実際にプレミアムを購入済みか（Stripe Webhook経由でSupabaseのis_premiumが更新される）
  useEffect(() => {
    if (!supabase || !user) {
      setPurchasedPremium(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("users")
      .select("is_premium")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setPurchasedPremium(Boolean(data?.is_premium));
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  // 開発用の?admin=trueフラグ、または実際の購入済みプレミアムのどちらかで機能を解放する
  const premiumUnlocked = isPremium || purchasedPremium;

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

    // プレミアムは「?admin=true」がURLにある間だけ有効（永続化しない）
    // 以前のバージョンではlocalStorageに保存して以後ずっと解放されたままになっていたため、
    // 一度でも?admin=trueを踏んだ端末（自分のブラウザ含む）は毎回プレミアムが見えてしまう不具合があった。
    // 誰でも推測できるURLで永久に無料開放されるのを防ぐため、URLにパラメータが無い読み込みでは必ずfalseに戻す。
    localStorage.removeItem("uniroute_premium");

    // ?admin=true を踏んだら Analytics 計測除外 + このセッションのみプレミアム解放
    if (window.location.search.includes("admin=true")) {
      localStorage.setItem("ignore_analytics", "true");
      setIsPremium(true);
      alert("【設定完了】Analytics除外 + プレミアム機能を解放しました（このURLでアクセスしている間のみ有効）。");
    } else {
      setIsPremium(false);
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

  // ログイン直後、クラウドに保存済みの設定があれば一度だけ復元する
  useEffect(() => {
    if (!loaded || !user) return;
    if (appliedCloudForUserRef.current === user.id) return;
    if (cloudValue) {
      setCountry(cloudValue.country);
      setStudyType(cloudValue.studyType);
      setDuration(cloudValue.duration);
      setCityTier(cloudValue.cityTier);
    }
    appliedCloudForUserRef.current = user.id;
  }, [loaded, cloudValue, user]);

  // 復元が済んだあとは、値が変わるたびにクラウドへ自動保存する（ログイン中のみ）
  useEffect(() => {
    if (!user || appliedCloudForUserRef.current !== user.id) return;
    saveCloudValue({ country, studyType, duration, cityTier });
  }, [country, studyType, duration, cityTier, user]);

  const handleLegalAgree = () => {
    localStorage.setItem("uniroute_legal_agreed", "true");
    setLegalAgreed(true);
  };

  // 家族への共有レポート（?share=1&...）: ログイン不要の閲覧専用ページ。全Hookの呼び出し後に判定する
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("share") === "1") {
    return <ShareReportView />;
  }

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
              setStudyType={setStudyType}
              duration={duration}
              setDuration={setDuration}
              fx={fx}
              setFx={setFx}
              cityTier={cityTier}
              setCityTier={setCityTier}
              lastUpdated={lastUpdated}
              isPremium={premiumUnlocked}
              onUpgradeClick={() => setPremiumModalOpen(true)}
            />
          )}
          {view === "matrix" && <ComparisonView fx={fx} studyType={studyType} />}
          {view === "tasks" && (
            <TaskView
              country={country}
              studyType={studyType}
              isPremium={premiumUnlocked}
              onUpgradeClick={() => setPremiumModalOpen(true)}
            />
          )}
          {view === "visa" && <VisaView isPremium={premiumUnlocked} onUpgradeClick={() => setPremiumModalOpen(true)} />}
        </main>
        <Footer isSmall={isSmall} />
      </div>
      {/* プレミアムアップグレードモーダル（開発中のため ?admin=true のセッションでのみ起動可能） */}
      {isPremium && (
        <button
          onClick={() => setPremiumModalOpen(true)}
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: 9998,
            padding: "6px 12px",
            borderRadius: 8,
            border: "1.5px dashed #a5b4fc",
            background: "#eef2ff",
            color: "#4338ca",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🔧 プレミアムモーダル（開発用プレビュー）
        </button>
      )}
      {premiumModalOpen && (
        <PremiumUpgradeModal onClose={() => setPremiumModalOpen(false)} />
      )}

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
