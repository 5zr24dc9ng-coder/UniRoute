// ─────────────────────────────────────────────────────────────────────────────
// ドメイン型定義（Claude Design 版の単一の真実）
// ─────────────────────────────────────────────────────────────────────────────

export type CountryId = "UK" | "US" | "AU" | "CA";
export type CurrencyCode = "GBP" | "USD" | "AUD" | "CAD";
export type CityTierKey = "capital" | "regional" | "rural";
export type ViewId = "sim" | "matrix" | "tasks" | "visa";
export type StudyType = "DEGREE" | "EXCHANGE" | "LANGUAGE";
/** ビザ対象国 */
export type CountryCodeVisa = "US" | "CA" | "AU" | "UK";
/** ビザ費用フックの主要書類通貨 */
export type DocCurrency = Extract<CurrencyCode, "USD" | "CAD" | "AUD" | "GBP">;
export type TaskStatus = "done" | "active" | "locked" | "blocked";

/** 為替レート（1通貨あたりの円） */
export type Fx = Record<CurrencyCode, number>;

/** 国別マスターデータ */
export interface Country {
  id: CountryId;
  name: string;
  short: string;
  currency: CurrencyCode;
  symbol: string;
  flag: string;
  accent: string;
  tuitionPerYear: number;
  rentPerMonth: number;
  livingPerMonth: number;
  proofOfFunds: number;
  proofRule: string;
  visaDifficulty: number;
  visaLabel: string;
  approvalRate: number;
  processingDays: number;
  fxExposure: string;
  fxLevel: number;
  cities: Record<CityTierKey, string>;
}

/** 都市ティア（物価係数） */
export interface CityTier {
  label: string;
  mult: number;
}

/** コスト内訳の 1 項目 */
export interface CostItem {
  key: string;
  label: string;
  value: number;
  pct: number;
  color: string;
}

/** calcCosts の戻り値 */
export interface CostResult {
  total: number;
  totalJPY: number;
  rate: number;
  symbol: string;
  currency: CurrencyCode;
  items: CostItem[];
  remittanceBase: number;
}

/** クリティカルパス上のタスク */
export interface Task {
  id: number;
  group: string;
  label: string;
  due: string;
  deps: number[];
  lock: boolean;
  status: TaskStatus;
  note: string;
  warning?: string;
}
