// src/constants/visa/ca.ts
/**
 * Canada Visa (Study Permit) Requirements & Fees Fact Table
 * Last Updated: 2026-06-19
 */

export const CA_VISA_FEES = {
  FEE_SP_BASE: 150, // [cite: 129]
  FEE_BIO_INDIVIDUAL: 85, // [cite: 129]
  FEE_BIO_FAMILY: 170, // [cite: 130]
  FEE_ETA: 7, // [cite: 130]
  FEE_RESTORE_STATUS: 396.25, // [cite: 130]
  FEE_MED_EXAM_JP_ADULT: 30000, // [cite: 130]
} as const;

export const CA_FINANCIAL_REQUIREMENTS = {
  FEDERAL: {
    1: 22895, // [cite: 134]
    2: 28502, // [cite: 134]
    3: 35040, // [cite: 134]
    ADDITIONAL_PER_PERSON: 6170, // [cite: 134]
  },
  QUEBEC: {
    1: 24617, // [cite: 137]
    2: 34814, // [cite: 138]
    3: 42638, // [cite: 138]
    ADDITIONAL_PER_PERSON: 5254, // [cite: 138]
  }
} as const;

export const CA_LIVING_EXPENSES_INDEX = {
  TIER_1: { MIN: 3500, MAX: 4800, EXAMPLES: ["バンクーバー", "トロント"] }, // [cite: 148]
  TIER_2: { MIN: 2800, MAX: 3500, EXAMPLES: ["オタワ", "ハリファックス", "カルガリー"] }, // [cite: 148]
  TIER_3: { MIN: 2300, MAX: 2800, EXAMPLES: ["モントリオール", "エドモントン", "ウィニペグ"] } // [cite: 148]
} as const;

export const CA_CRITICAL_PATH_LOCKS = {
  RECEIVE_LOA: ["APPLICATION_AND_DEPOSIT_COMPLETED"], // [cite: 159]
  APPLY_PAL_OR_CAQ: ["LOA_RECEIVED"], // [cite: 159, 160]
  SUBMIT_VISA_ONLINE: [
    "LOA_RECEIVED", // [cite: 160]
    "FUNDS_PROOF_OBTAINED", // [cite: 160]
    "PAL_CAQ_OR_EXEMPT_VERIFIED" // [cite: 160]
  ],
  BIOMETRICS_REGISTRATION: ["BIL_RECEIVED"], // [cite: 161]
  VISA_ISSUANCE: ["BIOMETRICS_COMPLETED", "BACKGROUND_CHECK_PASSED"] // [cite: 161]
} as const;

// 語学留学の月額学費
export const CA_TUITION_LANGUAGE_PER_MONTH = 1500;

// ビザ・保険料（短期/長期）- 境界線: 6ヶ月
export const CA_VISA_AND_INSURANCE = {
  SHORT_TERM: {
    visa: 7,
    insurance: 0,
  },
  LONG_TERM: {
    visa: 150,
    insurance: 0,
  },
} as const;

// 民間医療保険（月額） - CA は公的保険がないため民間保険を補正
export const CA_PRIVATE_INSURANCE_PER_MONTH = 150;
