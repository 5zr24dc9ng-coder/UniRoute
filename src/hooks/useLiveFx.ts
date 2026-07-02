import { useEffect, useState } from "react";
import { DEFAULT_FX } from "../constants/countries";
import type { Fx } from "../types";

const CACHE_KEY = "uniroute_fx_v1";

interface FxCache {
  fx: Fx;
  nextUpdateUnix: number;
  lastUpdatedUnix: number;
}

export interface UseLiveFxResult {
  fx: Fx;
  setFx: React.Dispatch<React.SetStateAction<Fx>>;
  isLive: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

function readCache(): FxCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: FxCache = JSON.parse(raw);
    if (Math.floor(Date.now() / 1000) < cache.nextUpdateUnix) return cache;
    return null;
  } catch {
    // JSON.parse 失敗時はキャッシュを破棄して新規フェッチ
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function writeCache(data: FxCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // プライベートブラウジング等でも無視して続行
  }
}

function parseRates(conversionRates: Record<string, number>): Fx {
  const inv = (code: string) => parseFloat((1 / conversionRates[code]).toFixed(2));
  // 4通貨のみ抽出してキャッシュ・ステートに保持（全通貨は保存しない）
  return { GBP: inv("GBP"), USD: inv("USD"), AUD: inv("AUD"), CAD: inv("CAD") };
}

export function useLiveFx(): UseLiveFxResult {
  const [fx, setFx] = useState<Fx>(() => {
    const cached = readCache();
    return cached ? cached.fx : DEFAULT_FX;
  });
  const [isLive, setIsLive] = useState<boolean>(() => readCache() !== null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const cached = readCache();
    return cached ? new Date(cached.lastUpdatedUnix * 1000) : null;
  });

  useEffect(() => {
    // visibilitychange のたびに新しい controller を差し替えるため let で宣言
    let currentController: AbortController | null = null;

    async function fetchIfStale(): Promise<void> {
      if (readCache()) return;

      // 実行中のフェッチをキャンセルして新しいリクエストを発行
      currentController?.abort();
      currentController = new AbortController();

      try {
        // APIキーはサーバー側(/api/fx)でのみ保持し、クライアントには一切露出させない
        const res = await fetch("/api/fx", { signal: currentController.signal });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as {
          result: string;
          "error-type"?: string;
          conversion_rates: Record<string, number>;
          time_last_update_unix: number;
          time_next_update_unix: number;
        };

        if (data.result !== "success") {
          throw new Error(data["error-type"] ?? "API error");
        }

        const liveFx = parseRates(data.conversion_rates);

        writeCache({
          fx: liveFx,
          nextUpdateUnix: data.time_next_update_unix,
          lastUpdatedUnix: data.time_last_update_unix,
        });

        setFx(liveFx);
        setIsLive(true);
        setLastUpdated(new Date(data.time_last_update_unix * 1000));
        setError(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(`為替レート取得失敗: ${msg}`);
        console.error("[useLiveFx]", err);
      }
    }

    function onVisibilityChange(): void {
      if (document.visibilityState === "visible") void fetchIfStale();
    }

    void fetchIfStale();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      currentController?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return { fx, setFx, isLive, error, lastUpdated };
}
