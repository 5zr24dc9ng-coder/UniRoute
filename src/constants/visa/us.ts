/**
 * US Visa (F-1/J-1) Requirements & Fees Fact Table
 * Last Updated: 2026-06-19
 * Source: DHS, DOS, ICE/SEVP, Major Universities
 */

// 1. 公的費用の定数化
export const US_VISA_FEES = {
  MRV: 185,
  SEVIS_F1: 350,
  SEVIS_J1: 220,
  SEVIS_J1_REDUCED: 35, // Au Pair, Camp Counselor, Summer Work Travel
  SEVIS_J1_GOVT: 0,     // Program codes G-1, G-2, G-3, G-7
  VISA_INTEGRITY_FEE: {
    amount: 250,
    status: "enacted_not_collected" // 徴収開始（Federal Register等での告示）で active に切替
  }
} as const;

// 2. 資金証明額の算出・同伴家族加算（定数化例）
export const US_DEPENDENT_ADDITIONS = {
  NYU: {
    SPOUSE: 10800,
    CHILD: 5400
  },
  UT_AUSTIN: {
    SPOUSE: 10900,
    CHILD: 5400
  }
} as const;

// 3. 生活費インデックス（I-20基準）
export const US_LIVING_EXPENSES_INDEX = {
  METRO: {
    MIN: 2800,
    MAX: 3400,
    EXAMPLES: ["NYC", "LA", "Bay Area"]
  },
  LOCAL: {
    MIN: 1400,
    MAX: 1830,
    EXAMPLES: ["Austin", "General State Universities"]
  },
  META: {
    refresh_annually: true, // 年5~10%上昇を見込み年次再取得必須
  }
} as const;

// 4. 書類バリデーション規則
export const US_DOC_VALIDATION_RULES = {
  REQUIRED_CONDITIONS: [
    "ISSUED_WITHIN_6_MONTHS",
    "LIQUID_ASSETS_ONLY",
    "ENGLISH_OR_CERTIFIED_TRANSLATION"
  ],
  WARNING_ASSETS: [ // これらの資産形式が提出された場合は警告フラグを立てる
    "Cryptocurrency",
    "Property Deeds",
    "Auto Deeds",
    "Retirement Funds", // 流動化証明がない限り不可
    "Provident Funds",
    "Paystubs",
    "Tax Returns",
    "Stocks",
    "Mutual Funds"
  ]
} as const;

// 5. 依存関係エンジン（クリティカルパスのハードロック）
// キー（後続タスク）を実行するためには、配列内（絶対的前提）がすべて true である必要がある
export const US_CRITICAL_PATH_LOCKS = {
  ISSUE_I20_OR_DS2019: [
    "ACCEPTED_TO_SEVP_SCHOOL", 
    "FINANCIAL_PROOF_APPROVED"
  ],
  PAY_SEVIS_FEE: [
    "I20_OR_DS2019_RECEIVED" // SEVIS ID ("N"始まり) が必須
  ],
  SUBMIT_DS160: [
    "SEVIS_ID_OBTAINED", 
    "SCHOOL_ADDRESS_CONFIRMED"
  ],
  SCHEDULE_INTERVIEW: [
    "DS160_CONFIRMATION_PAGE", 
    "MRV_FEE_PAID"
  ],
  ATTEND_INTERVIEW: [
    "ORIGINAL_I20", 
    "SEVIS_FEE_RECEIPT", 
    "DS160_CONFIRMATION", 
    "MRV_RECEIPT", 
    "FINANCIAL_PROOF"
  ],
  VISA_ISSUANCE: [
    "INTERVIEW_PASSED" 
    // 将来 Integrity Fee が active になった場合は "INTEGRITY_FEE_PAID" が追加される
  ]
} as const;

// 6. 語学留学の月額学費
export const US_TUITION_LANGUAGE_PER_MONTH = 1600;

// 7. ビザ・保険料（短期/長期） - US は条件なし一律
export const US_VISA_AND_INSURANCE = {
  STANDARD: {
    visa: 535,
    insurance: 0,
  },
} as const;

// 8. 民間医療保険（月額） - US/CAは公的保険がないため民間保険を補正
export const US_PRIVATE_INSURANCE_PER_MONTH = 150;
