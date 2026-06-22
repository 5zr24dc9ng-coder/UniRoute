import type { CityTier, CityTierKey, Country, CountryId, Fx, ViewId } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// 国別マスターデータ・為替初期値・都市ティア・ナビ定義
// ─────────────────────────────────────────────────────────────────────────────
export const COUNTRY_DATA: Record<CountryId, Country> = {
  UK: {
    id: "UK", name: "イギリス", short: "UK", currency: "GBP", symbol: "£", flag: "🇬🇧",
    accent: "#2f63e6",
    tuitionPerYear: 14500, rentPerMonth: 1150, livingPerMonth: 800, proofOfFunds: 11385,
    proofRule: "28日ルール — ビザ申請日の28日以上前までに、28日連続で残高が £11,385 を下回ってはならない。一度でも下回るとカウントがリセットされる。",
    visaDifficulty: 2, visaLabel: "中",
    approvalRate: 89, processingDays: 15,
    fxExposure: "高", fxLevel: 2,
    cities: { capital: "ロンドン", regional: "マンチェスター / リーズ", rural: "カンタベリー / バース" },
  },
  US: {
    id: "US", name: "アメリカ", short: "USA", currency: "USD", symbol: "$", flag: "🇺🇸",
    accent: "#cf4a4a",
    tuitionPerYear: 22000, rentPerMonth: 1500, livingPerMonth: 1000, proofOfFunds: 18000,
    proofRule: "I-20 財政証明 — DS-160 提出時に1学年分の全額資金を証明する必要がある。",
    visaDifficulty: 3, visaLabel: "高",
    approvalRate: 82, processingDays: 30,
    fxExposure: "高", fxLevel: 2,
    cities: { capital: "ニューヨーク / LA", regional: "ボストン / シカゴ", rural: "カレッジタウン" },
  },
  AU: {
    id: "AU", name: "オーストラリア", short: "AUS", currency: "AUD", symbol: "A$", flag: "🇦🇺",
    accent: "#c2792a",
    tuitionPerYear: 18000, rentPerMonth: 1400, livingPerMonth: 900, proofOfFunds: 24505,
    proofRule: "2026年学生ビザ財政要件 — 申請時に A$29,710 が引き出し可能な状態で口座にある必要がある（凍結不可）。",
    visaDifficulty: 2, visaLabel: "中",
    approvalRate: 85, processingDays: 18,
    fxExposure: "非常に高", fxLevel: 3,
    cities: { capital: "シドニー / メルボルン", regional: "ブリスベン / パース", rural: "タウンズビル / ジーロング" },
  },
  CA: {
    id: "CA", name: "カナダ", short: "CAN", currency: "CAD", symbol: "CA$", flag: "🇨🇦",
    accent: "#1f9268",
    tuitionPerYear: 16000, rentPerMonth: 1250, livingPerMonth: 850, proofOfFunds: 20635,
    proofRule: "就学許可 2026 — CAD 20,635 が必要。比較対象4カ国の中で最低閾値。",
    visaDifficulty: 1, visaLabel: "低",
    approvalRate: 91, processingDays: 10,
    fxExposure: "中", fxLevel: 1,
    cities: { capital: "トロント / バンクーバー", regional: "オタワ / カルガリー", rural: "キングストン / グエルフ" },
  },
};

/** 為替レート初期値（為替自動取得のベースライン） */
export const DEFAULT_FX: Fx = { GBP: 191.5, USD: 150.2, AUD: 98.4, CAD: 111.3 };

/** 都市ティア（物価係数）— 都市別物価シミュレーション */
export const CITY_TIERS: Record<CityTierKey, CityTier> = {
  capital: { label: "首都圏・主要都市", mult: 1.0 },
  regional: { label: "地方都市", mult: 0.74 },
  rural: { label: "大学都市", mult: 0.56 },
};

/** サイドバーナビゲーション定義 */
export const NAV: { id: ViewId; label: string; icon: "sim" | "matrix" | "tasks" | "visa" }[] = [
  { id: "sim", label: "シミュレーション", icon: "sim" },
  { id: "matrix", label: "比較", icon: "matrix" },
  { id: "tasks", label: "タスク管理", icon: "tasks" },
  { id: "visa", label: "ビザ費用", icon: "visa" },
];
