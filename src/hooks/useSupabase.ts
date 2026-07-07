import { useMemo } from "react";
import { useSession } from "@clerk/clerk-react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// クライアント公開用のURL/anonキー（VITE_プレフィックス = ブラウザに見えてもよい値）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ログイン中のClerkセッションからSupabase用JWTを取得し、
// それを使って認証済みのSupabaseクライアントを返すフック。
// 未ログイン時はnullを返す。
export function useSupabase(): SupabaseClient | null {
  const { session } = useSession();

  return useMemo(() => {
    if (!session) return null;

    return createClient(supabaseUrl, supabaseAnonKey, {
      // Clerk公式のSupabase向けThird-Party Auth統合（2025年4月〜の推奨方式）。
      // 旧JWTテンプレート方式（{ template: "supabase" }）は非推奨のため使わない。
      // accessTokenはリクエストのたびに呼ばれるので、
      // トークンが期限切れでも自動的に新しいものが使われる
      accessToken: async () => {
        return (await session.getToken()) ?? null;
      },
    });
  }, [session]);
}
