import { CITY_TIERS, COUNTRY_DATA } from "../constants/countries";
import { UK_VISA_CONSTANTS } from "../constants/visa/uk";
import { US_TUITION_LANGUAGE_PER_MONTH, US_VISA_AND_INSURANCE, US_PRIVATE_INSURANCE_PER_MONTH } from "../constants/visa/us";
import { AU_TUITION_LANGUAGE_PER_MONTH, AU_VISA_AND_INSURANCE } from "../constants/visa/au";
import { CA_TUITION_LANGUAGE_PER_MONTH, CA_VISA_AND_INSURANCE, CA_PRIVATE_INSURANCE_PER_MONTH } from "../constants/visa/ca";
import type { CityTierKey, CostResult, CountryId, Fx, StudyType } from "../types";

export function calcCosts(
  cid: CountryId,
  months: number,
  fx: Fx,
  cityTier: CityTierKey,
  studyType: StudyType = "DEGREE"
): CostResult {
  const c = COUNTRY_DATA[cid];
  const m = CITY_TIERS[cityTier].mult;

  // ────────────────────────────────────────────────────────────────────────────
  // 学費計算: LANGUAGE の場合は月額学費 × 期間、EXCHANGE は 0
  // ────────────────────────────────────────────────────────────────────────────
  let tuition = 0;
  if (studyType === "EXCHANGE") {
    tuition = 0;
  } else if (studyType === "LANGUAGE") {
    // 月額学費に期間（月数）を掛け算（重要: durationMonths との連動）
    switch (cid) {
      case "UK":
        tuition = UK_VISA_CONSTANTS.TUITION_LANGUAGE_PER_MONTH * months;
        break;
      case "US":
        tuition = US_TUITION_LANGUAGE_PER_MONTH * months;
        break;
      case "AU":
        tuition = AU_TUITION_LANGUAGE_PER_MONTH * months;
        break;
      case "CA":
        tuition = CA_TUITION_LANGUAGE_PER_MONTH * months;
        break;
    }
  } else {
    // DEGREE（正規留学）
    tuition = c.tuitionPerYear * (months / 12);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ビザ・保険料: 各国の短期/長期分岐 + 民間保険補正（US/CA）
  // ────────────────────────────────────────────────────────────────────────────
  let visaInsuranceCost = 0;

  if (cid === "UK") {
    // UK: 6ヶ月が境界線
    const isLongTerm = months > 6;
    const rates = isLongTerm
      ? UK_VISA_CONSTANTS.VISA_AND_INSURANCE.LONG_TERM
      : UK_VISA_CONSTANTS.VISA_AND_INSURANCE.SHORT_TERM;
    visaInsuranceCost = rates.visa + rates.insurance;
  } else if (cid === "US") {
    // US: 条件なし一律
    const baseRate = US_VISA_AND_INSURANCE.STANDARD;
    visaInsuranceCost = baseRate.visa + baseRate.insurance;
    // 民間医療保険を月額加算（公的保険がないため）
    visaInsuranceCost += US_PRIVATE_INSURANCE_PER_MONTH * months;
  } else if (cid === "AU") {
    // AU: 3ヶ月が境界線
    const isLongTerm = months > 3;
    const rates = isLongTerm
      ? AU_VISA_AND_INSURANCE.LONG_TERM
      : AU_VISA_AND_INSURANCE.SHORT_TERM;
    visaInsuranceCost = rates.visa + rates.insurance;
  } else if (cid === "CA") {
    // CA: 6ヶ月が境界線
    const isLongTerm = months > 6;
    const rates = isLongTerm
      ? CA_VISA_AND_INSURANCE.LONG_TERM
      : CA_VISA_AND_INSURANCE.SHORT_TERM;
    visaInsuranceCost = rates.visa + rates.insurance;
    // 民間医療保険を月額加算（公的保険がないため）
    visaInsuranceCost += CA_PRIVATE_INSURANCE_PER_MONTH * months;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 資金証明額（Proof of Funds）の動的計算
  // UK のみ都市ティアと最大9ヶ月ルール対応、他国は固定値
  // ────────────────────────────────────────────────────────────────────────────
  let reserve = c.proofOfFunds;

  if (cid === "UK") {
    // UK: 都市ティアに基づいて月額生活費を決定
    const isLondon = cityTier === "capital";
    const monthlyLivingCost = isLondon
      ? UK_VISA_CONSTANTS.PROOF_OF_FUNDS.LIVING_COST_LONDON_PER_MONTH
      : UK_VISA_CONSTANTS.PROOF_OF_FUNDS.LIVING_COST_OUTSIDE_LONDON_PER_MONTH;

    // UK 最大9ヶ月ルール: 滞在月数が9ヶ月を超える場合は 9 ヶ月で上限
    const proofMonths = Math.min(months, 9);
    reserve = monthlyLivingCost * proofMonths;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 既存ロジック: 住居費、生活費、総額計算
  // ────────────────────────────────────────────────────────────────────────────
  const housing = c.rentPerMonth * months * m;
  const living = c.livingPerMonth * months * m;
  const total = tuition + housing + living + reserve + visaInsuranceCost;
  const rate = fx[c.currency];

  // ────────────────────────────────────────────────────────────────────────────
  // 送金対象額（Wise/銀行送金の手数料計算ベース）
  // 授業料 + 住居費（滞在デポジット）
  // ────────────────────────────────────────────────────────────────────────────
  const remittanceBase = tuition + housing;

  return {
    total,
    totalJPY: Math.round(total * rate),
    rate,
    symbol: c.symbol,
    currency: c.currency,
    remittanceBase,
    items: [
      { key: "reserve", label: "残高証明積立", value: reserve, pct: reserve / total, color: "#2f63e6" },
      { key: "tuition", label: "授業料・諸費用", value: tuition, pct: tuition / total, color: "#5b8af5" },
      { key: "housing", label: "住居費", value: housing, pct: housing / total, color: "#94b3fa" },
      { key: "visa_insurance", label: "ビザ・保険料", value: visaInsuranceCost, pct: visaInsuranceCost / total, color: "#c8d9fd" },
      { key: "living", label: "生活費", value: living, pct: living / total, color: "#d5e5ff" },
    ],
  };
}
