import { ReactNode, useState } from "react";
import { Footer } from "./footer";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Leaf, Menu } from "lucide-react";
import { useUiStore } from "@/store/ui-store";

type Props = { children: ReactNode };

export function MainLayout({ children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setIsSidebarOpen = useUiStore((state) => state.setIsSidebarOpen);

  return (
    <div className="flex w-full h-screen bg-[#ECF4E8] overflow-hidden relative">
      {/* Sidebar Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">
        {/* Header Mobile */}
        <div className="md:hidden flex items-center justify-between px-5 h-20 bg-[#306D29] text-white shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3 font-semibold">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#48A111]">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-[17px] font-bold">ZeaVis Edu</div>
              <div className="text-[11px] font-normal text-[#9AD872]">
                Smart AI for Corn Disease Detection
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl p-2 bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="block md:hidden shrink-0">
          <MobileNav
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl flex flex-col">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
