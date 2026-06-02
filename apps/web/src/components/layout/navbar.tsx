import { Link, useLocation, useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const isDashboard = location.pathname === "/dashboard";
  const isScan = location.pathname === "/scan";
  const isLibrary = location.pathname === "/library";

  const navLinkClassName = (isActive: boolean) =>
    [
      "inline-flex items-center rounded-full px-4 py-2 text-[18px] font-medium transition-colors",
      isActive
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
      navigate("/");
    },
  });

  const user = useAuthStore((state) => state.user);

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

        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/dashboard" className={navLinkClassName(isDashboard)}>
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/scan" className={navLinkClassName(isScan)}>
              Scan Tanaman
            </Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/library" className={navLinkClassName(isLibrary)}>
              Pustaka Penyakit
            </Link>
          </Button>
          {user && (
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Keluar..." : "Keluar"}
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
