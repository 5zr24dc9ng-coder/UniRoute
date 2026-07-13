// Vercel Node.js Serverless Function
// Stripeのcheckout.session.completedを受け取り、Supabaseのusersテーブルを
// is_premium=true・stripe_customer_id更新する。

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false, // 署名検証には生ボディが必要
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
  res.setHeader("content-type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method-not-allowed" }));
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    console.error("🚨 環境変数が足りません！");
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "server-misconfigured" }));
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "missing-stripe-signature" }));
    return;
  }

  const rawBody = await getRawBody(req);
  const stripe = new Stripe(stripeSecretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("🚨 署名検証エラー詳細:", err);
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "invalid-signature" }));
    return;
  }

  if (event.type !== "checkout.session.completed") {
    res.statusCode = 200;
    res.end(JSON.stringify({ received: true, ignored: event.type }));
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!userId) {
    console.error("🚨 client_reference_idが含まれていません");
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "payload-missing-fields" }));
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase
      .from("users")
      .update({ is_premium: true, stripe_customer_id: customerId ?? "" })
      .eq("id", userId);

    if (error) {
      console.error("🚨 DB Update Error:", error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "db-update-failed" }));
      return;
    }

    console.log("✅ プレミアム登録成功:", userId);
    res.statusCode = 200;
    res.end(JSON.stringify({ received: true }));
  } catch (err) {
    console.error("🚨 Webhook 予期せぬエラー:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "unexpected-error" }));
  }
}
