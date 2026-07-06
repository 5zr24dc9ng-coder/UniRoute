import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSupabase } from "../hooks/useSupabase";

interface UserRow {
  id: string;
  email: string;
  is_premium: boolean;
  stripe_customer_id: string;
  created_at: string;
}

// ログイン中のユーザー自身のレコードをSupabaseから取得して表示するテスト用コンポーネント
export function UserProfile() {
  const { user } = useUser();
  const supabase = useSupabase();

  const [row, setRow] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 未ログイン、またはSupabaseクライアントがまだ準備できていない場合は何もしない
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // 自分自身のidと一致する行だけを取得（RLSでも二重にガードされる）
    supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
        } else {
          setRow(data as UserRow);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  if (!user) return null;

  if (loading) {
    return <p className="text-sm text-gray-500">読み込み中...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">エラー: {error}</p>;
  }

  if (!row) {
    return <p className="text-sm text-gray-500">データが見つかりません</p>;
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 text-sm">
      <p>Email: {row.email}</p>
      <p>プレミアム: {row.is_premium ? "はい" : "いいえ"}</p>
      <p>登録日: {new Date(row.created_at).toLocaleDateString("ja-JP")}</p>
    </div>
  );
}
