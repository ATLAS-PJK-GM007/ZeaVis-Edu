import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Leaf, Menu } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const isActive = (path: string) => location.pathname === path;

  const navLinkClassName = (active: boolean) =>
    [
      "inline-flex items-center rounded-full px-4 py-2 text-[16px] font-medium transition-colors",
      active
        ? "bg-[#48A111] text-white shadow-sm"
        : "text-white/85 hover:bg-white/10 hover:text-white",
    ].join(" ");

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.logout();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      navigate("/login");
    },
  });

  return (
    <header className="sticky top-0 z-40 bg-[#306D29] text-white shadow-sm backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3 font-semibold">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#48A111] text-primary-foreground">
            <Link to="/dashboard">
              <Leaf className="h-5 w-5" />
            </Link>
          </div>
          <div className="leading-tight font-bold text-2xl">
            <div>ZeaVis Edu</div>
            <div className="text-[14px] font-normal text-[#9AD872]">
              Smart AI for Corn Disease Detection
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-2">
          <Link to="/dashboard" className={navLinkClassName(isActive("/dashboard"))}>
            Dashboard
          </Link>
          <Link to="/scan" className={navLinkClassName(isActive("/scan"))}>
            Scan Tanaman
          </Link>
          <Link to="/diagnoses" className={navLinkClassName(isActive("/diagnoses"))}>
            Diagnosa
          </Link>
          <Link to="/catalog" className={navLinkClassName(isActive("/catalog") || isActive("/library"))}>
            Pustaka
          </Link>
          {user?.role === "expert" && (
            <Link
              to="/expert/reviews"
              className={navLinkClassName(isActive("/expert/reviews"))}
            >
              Review
            </Link>
          )}
        </nav>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-6 w-6" />
        </button>

        <MobileNav
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>
    </header>
  );
}
