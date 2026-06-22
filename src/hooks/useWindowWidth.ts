import { useEffect, useState } from "react";

export function useWindowWidth(): number {
  const [w, setW] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    h(); // 初回マウント時に確実に実幅を反映
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}
