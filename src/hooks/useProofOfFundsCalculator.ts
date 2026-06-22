import { useMemo } from "react";
import { useLiveFx } from "./useLiveFx";
import { US_LIVING_EXPENSES_INDEX, US_DEPENDENT_ADDITIONS } from "../constants/visa/us";
import { CA_FINANCIAL_REQUIREMENTS } from "../constants/visa/ca";
import { AU_FINANCIAL_REQUIREMENTS } from "../constants/visa/au";
import { UK_VISA_CONSTANTS } from "../constants/visa/uk";
import type { CountryCodeVisa, DocCurrency } from "../types";

export type StudyType = "DEGREE" | "EXCHANGE" | "LANGUAGE";

export interface DependentsInput {
  spouse: 0 | 1;
  children: number;
}

export interface ProofOfFundsResult {
  requiredFundsInDocCurrency: number;
  requiredFundsJpy: number;
  docCurrency: DocCurrency;
  isLive: boolean;
  error: string | null;
}

const PRIMARY_CURRENCY: Record<CountryCodeVisa, DocCurrency> = {
  US: "USD",
  CA: "CAD",
  AU: "AUD",
  UK: "GBP",
};

export function useProofOfFundsCalculator(
  countryCode: CountryCodeVisa,
  studyType: StudyType,
  durationMonths: number,
  dependents: DependentsInput
): ProofOfFundsResult {
  const { fx, isLive, error } = useLiveFx();
  const { spouse, children } = dependents;

  return useMemo<ProofOfFundsResult>(() => {
    const docCurrency = PRIMARY_CURRENCY[countryCode];
    let requiredFundsInDocCurrency = 0;

    switch (countryCode) {
      case "US": {
        // DEGREE は都市圏生活費×12ヶ月、EXCHANGE/LANGUAGE は地方生活費×期間
        const monthlyLiving =
          studyType === "DEGREE"
            ? US_LIVING_EXPENSES_INDEX.METRO.MIN
            : US_LIVING_EXPENSES_INDEX.LOCAL.MIN;
        const months = studyType === "DEGREE" ? 12 : durationMonths;
        requiredFundsInDocCurrency =
          monthlyLiving * months +
          spouse * US_DEPENDENT_ADDITIONS.NYU.SPOUSE +
          children * US_DEPENDENT_ADDITIONS.NYU.CHILD;
        break;
      }
      case "CA": {
        // 連邦要件：1〜3名はテーブル参照、4名以上は ADDITIONAL_PER_PERSON で加算
        const totalPeople = 1 + spouse + children;
        const req = CA_FINANCIAL_REQUIREMENTS.FEDERAL;
        const capped = Math.min(totalPeople, 3) as 1 | 2 | 3;
        const extra = Math.max(totalPeople - 3, 0);
        requiredFundsInDocCurrency = req[capped] + extra * req.ADDITIONAL_PER_PERSON;
        break;
      }
      case "AU": {
        // 年間生活費を期間比率でスケール＋渡航費（固定）
        const base = AU_FINANCIAL_REQUIREMENTS.BASE_LIVING_COSTS;
        const years = durationMonths / 12;
        requiredFundsInDocCurrency =
          Math.round(base.PRIMARY_APPLICANT * years) +
          Math.round(base.PARTNER * years) * spouse +
          Math.round(base.CHILD * years) * children +
          AU_FINANCIAL_REQUIREMENTS.TRAVEL_COSTS.OUTSIDE_AUSTRALIA_DEFAULT;
        break;
      }
      case "UK": {
        // ロンドン内の生活費要件（月額×期間）
        const monthlyLiving = UK_VISA_CONSTANTS.PROOF_OF_FUNDS.LIVING_COST_LONDON_PER_MONTH;
        requiredFundsInDocCurrency = monthlyLiving * durationMonths;
        break;
      }
    }

    const requiredFundsJpy = Math.round(requiredFundsInDocCurrency * fx[docCurrency]);
    return { requiredFundsInDocCurrency, requiredFundsJpy, docCurrency, isLive, error };
  }, [countryCode, studyType, durationMonths, spouse, children, fx, isLive, error]);
}
