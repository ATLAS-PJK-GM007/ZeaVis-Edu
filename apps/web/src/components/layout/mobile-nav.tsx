import { Link, useLocation } from "react-router-dom";
import { X, Leaf } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  userRole?: string | null;
};

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/scan", label: "Scan Tanaman" },
  { path: "/diagnoses", label: "Diagnosa" },
  { path: "/catalog", label: "Pustaka" },
];

export function MobileNav({ open, onClose, userRole }: Props) {
  const location = useLocation();

  if (!open) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#306D29] shadow-xl">
        <div className="flex items-center justify-between px-6 h-20 border-b border-white/10">
          <div className="flex items-center gap-3 font-semibold text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#48A111]">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">ZeaVis Edu</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Tutup menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-col gap-2 px-4 pt-6">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
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

          {userRole === "expert" && (
            <Link
              to="/expert/reviews"
              onClick={onClose}
              className={`rounded-full px-4 py-3 text-[16px] font-medium transition-colors ${
                isActive("/expert/reviews")
                  ? "bg-[#48A111] text-white shadow-sm"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              Review
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
