// Vercel Node.js Serverless Function
// ログイン中のClerkユーザー本人であることを検証したうえで、
// プレミアム(¥980買い切り)のStripe Checkout Sessionを作成して返す。

import Stripe from "stripe";
import { verifyToken } from "@clerk/backend";

export default async function handler(req: any, res: any): Promise<void> {
  res.setHeader("content-type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method-not-allowed" }));
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const productId = process.env.STRIPE_PREMIUM_PRODUCT_ID;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  if (!stripeSecretKey || !productId || !clerkSecretKey) {
    console.error("🚨 環境変数が足りません！");
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "server-misconfigured" }));
    return;
  }

  // ── ログイン中の本人確認（Authorizationヘッダーのセッショントークンを検証） ──
  const authHeader = req.headers["authorization"];
  const token = typeof authHeader === "string" ? authHeader.replace("Bearer ", "") : undefined;

  if (!token) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  let verified;
  try {
    const result = await verifyToken(token, { secretKey: clerkSecretKey });
    console.log("🔍 DEBUG verify result:", JSON.stringify(result));
    if (result.errors || !result.data) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "invalid-session", detail: JSON.stringify(result.errors) }));
      return;
    }
    verified = result.data;
  } catch (err) {
    console.error("🚨 セッション検証で例外:", err);
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "invalid-session", detail: err instanceof Error ? err.message : String(err) }));
    return;
  }

  const userId = verified.sub;

  // ── Checkout Session作成 ──
  try {
    const stripe = new Stripe(stripeSecretKey);
    const origin = req.headers["origin"] || `https://${req.headers["host"]}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product: productId,
            unit_amount: 980,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?premium=success`,
      cancel_url: `${origin}/?premium=cancelled`,
    });

    res.statusCode = 200;
    res.end(JSON.stringify({ url: session.url }));
  } catch (err) {
    console.error("🚨 Checkout Session作成エラー:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "checkout-session-failed", detail: err instanceof Error ? err.message : String(err) }));
  }
}
