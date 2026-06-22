export const UK_VISA_CONSTANTS = {
  CURRENCY: 'GBP',

  // 1. 支払って消えるお金（Sunk Cost）
  FEES: {
    // 学生ビザ（Student Route）申請料（日本からの申請）
    STUDENT_VISA_OUTSIDE_UK: 490,
    // IHS（Immigration Health Surcharge: 移民健康課徴金）※年間
    IHS_STUDENT_PER_YEAR: 776,
    // バイオメトリクス登録（指定センターでの指紋・顔写真登録）
    BIOMETRICS: 19.20,
  },

  // 2. 資金証明要件（Proof of Funds）- 最大9ヶ月ルール対応
  PROOF_OF_FUNDS: {
    // ロンドン市内（Inside London）の月額生活費要件
    LIVING_COST_LONDON_PER_MONTH: 1529,
    // ロンドン郊外（Outside London: マンチェスター、エディンバラ等）の月額生活費要件
    LIVING_COST_OUTSIDE_LONDON_PER_MONTH: 1171,
  },

  // 3. 語学留学の月額学費
  TUITION_LANGUAGE_PER_MONTH: 1400,

  // 4. ビザ・保険料（短期/長期）- 境界線: 6ヶ月
  VISA_AND_INSURANCE: {
    SHORT_TERM: {
      visa: 135,
      insurance: 0,
    },
    LONG_TERM: {
      visa: 558,
      insurance: 776,
    },
  },
} as const;
