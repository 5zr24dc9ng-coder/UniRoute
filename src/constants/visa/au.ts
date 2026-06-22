// src/constants/visa/au.ts
/**
 * Australia Visa (Subclass 500) Requirements & Fees Fact Table
 * Last Updated: 2026-06-19
 */

export const AU_VISA_FEES = {
  BASE_APPLICATION: 2000, // [cite: 254]
  ADDITIONAL_APPLICANT_18_PLUS: 1225, // [cite: 254]
  ADDITIONAL_APPLICANT_UNDER_18: 400, // [cite: 254]
  SUBSEQUENT_TEMPORARY_CHARGE: 700, // [cite: 254]
  OSHC_ESTIMATES_ANNUAL: {
    SINGLE: { MIN: 500, MAX: 700 }, // [cite: 256]
    COUPLE: 5026, // [cite: 256]
    FAMILY: 9972 // [cite: 256]
  },
  BIOMETRICS: 45, // [cite: 256]
  MEDICAL_EXAM: { MIN: 300, MAX: 500 } // [cite: 256]
} as const;

export const AU_FINANCIAL_REQUIREMENTS = {
  BASE_LIVING_COSTS: {
    PRIMARY_APPLICANT: 29710, // [cite: 260]
    PARTNER: 10394, // [cite: 260]
    CHILD: 4449, // [cite: 260]
    SCHOOL_AGE_CHILD_TUITION: 13502 // [cite: 260]
  },
  TRAVEL_COSTS: {
    OUTSIDE_AUSTRALIA_DEFAULT: 2000 // [cite: 266]
  }
} as const;

export const AU_CRITICAL_PATH_LOCKS = {
  PAY_DEPOSIT: ["LETTER_OF_OFFER_RECEIVED"], // [cite: 296]
  PURCHASE_OSHC: ["LETTER_OF_OFFER_RECEIVED"], // [cite: 298]
  ISSUE_COE: ["DEPOSIT_PAID", "OSHC_PURCHASED"], // [cite: 301]
  SUBMIT_VISA: [
    "COE_ISSUED", // [cite: 308]
    "GS_STATEMENT_READY", // [cite: 308]
    "FINANCIAL_PROOF_READY" // [cite: 308]
  ],
  VISA_GRANT: ["MEDICAL_CLEARED", "BIOMETRICS_CLEARED"] // [cite: 314]
} as const;

// 語学留学の月額学費
export const AU_TUITION_LANGUAGE_PER_MONTH = 1400;

// ビザ・保険料（短期/長期）- 境界線: 3ヶ月
export const AU_VISA_AND_INSURANCE = {
  SHORT_TERM: {
    visa: 20,
    insurance: 0,
  },
  LONG_TERM: {
    visa: 2000,
    insurance: 550,
  },
} as const;
