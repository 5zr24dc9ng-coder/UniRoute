// src/constants/flight/estimates.ts
/**
 * Flight Airfare Estimates (JPY)
 * Based on Fall 2026 Departures
 */

export const FLIGHT_ESTIMATES_JPY = {
  NORTH_AMERICA: {
    MIN: 232200, // [cite: 681]
    MAX: 328000, // [cite: 728]
    NOTES: "直行便・経由便や航空会社（JAL/AA, ANA/UA）により変動。" // [cite: 680, 727]
  },
  CANADA: {
    MIN: 206200, // [cite: 781]
    MAX: 255200, // [cite: 781]
    NOTES: "エアカナダ基準。" // [cite: 780]
  },
  EUROPE: {
    MIN: 122000, // [cite: 869]
    MAX: 284000, // [cite: 837, 900]
    NOTES: "エミレーツ等の経由便が安価。JAL/フィンエアー等は高価格帯。" // [cite: 836, 868, 899]
  },
  OCEANIA: {
    MIN: 117000, // [cite: 1001]
    MAX: 190400, // [cite: 981]
    NOTES: "マレーシア航空等が安価。シンガポール航空・キャセイは高価格帯。" // [cite: 976, 996, 1014]
  },
  ASIA: {
    MIN: 60400, // [cite: 1051]
    MAX: 198900, // [cite: 1045]
    NOTES: "韓国路線は安価。シンガポール方面は高価格帯。" // [cite: 1037, 1051]
  }
} as const;