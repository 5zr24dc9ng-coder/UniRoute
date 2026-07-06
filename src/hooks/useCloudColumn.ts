import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSupabase } from "./useSupabase";

const SAVE_DEBOUNCE_MS = 800;

// usersテーブルの指定カラム(JSONB)を、ログイン中のユーザーの行として
// 読み書きするための汎用フック。未ログイン時は何もしない(既存のlocalStorage動作のまま)。
export function useCloudColumn<T>(column: "simulation_state" | "task_state") {
  const { user } = useUser();
  const supabase = useSupabase();

  // Supabaseから取得できた値。取得前/未ログイン時はnull
  const [cloudValue, setCloudValue] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ログインしたら一度だけクラウドの値を取得する
  useEffect(() => {
    if (!supabase || !user) {
      setLoaded(false);
      return;
    }

    let cancelled = false;
    supabase
      .from("users")
      .select(column)
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setCloudValue((data as Record<string, T>)[column] ?? null);
        }
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, user, column]);

  // 値の変更をデバウンスしてSupabaseへ保存する
  const saveCloudValue = (value: T) => {
    if (!supabase || !user) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase
        .from("users")
        .update({ [column]: value })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.error(`🚨 ${column} の保存に失敗:`, error.message);
        });
    }, SAVE_DEBOUNCE_MS);
  };

  return { cloudValue, loaded, saveCloudValue };
}
