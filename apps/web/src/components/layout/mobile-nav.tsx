import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { X, Leaf, LogOut } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/scan", label: "Scan Tanaman" },
  { path: "/diagnoses", label: "Diagnosa" },
  { path: "/catalog", label: "Pustaka", altPath: "/library" },
  { path: "/expert/reviews", label: "Review" },
];

export function MobileNav({ open, onClose }: Props) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navContent = (
    <div
      className={`fixed inset-0 z-[999] lg:hidden transition-opacity duration-300 ease-in-out ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[999] flex w-full max-w-sm flex-col bg-[#306D29] shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-20 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 font-semibold text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#48A111]">
              <Link to="/dashboard" onClick={onClose}>
                <Leaf className="h-5 w-5" />
              </Link>
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold">ZeaVis Edu</div>
              <div className="text-[13px] font-normal text-[#9AD872]">
                Smart AI for Corn Disease Detection
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Tutup menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-2 overflow-y-auto px-4 py-6 flex-1">
          {NAV_ITEMS.map((item) => {
            const active =
              isActive(item.path) || (item.altPath && isActive(item.altPath));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`rounded-full px-4 py-3 text-[16px] font-medium transition-colors ${
                  active
                    ? "bg-[#48A111] text-white shadow-sm"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/logout"
            onClick={onClose}
            className="inline-flex items-center rounded-full bg-[#ECF4E8] border border-white/50 px-4 py-2 text-[16px] font-medium text-black transition-colors hover:bg-white/50"
          >
            <span>Keluar</span>
            <LogOut className="ml-64 h-4 w-4" />
          </Link>
        </nav>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(navContent, document.body)
    : navContent;
}
