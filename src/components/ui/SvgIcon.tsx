import type { ReactNode } from "react";

export type IconName = "sim" | "matrix" | "tasks" | "menu" | "close" | "visa";

interface SvgIconProps {
  name: IconName;
  size?: number;
  color?: string;
}

// 状態を持たない再利用可能なラインアイコン（Claude Design 由来）。
export function SvgIcon({ name, size = 17, color = "currentColor" }: SvgIconProps) {
  const defs: Record<IconName, ReactNode> = {
    sim: (
      <>
        <rect x="18" y="3" width="4" height="18" />
        <rect x="10" y="8" width="4" height="13" />
        <rect x="2" y="13" width="4" height="8" />
      </>
    ),
    matrix: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </>
    ),
    tasks: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </>
    ),
    menu: (
      <>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    ),
    close: (
      <>
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </>
    ),
    visa: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h3" />
        <path d="M13 15h5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {defs[name]}
    </svg>
  );
}

export default SvgIcon;
