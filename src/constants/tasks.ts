export interface TaskMaster {
  id: string;
  countries: ('US' | 'UK' | 'AU' | 'CA')[];
  types: ('DEGREE' | 'EXCHANGE' | 'LANGUAGE')[];
  title: string;
  description: string;
  timing: string;
  dependsOn?: string[]; // ハードロック機能用：このIDのタスクが完了するまでブロックする
}

export const MASTER_TASKS: TaskMaster[] = [
  // ==========================================
  // アメリカ (US)
  // ==========================================
  {
    id: 'us-reg-1', countries: ['US'], types: ['DEGREE'],
    title: '大学への直接出願', timing: '渡航10〜12ヶ月前',
    description: 'SEVP認定校に対するGPA、TOEFL/IELTS、エッセイ等の提出。'
  },
  {
    id: 'us-reg-2', countries: ['US'], types: ['DEGREE'],
    title: '合格受諾とデポジット納入', timing: '渡航4〜6ヶ月前',
    description: 'Enrollment Depositの支払いと大学ポータルでの手続き開始。',
    dependsOn: ['us-reg-1']
  },
  {
    id: 'us-reg-3', countries: ['US'], types: ['DEGREE'],
    title: '英文財政証明書の提出とI-20発行', timing: '渡航3〜4ヶ月前',
    description: '1学年分（学費＋生活費）の英文銀行残高証明書を提出。審査後、DSOよりSEVIS上でI-20が発行される。',
    dependsOn: ['us-reg-2']
  },
  {
    id: 'us-reg-4', countries: ['US'], types: ['DEGREE'],
    title: 'SEVIS I-901費用の支払い ($350)', timing: '渡航2〜3ヶ月前',
    description: 'fmjfee.comにて$350を支払う。支払いがSEVISレコードのアクティベート条件となるため領収書は必ず印刷・保管する。',
    dependsOn: ['us-reg-3']
  },
  {
    id: 'us-reg-5', countries: ['US'], types: ['DEGREE'],
    title: 'DS-160の作成・提出', timing: '渡航2〜3ヶ月前',
    description: '国務省CEACサイトにて提出。I-20記載のSEVIS ID、滞在先、過去5年のSNSアカウント情報を正確に入力する。',
    dependsOn: ['us-reg-3']
  },
  {
    id: 'us-reg-6', countries: ['US'], types: ['DEGREE'],
    title: 'ビザ申請料の支払いと面接予約', timing: '渡航2ヶ月前',
    description: '大使館システムにてMRV申請料金 $185を支払い、面接を予約する。',
    dependsOn: ['us-reg-5']
  },
  {
    id: 'us-reg-7', countries: ['US'], types: ['DEGREE'],
    title: '大使館でのビザ対面面接', timing: '渡航1〜2ヶ月前',
    description: 'パスポート、I-20原本、SEVIS領収書、DS-160確認ページ、財政証明を持参。「非移民の意図」を証明する。',
    dependsOn: ['us-reg-6']
  },
  {
    id: 'us-exc-1', countries: ['US'], types: ['EXCHANGE'],
    title: '学内選考とノミネーション', timing: '渡航8〜10ヶ月前',
    description: '日本の在籍大学にて選考を通過し、協定校へノミネーションされる。'
  },
  {
    id: 'us-exc-2', countries: ['US'], types: ['EXCHANGE'],
    title: '協定校への出願と特殊資金証明', timing: '渡航4〜5ヶ月前',
    description: '協定校の受入審査。資金の51%以上が個人・家族以外（奨学金等）から拠出されていることを示す英文証明を提出。',
    dependsOn: ['us-exc-1']
  },
  {
    id: 'us-exc-3', countries: ['US'], types: ['EXCHANGE'],
    title: 'DS-2019の発行', timing: '渡航3〜4ヶ月前',
    description: 'スポンサー機関の責任者（RO/ARO）により、SEVIS経由でJ-1用のDS-2019（資格証明書）が発行される。',
    dependsOn: ['us-exc-2']
  },
  {
    id: 'us-exc-4', countries: ['US'], types: ['EXCHANGE'],
    title: 'SEVIS I-901費用の支払い ($220)', timing: '渡航2〜3ヶ月前',
    description: 'J-1ビザ用のSEVIS費用 $220を支払う。',
    dependsOn: ['us-exc-3']
  },
  {
    id: 'us-exc-5', countries: ['US'], types: ['EXCHANGE'],
    title: 'J-1法定要件を満たす保険手配', timing: '渡航1ヶ月前',
    description: '国務省が定める最低基準（医療費、医療搬送、遺体送還）をカバーする医療保険への加入が法的に義務付けられている。'
  },
  {
    id: 'us-lang-1', countries: ['US'], types: ['LANGUAGE'],
    title: '授業時間数に基づくビザ判定（週18時間の境界線）', timing: '渡航3〜6ヶ月前',
    description: '週18時間以上の場合はF-1必須。週18時間未満かつ観光主目的の場合はESTA利用。オンライン授業はカウント不可。'
  },
  {
    id: 'us-lang-2', countries: ['US'], types: ['LANGUAGE'],
    title: '語学学校出願とI-20取得（F-1該当者）', timing: '渡航2〜3ヶ月前',
    description: 'SEVP認定の語学学校へ出願し、残高証明を提示してI-20を取得する。',
    dependsOn: ['us-lang-1']
  },
  {
    id: 'us-lang-3', countries: ['US'], types: ['LANGUAGE'],
    title: '領事面接での帰国意思の立証', timing: '渡航1〜2ヶ月前',
    description: '語学留学は移民の意図を疑われやすいため、語学学習が母国でのキャリアにどう直結するかを証明する書類を持参する。',
    dependsOn: ['us-lang-2']
  },

  // ==========================================
  // イギリス (UK)
  // ==========================================
  {
    id: 'uk-reg-1', countries: ['UK'], types: ['DEGREE'],
    title: '大学出願と無条件合格（Unconditional Offer）の取得', timing: '渡航6〜12ヶ月前',
    description: '英語力（IELTS for UKVI等）および学力要件を満たし、無条件合格を得る。'
  },
  {
    id: 'uk-reg-2', countries: ['UK'], types: ['DEGREE', 'EXCHANGE'],
    title: 'CAS番号の受領', timing: '渡航4〜5ヶ月前',
    description: '学費デポジット納入後、大学から電子参照番号「CAS」を受領する。（交換留学で6ヶ月超の場合も必須）',
    dependsOn: ['uk-reg-1']
  },
  {
    id: 'uk-reg-3', countries: ['UK'], types: ['DEGREE', 'EXCHANGE'],
    title: '資金の28日連続保持（28-day rule）', timing: '渡航3〜4ヶ月前',
    description: '生活費（最大9ヶ月分）＋未払い学費が、ビザ申請日から遡って31日以内の明細で「連続28日間」保持されている状態を作る。'
  },
  {
    id: 'uk-reg-4', countries: ['UK'], types: ['DEGREE', 'EXCHANGE'],
    title: '英国学生ビザ申請とIHS（NHS保険）のオンライン決済', timing: '渡航2〜3ヶ月前',
    description: 'Visa申請料 £558 および高騰したIHS費用（年間 £776 × 期間）をオンラインで一括前払いする。',
    dependsOn: ['uk-reg-2', 'uk-reg-3']
  },
  {
    id: 'uk-exc-1', countries: ['UK'], types: ['EXCHANGE'],
    title: '期間に基づく適用ルートの判定（6ヶ月の境界線）', timing: '渡航6〜8ヶ月前',
    description: '6ヶ月超ならStudent Visa。6ヶ月以内ならStandard Visitorルートを適用。Visitorは就労（無給インターン含む）一切不可。'
  },
  {
    id: 'uk-lang-1', countries: ['UK'], types: ['LANGUAGE'],
    title: '期間に応じたビザ判定（11ヶ月の境界線）', timing: '渡航4〜5ヶ月前',
    description: '6ヶ月以内ならETA（£20）。6ヶ月超〜11ヶ月以内ならShort-term Study Visa（£228 ＋ IHS £776）を選択。'
  },
  {
    id: 'uk-common-1', countries: ['UK'], types: ['EXCHANGE', 'LANGUAGE'],
    title: 'ETAの事前申請（6ヶ月以内のVisitor該当者）', timing: '渡航1〜2ヶ月前',
    description: '日本国籍者が6ヶ月以内のVisitorとして渡航する場合、2025年以降は電子渡航認証（ETA: £20）の事前取得が必須。'
  },

  // ==========================================
  // オーストラリア (AU)
  // ==========================================
  {
    id: 'au-reg-1', countries: ['AU'], types: ['DEGREE', 'EXCHANGE'],
    title: 'CRICOS登録コース出願とオファー受領', timing: '渡航6〜8ヶ月前',
    description: '教育機関または協定校からLetter of Offerを受領する。'
  },
  {
    id: 'au-reg-2', countries: ['AU'], types: ['DEGREE', 'EXCHANGE'],
    title: 'OSHC（留学生医療保険）の強制一括加入', timing: '渡航4〜5ヶ月前',
    description: 'ビザ有効期間全体をカバーするOSHCの費用を事前に一括送金・加入する（学費免除の交換留学でも自己負担必須）。',
    dependsOn: ['au-reg-1']
  },
  {
    id: 'au-reg-3', countries: ['AU'], types: ['DEGREE', 'EXCHANGE'],
    title: 'CoE（Confirmation of Enrolment）の発行', timing: '渡航3〜4ヶ月前',
    description: 'OSHC等の支払完了後、移民局システムと連動したCoEが発行される。',
    dependsOn: ['au-reg-2']
  },
  {
    id: 'au-reg-4', countries: ['AU'], types: ['DEGREE', 'EXCHANGE'],
    title: 'GS（Genuine Student）要件の記述作成と資金証明', timing: '渡航2〜3ヶ月前',
    description: 'GTEに代わる4つの記述式設問（各150語）への回答作成。および生活費（AUD 29,710）ベースの資金証明準備。'
  },
  {
    id: 'au-reg-5', countries: ['AU'], types: ['DEGREE', 'EXCHANGE'],
    title: 'ImmiAccountでのビザ申請と高額決済', timing: '渡航2〜3ヶ月前',
    description: 'Subclass 500ビザ申請料 AUD 2,000（過去最高額）をオンライン決済し申請する。',
    dependsOn: ['au-reg-3', 'au-reg-4']
  },
  {
    id: 'au-reg-6', countries: ['AU'], types: ['DEGREE', 'EXCHANGE'],
    title: 'eMedical指定医での健康診断', timing: '渡航1〜2ヶ月前',
    description: '申請後発行のHAP IDを持参し、国内のパネルドクターにて胸部X線等を受診する。',
    dependsOn: ['au-reg-5']
  },
  {
    id: 'au-lang-1', countries: ['AU'], types: ['LANGUAGE'],
    title: '期間に基づくビザの判定（3ヶ月の境界線）', timing: '渡航4ヶ月前',
    description: '3ヶ月超ならSubclass 500（申請料 AUD 2,000＋OSHC等）。3ヶ月以内ならETAを利用。'
  },
  {
    id: 'au-lang-2', countries: ['AU'], types: ['LANGUAGE'],
    title: '「Australian ETA App」での電子申請', timing: '渡航2〜4週間前',
    description: '3ヶ月以内の場合、専用スマホアプリからパスポートをスキャンしてETAを自己申請する（代理店不可）。',
    dependsOn: ['au-lang-1']
  },

  // ==========================================
  // カナダ (CA)
  // ==========================================
  {
    id: 'ca-reg-1', countries: ['CA'], types: ['DEGREE', 'EXCHANGE', 'LANGUAGE'],
    title: 'DLI（認定校）からの合格通知（LOA）受領', timing: '渡航6〜10ヶ月前',
    description: 'カナダ政府認定校へ出願し、Letter of Acceptanceを取得する。'
  },
  {
    id: 'ca-reg-2', countries: ['CA'], types: ['DEGREE', 'LANGUAGE'],
    title: 'デポジット支払いとPAL（州証明書）の取得', timing: '渡航4〜6ヶ月前',
    description: '学士/カレッジ/語学（6ヶ月超）はデポジットを払い、大学経由で必須となるPAL（Provincial Attestation Letter）を取得する。',
    dependsOn: ['ca-reg-1']
  },
  {
    id: 'ca-exc-1', countries: ['CA'], types: ['EXCHANGE'],
    title: 'PAL免除要件の確認とExplanation Letter作成', timing: '渡航4〜5ヶ月前',
    description: '学費をカナダ側に払わない交換留学生はPAL提出が完全に免除される。その旨を明記した説明書を申請用に作成する。',
    dependsOn: ['ca-reg-1']
  },
  {
    id: 'ca-reg-3', countries: ['CA'], types: ['DEGREE'],
    title: '通常プロセス（Regular Stream）の厳格な資金証明', timing: '渡航4〜5ヶ月前',
    description: 'SDS廃止に伴い、生活費 CAD 20,635 ＋ 初年度学費の残高証明を厳密に準備する。'
  },
  {
    id: 'ca-reg-4', countries: ['CA'], types: ['DEGREE', 'EXCHANGE', 'LANGUAGE'],
    title: 'Study Permitのオンライン申請（6ヶ月超の場合）', timing: '渡航3〜5ヶ月前',
    description: 'LOA、PAL（または免除レター）、資金証明を提出し、申請料 CAD 150 と 生体認証費 CAD 85 を決済。'
  },
  {
    id: 'ca-reg-5', countries: ['CA'], types: ['DEGREE', 'EXCHANGE', 'LANGUAGE'],
    title: '指定センター（VFS）での生体認証', timing: '渡航3〜4ヶ月前',
    description: 'IRCCからの指示書受領後30日以内に、VFS Global（東京/大阪）にて指紋と顔写真を登録。',
    dependsOn: ['ca-reg-4']
  },
  {
    id: 'ca-lang-1', countries: ['CA'], types: ['LANGUAGE'],
    title: 'eTAのオンライン申請（6ヶ月以内の場合）', timing: '渡航2〜4週間前',
    description: '6ヶ月以内の就学ならStudy Permit不要。IRCC公式サイトからeTA（CAD 7）を申請・取得する。'
  }
];

export function getTasksByCountryAndType(
  country: string,
  type: string
): TaskMaster[] {
  return MASTER_TASKS.filter(
    (task) =>
      task.countries.includes(country as 'US' | 'UK' | 'AU' | 'CA') &&
      task.types.includes(type as 'DEGREE' | 'EXCHANGE' | 'LANGUAGE')
  );
}