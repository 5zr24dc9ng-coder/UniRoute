import { COUNTRY_DATA, CITY_TIERS } from "../constants/countries";
import { calcCosts } from "./calculator";
import type { Fx, SimScenario, StudyType } from "../types";

const STUDY_TYPE_LABEL: Record<StudyType, string> = {
  DEGREE: "正規留学",
  EXCHANGE: "交換留学",
  LANGUAGE: "語学留学",
};

function fmt(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

export interface RowDef {
  label: string;
  sub?: string;
  getValue: (s: SimScenario, fx: Fx) => { display: string; raw: number };
  best: "min" | "max" | "none";
}

export const ROWS: RowDef[] = [
  {
    label: "国",
    getValue: (s) => ({ display: `${COUNTRY_DATA[s.country].flag} ${COUNTRY_DATA[s.country].name}`, raw: 0 }),
    best: "none",
  },
  {
    label: "留学タイプ",
    getValue: (s) => ({ display: STUDY_TYPE_LABEL[s.studyType ?? "DEGREE"], raw: 0 }),
    best: "none",
  },
  {
    label: "期間",
    getValue: (s) => ({ display: `${s.duration}ヶ月`, raw: s.duration }),
    best: "none",
  },
  {
    label: "都市ティア",
    getValue: (s) => ({ display: CITY_TIERS[s.cityTier].label, raw: 0 }),
    best: "none",
  },
  {
    label: "授業料・諸費用",
    getValue: (s, fx) => {
      const c = calcCosts(s.country, s.duration, fx, s.cityTier, s.studyType ?? "DEGREE");
      const v = c.items.find((i) => i.key === "tuition")?.value ?? 0;
      return { display: v === 0 ? "無料" : `${c.symbol}${fmt(v)}`, raw: v * c.rate };
    },
    best: "min",
  },
  {
    label: "住居費",
    getValue: (s, fx) => {
      const c = calcCosts(s.country, s.duration, fx, s.cityTier, s.studyType ?? "DEGREE");
      const v = c.items.find((i) => i.key === "housing")?.value ?? 0;
      return { display: `${c.symbol}${fmt(v)}`, raw: v * c.rate };
    },
    best: "min",
  },
  {
    label: "生活費",
    getValue: (s, fx) => {
      const c = calcCosts(s.country, s.duration, fx, s.cityTier, s.studyType ?? "DEGREE");
      const v = c.items.find((i) => i.key === "living")?.value ?? 0;
      return { display: `${c.symbol}${fmt(v)}`, raw: v * c.rate };
    },
    best: "min",
  },
  {
    label: "ビザ・保険料",
    getValue: (s, fx) => {
      const c = calcCosts(s.country, s.duration, fx, s.cityTier, s.studyType ?? "DEGREE");
      const v = c.items.find((i) => i.key === "visa_insurance")?.value ?? 0;
      return { display: `${c.symbol}${fmt(v)}`, raw: v * c.rate };
    },
    best: "min",
  },
  {
    label: "資金証明額",
    sub: "ビザ申請時に必要（口座残高として一時的に用意）",
    getValue: (s, fx) => {
      const c = calcCosts(s.country, s.duration, fx, s.cityTier, s.studyType ?? "DEGREE");
      const v = c.items.find((i) => i.key === "reserve")?.value ?? 0;
      return { display: `${c.symbol}${fmt(v)}`, raw: v * c.rate };
    },
    best: "min",
  },
  {
    label: "推定総額",
    sub: "円換算",
    getValue: (s, fx) => {
      const c = calcCosts(s.country, s.duration, fx, s.cityTier, s.studyType ?? "DEGREE");
      return { display: `¥${fmt(c.totalJPY)}`, raw: c.totalJPY };
    },
    best: "min",
  },
];

export function getBestIndex(row: RowDef, scenarios: SimScenario[], fx: Fx): number {
  if (row.best === "none") return -1;
  const vals = scenarios.map((s) => row.getValue(s, fx).raw);
  if (row.best === "min") return vals.indexOf(Math.min(...vals));
  return vals.indexOf(Math.max(...vals));
}
