// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react-oxc'; // ← ここを新しいプラグインに変更

// 開発サーバー専用: /api/fx を本番の Vercel Edge Function (api/fx.ts) と同じ契約でプロキシする。
// APIキーはここ(Node側)でのみ扱われ、クライアントバンドルには一切含まれない。
function fxDevProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'fx-api-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/fx', async (_req, res) => {
        const apiKey = env.EXCHANGE_RATE_API_KEY;
        res.setHeader('content-type', 'application/json');
        if (!apiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ result: 'error', 'error-type': 'server-key-missing' }));
          return;
        }
        try {
          const apiRes = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/JPY`);
          const data = await apiRes.text();
          res.statusCode = apiRes.status;
          res.end(data);
        } catch {
          res.statusCode = 502;
          res.end(JSON.stringify({ result: 'error', 'error-type': 'fetch-failed' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), fxDevProxyPlugin(env)],
    server: {
      // `vercel dev` はランダムなポートを割り当ててそこにサーバーが立つのを待つため、
      // process.env.PORT を尊重しないと "Failed to detect a server running on port ..." になる。
      port: Number(process.env.PORT) || 5173,
      strictPort: true,
    },
  };
});