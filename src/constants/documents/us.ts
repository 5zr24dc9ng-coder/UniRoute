import type { DocumentMaster } from "./types";

export const US_DOCUMENTS: DocumentMaster[] = [
  // ── 共通必須書類（F-1 / J-1 全員共通） ──────────────────────
  {
    id: "us-doc-passport",
    countries: ["US"], types: ["DEGREE", "EXCHANGE", "LANGUAGE"],
    category: "身分・渡航書類",
    nameJa: "パスポート", nameEn: "Passport",
    source: "母国政府（市役所等の発給機関）",
    notes: "米国での滞在予定期間に加えて6ヶ月以上の残存有効期間が必須。過去に米国ビザが発給された古いパスポートがある場合はそれも併せて持参する必要がある。",
  },
  {
    id: "us-doc-ds160",
    countries: ["US"], types: ["DEGREE", "EXCHANGE", "LANGUAGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "DS-160確認ページ", nameEn: "DS-160 Confirmation Page",
    source: "米国国務省オンラインシステム（CEAC）",
    notes: "オンライン提出後に発行される、バーコードが鮮明に印字された確認ページを印刷して持参する。",
  },
  {
    id: "us-doc-appointment",
    countries: ["US"], types: ["DEGREE", "EXCHANGE", "LANGUAGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "面接予約確認書", nameEn: "Visa Appointment Confirmation",
    source: "米国大使館・領事館の予約システム",
    notes: "面接の日時と場所が記載された予約確認書の印刷が必要。大使館の入館やセキュリティチェックの際に提示を求められる。",
  },
  {
    id: "us-doc-mrv-receipt",
    countries: ["US"], types: ["DEGREE", "EXCHANGE", "LANGUAGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "ビザ申請料金支払領収書", nameEn: "MRV Visa Fee Receipt",
    source: "大使館指定の決済システム",
    notes: "185米ドルのビザ申請料金（MRV料金）を支払ったことを証明する領収書が必要。",
  },
  {
    id: "us-doc-photo",
    countries: ["US"], types: ["DEGREE", "EXCHANGE", "LANGUAGE"],
    category: "身分・渡航書類",
    nameJa: "証明写真", nameEn: "Passport Photo",
    source: "写真館または証明写真機",
    notes: "5cm×5cm（2×2インチ）のサイズで、過去6ヶ月以内に撮影された白またはオフホワイト背景のカラー写真が必要。眼鏡の着用は一切認められないため、必ず外して撮影する。",
  },
  {
    id: "us-doc-bank-statement",
    countries: ["US"], types: ["DEGREE", "EXCHANGE", "LANGUAGE"],
    category: "金融関連書類",
    nameJa: "英文銀行残高証明書", nameEn: "Bank Statements",
    source: "資金提供者（本人または親）の取引銀行",
    notes: "最新（発行から3〜6ヶ月以内）の英文証明書で、初年度の学費と生活費（I-20やDS-2019に記載された推計費用）をカバーできる十分な流動資産があることを証明する。親がスポンサーの場合は、関係性を示す書類や支援同意書（Affidavit of Support）が追加で必要になることがある。",
  },

  // ── 交換留学（J-1ビザ）特有 ──────────────────────────────
  {
    id: "us-doc-ds2019",
    countries: ["US"], types: ["EXCHANGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "DS-2019", nameEn: "Certificate of Eligibility for Exchange Visitor (J-1) Status",
    source: "協定校またはプログラムスポンサー機関",
    notes: "SEVISを通じて発行される公式な適格性証明書の原本。受領後、記載内容を確認し、1ページ目下部に青色のインクで本人署名と日付を記入する必要がある。",
  },
  {
    id: "us-doc-sevis-j1",
    countries: ["US"], types: ["EXCHANGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "J-1用 SEVIS費支払領収書", nameEn: "SEVIS I-901 Fee Receipt (J-1, $220)",
    source: "DHS公式決済サイト（fmjfee.com）",
    notes: "J-1ビザ用のSEVIS費用である220米ドルの支払い完了を示す印刷された領収書。DS-2019に記載されているSEVIS IDを使用して支払う。",
  },
  {
    id: "us-doc-funding-letter",
    countries: ["US"], types: ["EXCHANGE"],
    category: "金融関連書類",
    nameJa: "外部資金証明書・スポンサーレター", nameEn: "Funding/Fellowship Letters",
    source: "奨学金財団、母国の在籍大学、または政府機関",
    notes: "J-1ビザの適格性を満たすため、総資金の51%以上が個人や家族以外のソース（奨学金など）から提供されていることを証明する公式なレターが必要。機関のレターヘッドに印字され、責任者の署名がある英文書類を用意する。",
  },

  // ── 正規留学・語学留学（F-1ビザ）特有 ──────────────────────
  {
    id: "us-doc-i20",
    countries: ["US"], types: ["DEGREE", "LANGUAGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "I-20", nameEn: "Certificate of Eligibility for Nonimmigrant (F-1) Student Status",
    source: "受入先の米国大学または語学学校",
    notes: "学校の留学生担当責任者（DSO）から発行される証明書の原本。DS-2019と同様に、1ページ目下部に本人の直筆署名が必要。コピーは不可。",
  },
  {
    id: "us-doc-sevis-f1",
    countries: ["US"], types: ["DEGREE", "LANGUAGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "F-1用 SEVIS費支払領収書", nameEn: "SEVIS I-901 Fee Receipt (F-1, $350)",
    source: "DHS公式決済サイト（fmjfee.com）",
    notes: "F-1ビザ用のSEVIS費用である350米ドルを支払った証明となる領収書。面接の少なくとも3営業日前までに支払いを完了させる必要がある。",
  },
  {
    id: "us-doc-transcript",
    countries: ["US"], types: ["DEGREE", "LANGUAGE"],
    category: "学業関連書類",
    nameJa: "英文成績証明書および卒業証明書", nameEn: "Academic Transcripts and Diplomas",
    source: "母国の在籍校または出身校",
    notes: "過去の学歴を証明するため、学校の公式な印章（公印）が押された英文原本が必要。純粋な就学意思を裏付ける重要な書類として領事に審査される。",
  },
  {
    id: "us-doc-test-score",
    countries: ["US"], types: ["DEGREE", "LANGUAGE"],
    category: "学業関連書類",
    nameJa: "テストスコア公式認定証", nameEn: "Standardized Test Scores",
    source: "テスト実施機関（ETS、ケンブリッジ大学英語検定機構など）",
    notes: "TOEFL、IELTS、Duolingoなどの英語能力テスト、またはSAT、GREなどの学力テストの公式スコアレポート。米国の学校から要求されている基準を満たしていることを証明する。",
  },
];
