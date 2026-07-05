import type { CountryId, StudyType } from "../../types";

/**
 * 書類チェックリストの1項目。
 * TaskMaster（constants/tasks.ts）と同じ「countries × types でフィルタする」設計に合わせている。
 */
export interface DocumentMaster {
  id: string;
  countries: CountryId[];
  types: StudyType[];
  category: string;
  /** 書類名（日本語） */
  nameJa: string;
  /** 書類名（英語） */
  nameEn: string;
  /** 取得元 */
  source: string;
  /** 注意点（却下リスク・落とし穴など） */
  notes: string;
}

// カテゴリの表示順（グルーピング用）
export const DOCUMENT_CATEGORY_ORDER = [
  "身分・渡航書類",
  "学業関連書類",
  "金融関連書類",
  "ビザ・入学許可書類（国別）",
  "保険・その他",
] as const;
