import type { DocumentMaster } from "./types";

const ALL_TYPES: DocumentMaster["types"] = ["DEGREE", "EXCHANGE", "LANGUAGE"];

export const CA_DOCUMENTS: DocumentMaster[] = [
  // ── 共通必須書類（Study Permit取得者全員） ──────────────────
  {
    id: "ca-doc-passport",
    countries: ["CA"], types: ALL_TYPES,
    category: "身分・渡航書類",
    nameJa: "パスポート", nameEn: "Valid Passport or Travel Document",
    source: "母国政府（市役所等の発給機関）",
    notes: "申請時およびカナダ入国時に有効である必要がある。バイオメトリクス（生体認証）完了後、承認されると原本の提出（郵送）が求められる。",
  },
  {
    id: "ca-doc-loa",
    countries: ["CA"], types: ALL_TYPES,
    category: "ビザ・入学許可書類（国別）",
    nameJa: "入学許可証", nameEn: "Letter of Acceptance (LOA)",
    source: "受入先のカナダ政府認定校（DLI）",
    notes: "DLI（Designated Learning Institution）発行の公式レター。申請提出後、IRCCから学校側へ直接「LOAの有効性検証」が求められる。学校側が期限内にシステム上で承認しないと、申請は無効として返金・却下されるため、事前に学校側へ検証の段取りを確認することが重要。",
  },
  {
    id: "ca-doc-pal",
    countries: ["CA"], types: ALL_TYPES,
    category: "ビザ・入学許可書類（国別）",
    nameJa: "州の証明書", nameEn: "Provincial Attestation Letter (PAL)",
    source: "受入先のDLIを通じて州政府から取得",
    notes: "2024年以降導入された強力な入学枠制限の証明書。学士課程やカレッジ、語学留学等では提出が「必須」であり、添付漏れは即時却下となる。ただし2026年1月1日以降、公立DLIの修士課程（Master's）および博士課程（Doctoral）はPAL提出が免除。",
  },
  {
    id: "ca-doc-funds",
    countries: ["CA"], types: ALL_TYPES,
    category: "金融関連書類",
    nameJa: "英文資金証明書類", nameEn: "Proof of Financial Support",
    source: "資金提供者（本人または親）の取引銀行",
    notes: "【重要】2024年11月のSDS（Student Direct Stream）即時廃止により、全申請者が通常審査対象となった。さらに生活費の証明基準が引き上げられ、ケベック州以外では単身で年間CAD 22,895（2025年9月以降適用）＋初年度の学費＋渡航費の証明が必須。過去4ヶ月分の銀行取引明細や、GIC（投資証明書）の提示が強く推奨される。",
  },
  {
    id: "ca-doc-study-plan",
    countries: ["CA"], types: ALL_TYPES,
    category: "学業関連書類",
    nameJa: "学習計画書・説明書", nameEn: "Letter of Explanation / Study Plan",
    source: "申請者本人",
    notes: "必須ではないが実質的に極めて重要。カナダで学ぶ論理的な理由と、卒業後に母国へ帰国する強い意志（Ties to home country）を説明する。PAL免除対象者（修士・博士や交換留学生）は、自身が免除規定に該当する旨をこの書類で明確にアピールしないと、誤って却下されるリスクがある。",
  },
  {
    id: "ca-doc-emedical",
    countries: ["CA"], types: ALL_TYPES,
    category: "保険・その他",
    nameJa: "健康診断受診証明書", nameEn: "eMedical Information Sheet",
    source: "IRCC指定のパネルドクター（指定病院）",
    notes: "過去1年間に結核高リスク国に6ヶ月以上滞在した履歴がある場合、または医療・教育・保育分野（Co-op実習を含む）で就労・実習を行う場合は、指定病院での受診と証明書の提出が必須。",
  },
  {
    id: "ca-doc-biometrics",
    countries: ["CA"], types: ALL_TYPES,
    category: "ビザ・入学許可書類（国別）",
    nameJa: "生体認証指示書および受領書", nameEn: "Biometrics Instruction Letter & Receipt",
    source: "IRCCおよびビザ申請センター（VFS Global）",
    notes: "オンライン申請時にCAD 85を支払い、IRCCから「生体認証指示書（BIL）」を受領後30日以内に、VFS Globalセンターに出向いて指紋と顔写真を登録する必要がある。過去10年間にカナダビザ用で登録済みの場合は免除。",
  },

  // ── ケベック州に留学する場合の追加書類（該当する場合のみ） ─────
  {
    id: "ca-doc-caq",
    countries: ["CA"], types: ALL_TYPES,
    category: "ビザ・入学許可書類（国別）",
    nameJa: "ケベック州受け入れ証明書（該当する場合）", nameEn: "Certificat d'acceptation du Québec (CAQ)",
    source: "ケベック州移民・フランコフォニー・統合省（MIFI）",
    notes: "ケベック州のDLIに進学する場合、連邦政府のStudy Permit申請前に取得が完了している必要がある（PALの代わりとして機能）。発行には、独立したオンライン申請（Arrimaポータル）とCAD 132の申請料決済、および手書きで署名した「誓約・同意書」のアップロードが求められる。",
  },

  // ── Co-op留学（就労付き）特有の追加書類（該当する場合のみ） ────
  {
    id: "ca-doc-coop",
    countries: ["CA"], types: ["DEGREE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "インターンシップ/Co-op証明書（該当する場合）", nameEn: "Co-op / Internship Letter",
    source: "受入先のDLI（大学・カレッジのプログラム担当者等）",
    notes: "プログラムの一環として就労（Co-op）を行う場合、Co-op Work Permitを同時に申請するための根拠書類。「該当の就労が学位・ディプロマ取得のための『必須要件（integral part）』であり、かつプログラム全体の50%以下である」ことが明記されたDLIからの公式レターでなければならない。LOA（入学許可証）の中にその旨が記載されている場合はLOAのコピーを代用できる。",
  },
];
