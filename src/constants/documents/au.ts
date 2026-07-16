import type { DocumentMaster } from "./types";

const ALL_TYPES: DocumentMaster["types"] = ["DEGREE", "EXCHANGE", "LANGUAGE"];

export const AU_DOCUMENTS: DocumentMaster[] = [
  // ── 共通必須書類（Subclass 500取得者全員） ──────────────────
  {
    id: "au-doc-passport",
    countries: ["AU"], types: ALL_TYPES,
    category: "身分・渡航書類",
    nameJa: "パスポートおよび渡航歴の証明", nameEn: "Valid Passport & Travel History",
    source: "母国政府（市役所等の発給機関）",
    notes: "留学期間全体をカバーする有効期限が推奨される。顔写真ページに加え、過去の他国へのビザラベルや出入国スタンプが押された「すべてのページ」のスキャンデータが求められる（過去の移民法遵守歴の証明のため）。",
  },
  {
    id: "au-doc-coe",
    countries: ["AU"], types: ALL_TYPES,
    category: "ビザ・入学許可書類（国別）",
    nameJa: "電子入学確認書", nameEn: "Confirmation of Enrolment (CoE)",
    source: "受入先のオーストラリア教育機関（CRICOS登録校）",
    notes: "Letter of Offer（合格通知）ではなく、学費デポジット支払い後に発行されるCoEの番号が必須。複数のコースをパッケージで受講する場合（語学＋大学など）、すべてのコースのCoEを漏れなく提出しなければならない。",
  },
  {
    id: "au-doc-oshc",
    countries: ["AU"], types: ALL_TYPES,
    category: "保険・その他",
    nameJa: "留学生健康保険加入証明書", nameEn: "OSHC Policy Certificate",
    source: "オーストラリア政府承認の保険会社（Bupa, Allianz, nib等）",
    notes: "ビザ申請日からプログラム終了予定日のさらに数ヶ月後（ビザ有効期限全体）までをカバーする一括前払いの証明が必要。期間に1日でも空白（Gap）があるとビザは却下される。",
  },
  {
    id: "au-doc-funds",
    countries: ["AU"], types: ALL_TYPES,
    category: "金融関連書類",
    nameJa: "英文資金証明書類", nameEn: "Evidence of Financial Capacity",
    source: "本人またはスポンサー（親など）の取引銀行・金融機関",
    notes: "2026年現在の基準で初年度の生活費AUD 29,710＋学費＋往復渡航費をカバーする資金証明が必須。急な大金の入金は偽装と疑われるため、過去3〜6ヶ月の継続的な取引履歴を示す明細書、または正式な教育ローン承認書の提出が極めて重要。",
  },
  {
    id: "au-doc-gs-evidence",
    countries: ["AU"], types: ALL_TYPES,
    category: "学業関連書類",
    nameJa: "GS要件の裏付けとなる証拠書類", nameEn: "GS Supporting Documents",
    source: "申請者本人（出身校、雇用先などから収集）",
    notes: "2024年3月よりGTEエッセイは廃止され、フォーム上の4つの設問（各150語）に回答する形式に変更された。しかし、回答を裏付ける物理的な証拠（英文の履歴書、最終学歴の成績証明書、現在の雇用証明書、納税証明書など）を添付しなければ、GS（Genuine Student）要件を満たしていないとして却下される。",
  },
  {
    id: "au-doc-emedical",
    countries: ["AU"], types: ALL_TYPES,
    category: "保険・その他",
    nameJa: "健康診断受診完了証明書", nameEn: "eMedical Information Sheet / HAP ID",
    source: "オーストラリア内務省指定のパネルドクター（指定病院）",
    notes: "申請システムからHAP IDを取得し、指定病院で胸部X線や尿・血液検査等を受診した証明。指定病院以外での診断書は一切無効。",
  },
  {
    id: "au-doc-biometrics-exemption",
    countries: ["AU"], types: ALL_TYPES,
    category: "保険・その他",
    nameJa: "生体認証免除に関する説明書および日本滞在証明", nameEn: "Statement of Biometrics Exemption & Proof of Residence in Japan",
    source: "申請者本人",
    notes: "【日本独自の落とし穴】日本は現在オーストラリアの生体認証収集プログラムの対象外。しかし、システム上誤って「生体認証要求レター（AUI）」が発行されるケースがある。この場合、14日以内に「現在日本に滞在しており生体認証施設がない」旨の英文説明書と、日本にいる証拠（住民票やパスポートの帰国スタンプ等）をアップロードしなければ手続きが停止・却下されるリスクがある。",
  },

  // ── 語学留学・ワーホリ等からの切り替え（Onshore）で要求されやすい追加書類（該当する場合のみ） ──
  {
    id: "au-doc-vevo",
    countries: ["AU"], types: ALL_TYPES,
    category: "ビザ・入学許可書類（国別）",
    nameJa: "現在のビザ付与通知書（該当する場合）", nameEn: "Current Visa Grant Notice / VEVO Check",
    source: "オーストラリア内務省（VEVOシステム）",
    notes: "ワーキングホリデービザ（Subclass 417/462）と観光ビザ（Subclass 600/601等）とでは、学生ビザへの国内（オンショア）切り替えの可否が大きく異なる点に注意。現在のビザに「No Further Stay（条件8503）」が付されている場合は、ビザの種類を問わず国内からの学生ビザ申請が法的に不可能（例外は重病・戦争・災害等のごく限定的な人道的理由によるウェイバー申請のみ）。ワーキングホリデービザは条件8503が基本的に付されないため、現在も国内切り替えが可能。一方、観光ビザは2024年7月1日の規則改定により、条件8503の有無にかかわらず観光ビザから学生ビザへの国内切り替え申請自体が一律で禁止されており、原則として一度国外に出て申請し直す必要がある。",
    // 2026-07-13: Kaiのファクトチェックにより、当初の「ワーホリ＝8503が付きやすい」という誤った前提を修正済み。
  },
  {
    id: "au-doc-english-proficiency",
    countries: ["AU"], types: ALL_TYPES,
    category: "学業関連書類",
    nameJa: "英語能力証明書", nameEn: "Proof of English Proficiency",
    source: "認定テスト機関（IELTS, TOEFL, PTE Academic等）",
    notes: "大学やVET（職業訓練）コースに進学する場合、規定のスコア（例：IELTS 5.5〜6.0以上など）を証明する公式スコアレポートの提出が求められる。スコアが基準に満たない場合は、パッケージで語学学校（ELICOS）のCoEを同時に提出する必要がある。",
  },
  {
    id: "au-doc-gs-onshore",
    countries: ["AU"], types: ALL_TYPES,
    category: "学業関連書類",
    nameJa: "コース変更・国内切り替えの正当性を示す追加のGS説明書（該当する場合）", nameEn: "Additional GS Statement for Onshore Switching",
    source: "申請者本人",
    notes: "なぜワーキングホリデーで入国した後に「突然オーストラリアでの就学が必要になったのか」、その就学が帰国後のキャリアにどう明確な利益（ROI）をもたらすのかを論理的に説明する補足文書。これが曖昧な場合、「単なる滞在延長目的」と見なされ高確率で却下される。※観光ビザは2024年7月1日の規則改定以降、国内切り替え自体が一律禁止のためこの書類の対象外（上記`au-doc-vevo`参照）。",
  },
  {
    id: "au-doc-local-bank-history",
    countries: ["AU"], types: ALL_TYPES,
    category: "金融関連書類",
    nameJa: "直近の資金履歴証明書（オーストラリア国内・該当する場合）", nameEn: "Recent Australian Bank Statements",
    source: "申請者が利用しているオーストラリア国内の銀行",
    notes: "国内切り替えの場合、オーストラリアでの生活実態があるため、ワーホリ期間中に稼いだ資金や、日本から送金された履歴がわかる国内口座の明細書の提出が求められやすくなる。残高不足は一発却下の対象となる。",
  },
];
