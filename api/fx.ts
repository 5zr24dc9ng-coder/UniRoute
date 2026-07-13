// Vercel Node.js Serverless Function (Vite SPA の /api ディレクトリで自動認識される)
// Edge runtime は使わない: Node ランタイムの方が process.env の読み取りが確実なため。

export default async function handler(_req: unknown, res: any): Promise<void> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  res.setHeader("content-type", "application/json");

  if (!apiKey) {
    // 診断情報（設定済み変数名・総数）はログにのみ残す。レスポンスには含めない
    // (env変数名を外部に返すと攻撃者に環境構成のヒントを与えてしまうため)
    const matchingKeys = Object.keys(process.env).filter((k) =>
      /EXCHANGE|RATE|API/i.test(k)
    );
    console.error("🚨 EXCHANGE_RATE_API_KEY未設定:", {
      matchingKeys,
      totalEnvCount: Object.keys(process.env).length,
    });
    res.statusCode = 500;
    res.end(JSON.stringify({ result: "error", "error-type": "server-key-missing" }));
    return;
  }

  try {
    const apiRes = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/JPY`);
    const data = await apiRes.text();
    res.statusCode = apiRes.status;
    res.setHeader("cache-control", "s-maxage=86400, stale-while-revalidate=3600");
    res.end(data);
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ result: "error", "error-type": "fetch-failed" }));
  }
}
