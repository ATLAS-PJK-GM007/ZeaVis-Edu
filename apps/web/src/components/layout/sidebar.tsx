import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Leaf,
  LogOut,
  Menu,
  ChevronLeft,
  LayoutDashboard,
  Scan,
  Activity,
  BookOpen,
  UserCheck,
  ChartBar,
} from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/scan", label: "Pindai Daun", icon: Scan },
  { path: "/diagnoses", label: "Diagnosa", icon: Activity },
  { path: "/catalog", label: "Pustaka", icon: BookOpen, altPath: "/library" },
  {
    path: "/expert/reviews",
    label: "Tinjauan Pakar",
    icon: UserCheck,
    expertOnly: true,
  },
  { path: "/telemetry", label: "Telemetry", icon: ChartBar, expertOnly: true },
];

export function Sidebar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setIsSidebarOpen = useUiStore((state) => state.setIsSidebarOpen);

  const user = useAuthStore((state) => state.user);
  const isExpert = user?.role === "expert";

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.expertOnly || isExpert) {
      return true;
    }
    return false;
  });

  const isActive = (path: string, altPath?: string) => {
    if (path === "/dashboard" || path === "/scan") {
      return location.pathname === path;
    }
    return (
      location.pathname.startsWith(path) ||
      (altPath && location.pathname.startsWith(altPath))
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#306D29] shadow-xl z-30 text-white transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "w-80" : "w-30"
      }`}
    >
      {/* logo & header area */}
      <div
        className={`h-30 flex items-center border-b border-white/10 shrink-0 transition-all duration-300 ${isSidebarOpen ? "px-6 justify-between" : "justify-center"}`}
      >
        <div
          className={`flex items-center gap-3 font-semibold text-white overflow-hidden transition-all duration-300 ${isSidebarOpen ? "opacity-100 w-[180px]" : "opacity-0 w-0 hidden"}`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#48A111] p-6">
            <Leaf className="h-8 w-8 shrink-0" />
          </div>
          <div className="leading-tight flex-1 ">
            <div className="text-[20px] font-bold">ZeaVis Edu</div>
            <div className="text-[13px] font-normal text-[#9AD872] leading-tight">
              Smart AI for Corn Disease Detection
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`rounded-xl transition-colors flex items-center justify-center shrink-0 ${
            isSidebarOpen
              ? "p-1.5 bg-white/10 hover:bg-white/20 text-white"
              : "w-12 h-12 bg-[#48A111] hover:bg-[#52B713] text-white shadow-sm"
          }`}
          title={isSidebarOpen ? "Sembunyikan Menu" : "Buka Menu"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* List Menu */}
      <nav
        className={`flex-1 overflow-y-auto py-6 flex flex-col gap-3 ${isSidebarOpen ? "px-5" : "px-0 items-center"}`}
      >
        {filteredNavItems.map((item) => {
          // Skip expert-only items for non-expert users
          if (item.expertOnly && !isExpert) {
            return null;
          }

          const active = isActive(item.path, item.altPath);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              onClick={() => setIsSidebarOpen(true)}
              className={`flex items-center rounded-full font-medium transition-all ${
                isSidebarOpen
                  ? "px-4 py-3 gap-3 text-[16px] w-full"
                  : "justify-center w-12 h-12"
              } ${
                active
                  ? "bg-[#48A111] text-white shadow-sm"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div
        className={`h-18 px-5 border-t border-white/10 shrink-0 flex items-center ${isSidebarOpen ? "" : "justify-center"}`}
      >
        <Link
          to="/logout"
          title="Keluar"
          className={`flex items-center rounded-full transition-all ${
            isSidebarOpen
              ? "justify-between w-full bg-[#ECF4E8] border border-white/50 px-5 py-3 text-[16px] font-medium text-black hover:bg-white/80"
              : "justify-center w-12 h-12 bg-[#ECF4E8] text-black hover:bg-white shadow-sm"
          }`}
        >
          {isSidebarOpen && <span className="whitespace-nowrap">Keluar</span>}
          <LogOut className="h-5 w-5 shrink-0" />
        </Link>
      </div>

      <MobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </aside>
  );
}
