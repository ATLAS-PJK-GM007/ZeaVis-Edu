import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Pill, Shield, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUiStore } from "@/store/ui-store";
import { apiClient } from "@/lib/api-client";
import bg from "@/assets/images/dashboard-bg.png";

export function DashboardPage() {
  const { dashboardCompact } = useUiStore();
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiClient.getDashboardSummary(),
  });

  const summary = summaryQuery.data;

  const missionCards = [
    {
      icon: Scan,
      title: "Deteksi Otomatis",
      description:
        "Upload foto daun jagung dan AI kami akan mengidentifikasi penyakit secara instan.",
      accent: "text-lime-600",
    },
    {
      icon: BookOpen,
      title: "Modul Edukasi",
      description:
        "Informasi detail tentang gejala, penyebab, dan dampak setiap penyakit daun jagung.",
      accent: "text-amber-600",
    },
    {
      icon: Shield,
      title: "Panduan Pencegahan",
      description:
        "Strategi pencegahan berbasis sains untuk melindungi tanaman Anda dari infeksi.",
      accent: "text-blue-600",
    },
    {
      icon: Pill,
      title: "Rekomendasi Obat",
      description:
        "Saran fungisida dan perawatan mandiri yang tepat sesuai jenis penyakit.",
      accent: "text-violet-600",
    },
  ];

  const diseasesQuick = [
    { name: "Hawar Daun", sci: "Northern Leaf Blight", color: "#b91c1c" },
    { name: "Karat Daun", sci: "Common Rust", color: "#d97706" },
    { name: "Bercak Abu-abu", sci: "Gray Leaf Spot", color: "#6b7280" },
    { name: "Daun Sehat", sci: "Healthy", color: "#16a34a" },
  ];

  const isLoadingData = summaryQuery.isLoading;
  const hasError = Boolean(summaryQuery.error);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Hero header */}
        <header
          className="relative overflow-hidden rounded-3xl bg-cover bg-center bg-no-repeat shadow-sm"
          style={{ backgroundImage: `url(${bg})` }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-[#2F6E1A]/60 to-black/30" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-10">
            <div className="space-y-3 w-full md:w-2/3 text-white">
              <span className="inline-block rounded-full bg-[#1E8A2A]/80 px-4 py-2 text-xs font-semibold">
                AI FOR SMART EDUCATION
              </span>
              <h1 className="text-4xl font-extrabold">Selamat Datang di</h1>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#9AD872]">
                ZeaVis Edu
              </h2>
              <p className="mt-3 max-w-xl text-white/90">
                Platform edukasi berbasis AI untuk membantu petani jagung
                Indonesia mendeteksi penyakit daun secara mandiri, cepat, dan
                akurat.
              </p>
              <div className="mt-6 flex items-center gap-4">
                <Button
                  asChild
                  variant="outline"
                  className="bg-[#306D29] hover:bg-[#1E8A2A]/90 px-6 py-6 text-lg font-semibold text-white"
                >
                  <Link to="/scan" className="inline-flex items-center gap-2">
                    <Scan className="h-5 w-6" />
                    Scan Daun Jagung
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="px-6 py-6 text-lg font-semibold text-white hover:bg-[#1E8A2A]"
                >
                  <Link
                    to="/library"
                    className="inline-flex items-center gap-2"
                  >
                    Pustaka Penyakit
                    <ChevronRight className="h-5 w-6" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="w-full md:w-1/3" />
          </div>
        </header>

        {/* Loading / Error states */}
        {isLoadingData && (
          <Card className="p-8 text-center text-muted-foreground">
            Memuat data dashboard...
          </Card>
        )}

        {hasError && (
          <Card className="p-8 text-center text-red-600">
            <div>Gagal memuat data dashboard</div>
            <div className="mt-2 text-sm text-red-500">
              {String(summaryQuery.error?.message)}
            </div>
          </Card>
        )}

        {/* Main dashboard content */}
        {!isLoadingData && !hasError && (
          <>
            {summary && (
              <section
                className={
                  dashboardCompact
                    ? "grid gap-4 md:grid-cols-4 items-stretch"
                    : "grid gap-6 md:grid-cols-4 items-stretch"
                }
              >
                <div className="md:col-span-4 text-xl font-bold">
                  <h3 className="text-[24px] font-extrabold text-[#214B11]">
                    Proyek Urgensi
                  </h3>
                  <p className="text-[15px] font-normal text-muted-foreground">
                    Data ringkasan terbaru dari proyek Anda untuk memantau
                    perkembangan dan hasil deteksi penyakit daun jagung
                  </p>
                </div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Penyakit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full flex flex-col justify-start pt-2">
                    <div className="text-3xl font-bold">
                      {summary.diseaseCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Diagnosis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full flex flex-col justify-start pt-2">
                    <div className="text-3xl font-bold">
                      {summary.imageClassificationCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Menunggu Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full flex flex-col justify-start pt-2">
                    <div className="text-3xl font-bold text-amber-600">
                      {summary.needsReviewCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Risiko Tinggi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full flex flex-col justify-start pt-2">
                    <div className="text-3xl font-bold text-red-600">
                      {summary.riskDistribution.high}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Mission section */}
            <section className="space-y-5 rounded-4xl bg-[#EEF4E8] py-6 md:py-8">
              <div className="space-y-1">
                <h3 className="text-[24px] font-extrabold text-[#214B11]">
                  Misi Platform
                </h3>
                <p className="text-[15px] font-normal text-muted-foreground">
                  Fitur inti yang kami sediakan untuk mendukung petani jagung
                  Indonesia
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {missionCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <Card
                      key={card.title}
                      className="rounded-3xl border-white/70 bg-white/95 shadow-[0_8px_24px_rgba(16,24,40,0.08)] h-full"
                    >
                      <CardContent className="space-y-5 p-6 h-full flex flex-col justify-between">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6E8]">
                          <Icon className={`h-7 w-7 ${card.accent}`} />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-bold text-[#214B11]">
                            {card.title}
                          </h4>
                          <p className="text-sm leading-6 text-slate-500">
                            {card.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Diseases quick access */}
            <section className="space-y-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="text-[24px] font-extrabold text-[#214B11]">
                    Penyakit yang Dapat Dideteksi
                  </h3>
                  <p className="text-[15px] font-normal text-muted-foreground">
                    4 kelas penyakit dan kondisi daun jagung dalam sistem kami
                  </p>
                </div>
                <Link
                  to="/library"
                  className="text-emerald-600 font-semibold inline-flex items-center gap-1"
                >
                  Lihat Pustaka <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {diseasesQuick.map((d) => (
                  <Card
                    key={d.name}
                    className="rounded-2xl bg-white p-4 shadow-sm h-full"
                  >
                    <CardContent className="h-full p-4 flex flex-col justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-1 h-3 w-3 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <div>
                          <div className="text-sm font-bold text-[#214B11]">
                            {d.name}
                          </div>
                          <div className="text-xs text-slate-400 italic mt-1">
                            {d.sci}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Scan quick access */}
            <div className="mt-15 flex items-center gap-57 bg-[#1E8A2A] rounded-3xl p-6">
              <div className="text-2xl font-bold text-white">
                <h3>Siap Mendeteksi Penyakit Daun?</h3>
                <div>
                  <p className="text-sm text-[#9AD872] font-normal mt-2">
                    Unggah foto daun jagung Anda dan dapatkan hasil analisis AI
                    dalam hitungan detik.
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="bg-white hover:bg-[#1E8A2A]/90 hover:text-white px-6 py-6 text-lg font-bold text-[#214B11]"
              >
                <Link to="/scan" className="inline-flex items-center gap-2">
                  <Scan className="h-5 w-6" />
                  Mulai Scan Sekarang
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="px-6 py-6 text-lg font-bold text-white hover:bg-[#1E8A2A]"
              ></Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
