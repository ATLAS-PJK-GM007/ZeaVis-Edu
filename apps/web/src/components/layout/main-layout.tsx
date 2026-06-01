import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

type Props = { children: ReactNode };

export function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-[#ECF4E8]">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
