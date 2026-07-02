export const config = { runtime: "edge" };

export default async function handler(): Promise<Response> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ result: "error", "error-type": "server-key-missing" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const apiRes = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/JPY`);
    const data = await apiRes.text();
    return new Response(data, {
      status: apiRes.status,
      headers: {
        "content-type": "application/json",
        "cache-control": "s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new Response(JSON.stringify({ result: "error", "error-type": "fetch-failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
