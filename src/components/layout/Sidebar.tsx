import { NAV } from "../../constants/countries";
import { SvgIcon } from "../ui/SvgIcon";
import type { ViewId } from "../../types";

interface SidebarProps {
  view: ViewId;
  setView: (v: ViewId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ view, setView, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Tablet/mobile overlay — xl以上では非表示 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 xl:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer — xl:translate-x-0 で1280px以上は常時表示 */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transform transition-transform duration-300 ease-in-out xl:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#141d33" }}
      >
        <div
          style={{
            padding: "22px 22px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em" }}>
              UniRoute
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#4a6a9a",
                marginTop: 4,
                fontFamily: '"IBM Plex Mono", monospace',
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              留学支援コンソール
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="xl:hidden"
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}
          >
            <SvgIcon name="close" size={18} color="#8899bb" />
          </button>
        </div>

        <nav style={{ padding: "14px 12px", flex: 1 }}>
          {NAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  onClose();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 13px",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "rgba(47,99,230,0.22)" : "transparent",
                  color: active ? "#7aa2ff" : "#8899bb",
                  borderLeft: `3px solid ${active ? "#2f63e6" : "transparent"}`,
                  marginBottom: 4,
                  transition: "all 0.12s",
                  textAlign: "left",
                }}
              >
                <SvgIcon name={item.icon} size={16} color={active ? "#7aa2ff" : "#8899bb"} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "16px 22px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div
            style={{
              fontSize: 10,
              color: "#3a5070",
              fontFamily: '"IBM Plex Mono", monospace',
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            2026年要件
          </div>
          <div style={{ fontSize: 11, color: "#4a6a9a", marginTop: 5, lineHeight: 1.4 }}>
            ソース更新済み · 4カ国
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
