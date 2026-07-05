import type { DocumentMaster } from "./types";

export const UK_DOCUMENTS: DocumentMaster[] = [
  // ── 共通必須書類（Student Visa取得者全員：正規留学・交換留学） ──
  {
    id: "uk-doc-passport",
    countries: ["UK"], types: ["DEGREE", "EXCHANGE"],
    category: "身分・渡航書類",
    nameJa: "パスポート", nameEn: "Current Passport or Valid Travel Documentation",
    source: "母国政府（市役所等の発給機関）",
    notes: "イギリスでの滞在期間をカバーする有効期限と、ビザを貼付するための空白ページ（通常両面1枚以上）が必要。",
  },
  {
    id: "uk-doc-cas",
    countries: ["UK"], types: ["DEGREE", "EXCHANGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "CAS番号通知書", nameEn: "Confirmation of Acceptance for Studies (CAS Statement)",
    source: "イギリスの受入先大学（Student Sponsor）",
    notes: "CAS自体は電子データ（参照番号）だが、内容が記載されたPDF等のステートメントを印刷しておく。CASに記載されたコース期間、学費の支払い済み額、滞在先情報に1文字でも誤りがあるとビザ却下の原因になるため、申請前の確認が必須。",
  },
  {
    id: "uk-doc-bank-statement",
    countries: ["UK"], types: ["DEGREE", "EXCHANGE"],
    category: "金融関連書類",
    nameJa: "28日ルールを満たした英文銀行取引明細書", nameEn: "Bank Statements meeting the 28-day rule",
    source: "資金提供者（本人または親）の取引銀行",
    notes: "ロンドン市内は月額£1,529、市外は£1,171（最大9ヶ月分）＋初年度の未払い学費が、「連続して28日間以上」口座に保持されていることを証明する。明細書の最終残高日は、オンラインビザ申請日（ビザ料金支払日）から遡って「31日以内」でなければならない。",
  },
  {
    id: "uk-doc-translation",
    countries: ["UK"], types: ["DEGREE", "EXCHANGE"],
    category: "金融関連書類",
    nameJa: "翻訳証明書", nameEn: "Certified Translation",
    source: "認定されたプロの翻訳者または翻訳会社",
    notes: "銀行明細や戸籍謄本など、英語またはウェールズ語以外の書類を提出する場合に必須。UKVIの厳格な規定により、①原本の正確な翻訳である旨の宣言、②翻訳日付、③翻訳者のフルネームと直筆署名、④翻訳者の連絡先の4点が全て記載されていないと無効（却下）となる。",
  },
  {
    id: "uk-doc-parent-consent",
    countries: ["UK"], types: ["DEGREE", "EXCHANGE"],
    category: "金融関連書類",
    nameJa: "親の同意書および関係証明書", nameEn: "Letter of Consent and Birth Certificate",
    source: "資金提供者である親、および本籍地の役所",
    notes: "本人名義ではなく親名義の口座で資金証明を行う場合にのみ必要。資金提供への同意を示す英文レターと、親子関係を証明する出生証明書（日本の場合は戸籍謄本と翻訳証明書）のセットが必須。",
  },

  // ── 6ヶ月以上の交換留学・正規留学特有の追加書類 ──────────────
  {
    id: "uk-doc-tb-test",
    countries: ["UK"], types: ["DEGREE", "EXCHANGE"],
    category: "保険・その他",
    nameJa: "結核（TB）検査証明書", nameEn: "Tuberculosis Test Certificate",
    source: "UKVI指定のクリニック（パネルドクター）",
    notes: "日本国籍者は原則不要だが、ビザ申請日から遡って「過去6ヶ月以内」にフィリピンや中国などの「TB高リスク国」に「6ヶ月以上」滞在していた履歴がある場合は、指定クリニックでの胸部X線検査と証明書の提出が必須。有効期限は発行から6ヶ月。",
  },
  {
    id: "uk-doc-transcript",
    countries: ["UK"], types: ["DEGREE", "EXCHANGE"],
    category: "学業関連書類",
    nameJa: "学歴証明書および成績証明書の原本", nameEn: "Original Academic Qualifications and Transcripts",
    source: "母国の在籍大学または出身校",
    notes: "CASに「合否判定の根拠として使用した」と記載されている学歴証明書類の原本。日本国籍者は低リスク国枠（Differential evidence requirement）により初期提出は免除されるが、UKVIからランダムに要求された際、即座に英訳付きで提出できないとビザが却下される。",
  },
  {
    id: "uk-doc-atas",
    countries: ["UK"], types: ["DEGREE", "EXCHANGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "ATAS証明書", nameEn: "Academic Technology Approval Scheme Certificate",
    source: "イギリス外務省（FCDO）オンラインシステム",
    notes: "一部の理系（STEM分野）の修士・博士課程、または特定の研究プログラムに進学する場合にのみ要求される。CASにATAS必須の記載があるにもかかわらず取得していない場合、ビザは確実に却下される。",
  },

  // ── 6ヶ月未満の語学留学（Standard Visitor等）特有の書類 ───────
  // 6ヶ月未満の就学は Student Visa ではなく Visitor 枠となり、CASや28日ルールは適用されない。
  {
    id: "uk-doc-eta",
    countries: ["UK"], types: ["LANGUAGE"],
    category: "身分・渡航書類",
    nameJa: "ETA（電子渡航認証）リンク済みパスポート", nameEn: "Passport linked with Electronic Travel Authorisation",
    source: "イギリス内務省（UK ETA App）",
    notes: "2025年1月8日以降、日本国籍者が6ヶ月以内のStandard Visitorとして渡航・就学する場合、事前のETA取得（£20）が法的義務。ETAは物理的な紙ではなくパスポートに電子的にリンクされるため、必ず「申請時と同一のパスポート」を持参して渡航する必要がある。",
  },
  {
    id: "uk-doc-visitor-acceptance",
    countries: ["UK"], types: ["LANGUAGE"],
    category: "ビザ・入学許可書類（国別）",
    nameJa: "認定機関からの入学許可証原本", nameEn: "Letter of Acceptance from an Accredited Institution",
    source: "イギリスの受入先語学学校または大学",
    notes: "Visitorルートで就学するためには、受入先がAccreditation UKなどの公式認定機関（Accredited institution）である必要がある。コース期間が6ヶ月以内であることが明記された公式な入学許可証の提示が入国審査等で求められる。",
  },
  {
    id: "uk-doc-return-ticket",
    countries: ["UK"], types: ["LANGUAGE"],
    category: "身分・渡航書類",
    nameJa: "帰国便の航空券予約証明書", nameEn: "Proof of Return or Onward Journey",
    source: "航空会社または旅行代理店",
    notes: "Standard Visitorはイギリス国内でのビザ延長や他カテゴリーへの切り替えが法的に一切禁止されている。そのため、「コース終了後（最大6ヶ月以内）に確実にイギリスを出国すること」を証明する帰国便のチケット、またはそれを購入できるだけの十分な資金証明が必須。",
  },
];
