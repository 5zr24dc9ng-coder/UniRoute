// Vercel Node.js Serverless Function
// Clerk の user.created Webhook を受け取り、Supabase の users テーブルへ登録する。

import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false, // 自動パースを無効化（超重要）
  },
};

async function getRawBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any): Promise<void> {
  console.log("🚨 [WEBHOOK DOOR KNOCKED] メソッド:", req.method);

  res.setHeader("content-type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method-not-allowed" }));
    return;
  }

  // ★ 罠対策1: .envコピー時の末尾の見えないスペース(空白)を .trim() で完全に抹殺
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!signingSecret || !supabaseUrl || !serviceRoleKey) {
    console.error("🚨 環境変数が足りません！");
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "server-misconfigured" }));
    return;
  }

  const svixId = req.headers["svix-id"];
  const svixTimestamp = req.headers["svix-timestamp"];
  const svixSignature = req.headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("🚨 Svixヘッダーが欠損しています");
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "missing-svix-headers" }));
    return;
  }

  // ★ 罠対策2: バイト列(Buffer)をUTF-8の文字列(String)に変換（Svixにはこれが必須）
  const rawBody = await getRawBody(req);
  const payloadString = rawBody.toString("utf8");

  // ── 署名検証（偽装リクエストを弾く） ──────────────────────────────
  let event: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(signingSecret);
    // ★ 罠対策3: ヘッダーが配列になっている可能性を潰すため、確実に単一の文字列にキャスト
    event = wh.verify(payloadString, {
      "svix-id": Array.isArray(svixId) ? svixId[0] : svixId,
      "svix-timestamp": Array.isArray(svixTimestamp) ? svixTimestamp[0] : svixTimestamp,
      "svix-signature": Array.isArray(svixSignature) ? svixSignature[0] : svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    // ★ 罠対策4: エラーの正体を隠さずターミナルに表示する
    console.error("🚨 署名検証エラー詳細:", err);
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "invalid-signature", detail: String(err) }));
    return;
  }

  // user.created 以外は受領のみ返す（Clerkの自動リトライ爆撃を防ぐ）
  if (event.type !== "user.created") {
    res.statusCode = 200;
    res.end(JSON.stringify({ received: true, ignored: event.type }));
    return;
  }

  const clerkUserId = event.data.id as string | undefined;
  const emailAddresses = event.data.email_addresses as { email_address: string }[] | undefined;
  const primaryEmail = emailAddresses?.[0]?.email_address;

  if (!clerkUserId || !primaryEmail) {
    console.error("🔍 DEBUG event.type:", event.type, "data keys:", Object.keys(event.data), "email_addresses:", JSON.stringify(emailAddresses));
    console.error("🚨 ペイロードに必要なデータが含まれていません");
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "payload-missing-fields" }));
    return;
  }

  // ── Supabaseへ登録 ──
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.from("users").insert({
      id: clerkUserId,
      email: primaryEmail,
    });

    if (error) {
      console.error("🚨 DB Insert Error:", error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "db-insert-failed", detail: error.message }));
      return;
    }

    console.log("✅ Supabaseへの登録大成功！:", primaryEmail);
    res.statusCode = 200;
    res.end(JSON.stringify({ received: true }));
  } catch (err) {
    console.error("🚨 Webhook 予期せぬエラー:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "unexpected-error", detail: err instanceof Error ? err.message : String(err) }));
  }
}