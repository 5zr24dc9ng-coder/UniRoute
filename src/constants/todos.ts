import type { Task } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// クリティカルパス・タスク（依存関係 deps / ハードロック lock / ステータス status）
// ─────────────────────────────────────────────────────────────────────────────
export const TASKS: Task[] = [
  { id: 1, group: "準備", label: "留学先プログラム・大学の選定", due: "2026年3月", deps: [], lock: false, status: "done", note: "プログラムを調査・候補を絞り込む。大学の交換留学協定パートナーを確認すること。" },
  { id: 2, group: "準備", label: "条件付き合格通知の受領", due: "2026年4月", deps: [1], lock: false, status: "done", note: "大学からの公式受入通知。CAS・ビザ申請に必要。" },
  { id: 3, group: "準備", label: "IELTS / TOEFL 受験", due: "2026年4月", deps: [], lock: false, status: "done", note: "必要スコアを取得すること。英国大学は通常 IELTS 総合 6.0 以上を要求。" },
  { id: 4, group: "資金準備", label: "指定口座への送金", due: "5月10日", deps: [2], lock: false, status: "active", note: "ビザ申請で参照する口座に £11,385 を送金する。", warning: "為替警告：今週 GBP/JPY が 3.2% 上昇 — レートを今すぐ確定することを検討してください。" },
  { id: 5, group: "資金準備", label: "残高維持 · 28日連続", due: "6月7日", deps: [4], lock: true, status: "locked", note: "28日間の残高維持期間中、£11,385 を下回ってはならない。一度でも下回るとカウントがリセットされる。ウィンドウはビザ申請の28日以上前に閉じる必要がある。", warning: "ハードロック — このウィンドウが完全に閉じるまでビザ申請は不可能です。" },
  { id: 6, group: "大学手続き", label: "合格承認・授業料デポジット支払い", due: "5月31日", deps: [2, 3], lock: false, status: "active", note: "入学確認・授業料デポジットを支払い、在籍を確保する。CAS発行のトリガーとなる。" },
  { id: 7, group: "大学手続き", label: "CAS番号の受領", due: "6月15日", deps: [6], lock: true, status: "locked", note: "CAS（Confirmation of Acceptance for Studies）— 英国学生ビザ申請に必須の固有番号。大学から発行される。", warning: "ハードロック — 有効なCASなしでは英国学生ビザ申請は不可能です。" },
  { id: 8, group: "ビザ申請", label: "英国学生ビザ申請書の提出", due: "7月1日", deps: [5, 7], lock: true, status: "blocked", note: "UKVIオンラインポータルから申請。CASと28日残高証明の両方が同時に必要。", warning: "ハードロック — タスク5（28日ウィンドウ）とタスク7（CAS）が両方完了するまでブロックされます。" },
  { id: 9, group: "ビザ申請", label: "生体認証 / UKVCAS 予約への出席", due: "7月10日", deps: [8], lock: false, status: "blocked", note: "近くのUKVCASサービスポイントで生体情報を提出。申請後できるだけ早く予約すること。" },
  { id: 10, group: "ビザ申請", label: "ビザ審査結果の受領", due: "7月25日", deps: [9], lock: false, status: "blocked", note: "審査目標期間：15営業日。UKVIトラッカーで確認。結果受領前に払い戻し不可の航空券を予約しないこと。" },
  { id: 11, group: "出発準備", label: "航空券予約・住居確定", due: "8月10日", deps: [10], lock: false, status: "blocked", note: "渡航日程と学生住宅を確定する。CASに記載されている開講日と照合すること。" },
  { id: 12, group: "出発準備", label: "大学への出発", due: "9月15日", deps: [11], lock: false, status: "blocked", note: "CASに記載された開講日前に到着すること。入国審査で確認される。" },
];
