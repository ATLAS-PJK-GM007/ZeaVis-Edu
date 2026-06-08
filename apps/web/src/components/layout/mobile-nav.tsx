import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  X,
  Leaf,
  LogOut,
  LayoutDashboard,
  Scan,
  Activity,
  BookOpen,
  UserCheck,
  ChartBar,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Daftar menu disamakan persis dengan sidebar.tsx
const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/scan", label: "Scan Daun", icon: Scan },
  { path: "/diagnoses", label: "Diagnosa", icon: Activity },
  { path: "/catalog", label: "Pustaka", icon: BookOpen, altPath: "/library" },
  { path: "/expert/reviews", label: "Tinjauan Pakar", icon: UserCheck },
  { path: "/telemetry", label: "Telemetry", icon: ChartBar },
];

export function MobileNav({ open, onClose }: Props) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navContent = (
    <div
      className={`fixed inset-0 z-999 lg:hidden transition-opacity duration-300 ease-in-out ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className={`fixed inset-y-0 right-0 z-999 flex w-full max-w-sm flex-col bg-[#306D29] shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header Menu Mobile */}
        <div className="flex items-center justify-between px-6 h-20 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 font-semibold text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#48A111]">
              <Link to="/dashboard" onClick={onClose}>
                <Leaf className="h-5 w-5" />
              </Link>
            </div>
            <div className="leading-tight">
              <div className="text-[18px] font-bold">ZeaVis Edu</div>
              <div className="text-[12px] font-normal text-[#9AD872]">
                Smart AI for Corn Disease Detection
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Tutup menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Item Menu */}
        <nav className="flex flex-col gap-2 overflow-y-auto px-5 py-6 flex-1">
          {NAV_ITEMS.map((item) => {
            const active =
              isActive(item.path) || (item.altPath && isActive(item.altPath));
            const Icon = item.icon; // Ambil icon dari daftar

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-full px-4 py-3 text-[16px] font-medium transition-colors ${
                  active
                    ? "bg-[#48A111] text-white shadow-sm"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-5 border-t border-white/10 shrink-0">
          <Link
            to="/logout"
            onClick={onClose}
            className="flex items-center justify-between w-full rounded-full bg-[#ECF4E8] border border-white/50 px-5 py-3 text-[16px] font-medium text-black transition-colors hover:bg-white/80"
          >
            <span>Keluar</span>
            <LogOut className="h-5 w-5 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(navContent, document.body)
    : navContent;
}
