// Vercel Node.js Serverless Function (Vite SPA の /api ディレクトリで自動認識される)
// Edge runtime は使わない: Node ランタイムの方が process.env の読み取りが確実なため。

export default async function handler(_req: unknown, res: any): Promise<void> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  res.setHeader("content-type", "application/json");

  if (!apiKey) {
    // 診断: 値は絶対に出さず、キー名の候補だけ返す（機密ではない）
    const matchingKeys = Object.keys(process.env).filter((k) =>
      /EXCHANGE|RATE|API/i.test(k)
    );
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        result: "error",
        "error-type": "server-key-missing",
        _diag: { matchingKeys, totalEnvCount: Object.keys(process.env).length },
      })
    );
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
