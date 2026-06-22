import { useMemo } from "react";
import { useLiveFx } from "./useLiveFx";
import { US_VISA_FEES } from "../constants/visa/us";
import { CA_VISA_FEES } from "../constants/visa/ca";
import { AU_VISA_FEES } from "../constants/visa/au";
import { UK_VISA_CONSTANTS } from '../constants/visa/uk';
import type { CountryCodeVisa, DocCurrency } from "../types";

// ─── 公開型 ────────────────────────────────────────────────────────────────────

export type { CountryCodeVisa, DocCurrency };

/** 国ごとに有効なビザ区分のみを受け付ける判別共用体 */
export type VisaInput =
  | { countryCode: "US"; visaType: "F1" | "J1" }
  | { countryCode: "CA"; visaType: "STUDY_PERMIT" }
  | { countryCode: "AU"; visaType: "SUBCLASS_500" }
  | { countryCode: "UK"; visaType: "STUDENT" }; // 

export interface BreakdownItem {
  label: string;
  /** 現地通貨建ての金額 */
  amountInDocCurrency: number;
  /** アイテム固有の通貨（指定医費など日本円建ての項目は "JPY"） */
  docCurrency: DocCurrency | "JPY";
  /** JPY換算額 */
  amountJpy: number;
}

export interface VisaCostResult {
  /** 日本円の公的費用総額 */
  totalCostJpy: number;
  /** 主要書類通貨（CAD / USD / AUD）での公的費用合計（JPY建て項目を除く） */
  totalCostInDocCurrency: number;
  docCurrency: DocCurrency;
  /** useLiveFx から取得したライブレートが反映済みか */
  isLive: boolean;
  breakdown: BreakdownItem[];
}

// ─── 定数 ──────────────────────────────────────────────────────────────────────

const PRIMARY_CURRENCY: Record<CountryCodeVisa, DocCurrency> = {
  US: "USD",
  CA: "CAD",
  AU: "AUD",
  UK: "GBP",
};

// ─── フック本体 ─────────────────────────────────────────────────────────────────

export function useVisaCostCalculator(input: VisaInput): VisaCostResult {
  const { fx, isLive } = useLiveFx();

  return useMemo<VisaCostResult>(() => {
    const { countryCode, visaType } = input;
    const docCurrency = PRIMARY_CURRENCY[countryCode];
    const breakdown: BreakdownItem[] = [];

    /**
     * breakdown に費用を追加する。
     * currency が "JPY" の場合は amount をそのまま JPY 換算額として扱い、
     * docCurrency の場合は fx レートで換算する。
     */
    function add(label: string, amount: number, currency: DocCurrency | "JPY"): void {
      const amountJpy =
        currency === "JPY" ? amount : Math.round(amount * fx[currency]);
      breakdown.push({ label, amountInDocCurrency: amount, docCurrency: currency, amountJpy });
    }

    switch (countryCode) {
      case "US": {
        add("MRV申請手数料", US_VISA_FEES.MRV, "USD");
        if (visaType === "F1") {
          add("SEVIS I-901費（F-1）", US_VISA_FEES.SEVIS_F1, "USD");
        } else {
          // J1
          add("SEVIS I-901費（J-1）", US_VISA_FEES.SEVIS_J1, "USD");
        }
        // VISA_INTEGRITY_FEE は status === "enacted_not_collected" のため合計から除外
        break;
      }
      case "CA": {
        add("留学許可申請費", CA_VISA_FEES.FEE_SP_BASE, "CAD");
        add("バイオメトリクス費", CA_VISA_FEES.FEE_BIO_INDIVIDUAL, "CAD");
        add("eTA", CA_VISA_FEES.FEE_ETA, "CAD");
        // 日本国内の指定医診察費は JPY 建てのため currency を "JPY" で登録
        add("指定医診察費（日本国内）", CA_VISA_FEES.FEE_MED_EXAM_JP_ADULT, "JPY");
        break;
      }
      case "AU": {
        add("ビザ申請費（Subclass 500）", AU_VISA_FEES.BASE_APPLICATION, "AUD");
        add("バイオメトリクス費", AU_VISA_FEES.BIOMETRICS, "AUD");
        add("OSHC 年間保険料（目安最低額）", AU_VISA_FEES.OSHC_ESTIMATES_ANNUAL.SINGLE.MIN, "AUD");
        add("指定医診察費（目安最低額）", AU_VISA_FEES.MEDICAL_EXAM.MIN, "AUD");
        break;
      }
      case "UK": {
        if (input.visaType === "STUDENT") {
          add("ビザ申請料", UK_VISA_CONSTANTS.FEES.STUDENT_VISA_OUTSIDE_UK, "GBP");
          add("IHS（移民健康課徴金）", UK_VISA_CONSTANTS.FEES.IHS_STUDENT_PER_YEAR, "GBP");
          add("バイオメトリクス登録料", UK_VISA_CONSTANTS.FEES.BIOMETRICS, "GBP");
        }
        break;
      }
    }

    const totalCostJpy = breakdown.reduce((sum, item) => sum + item.amountJpy, 0);

    // totalCostInDocCurrency は主要書類通貨（CAD / USD / AUD）のみを集計
    // JPY 建て項目（CA の指定医費等）は totalCostJpy にのみ反映される
    const totalCostInDocCurrency = breakdown
      .filter((item) => item.docCurrency === docCurrency)
      .reduce((sum, item) => sum + item.amountInDocCurrency, 0);

    return { totalCostJpy, totalCostInDocCurrency, docCurrency, isLive, breakdown };
  }, [input, fx, isLive]);
}
