import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Pill, Shield, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUiStore } from "@/store/ui-store";
import { apiClient } from "@/lib/api-client";
import bg from "@/assets/images/dashboard-bg.webp";

export function DashboardPage() {
  const { dashboardCompact } = useUiStore();
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiClient.getDashboardSummary(),
  });

  const diseasesQuery = useQuery({
    queryKey: ["diseases"],
    queryFn: () => apiClient.getDiseases(),
  });

  const summary = summaryQuery.data;
  const diseases = diseasesQuery.data ?? [];

  const diseasesQuick = useMemo(() =>
    diseases
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((d) => ({
        name: d.commonName,
        sci: d.label,
        color: d.accentColor,
        slug: d.slug,
      })),
    [diseases]
  );

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

  const isLoadingData = summaryQuery.isLoading;
  const hasError = Boolean(summaryQuery.error);

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <header
        className="relative overflow-hidden rounded-3xl bg-cover bg-center bg-no-repeat shadow-sm"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#2F6E1A]/60 to-black/30" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-10">
          <div className="space-y-3 w-full md:w-2/3 text-white">
            <span className="inline-block rounded-full bg-[#1E8A2A]/80 px-4 py-2 text-xs font-semibold">
              AI FOR SMART EDUCATION
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold">Selamat Datang di</h1>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#9AD872]">
              ZeaVis Edu
            </h2>
            <p className="mt-3 max-w-xl text-white/90">
              Platform edukasi berbasis AI untuk membantu petani jagung
              Indonesia mendeteksi penyakit daun secara mandiri, cepat, dan
              akurat.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <Button
                asChild
                variant="outline"
                className="bg-[#306D29] hover:bg-[#1E8A2A]/90 px-4 md:px-6 py-3 md:py-6 text-sm md:text-lg font-semibold text-white"
              >
                <Link to="/scan" className="inline-flex items-center gap-2">
                  <Scan className="h-5 w-6" />
                  Scan Daun Jagung
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="px-4 md:px-6 py-3 md:py-6 text-sm md:text-lg font-semibold text-white hover:bg-[#1E8A2A]"
              >
                <Link
                  to="/catalog"
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
                <h3 className="text-lg md:text-[24px] font-extrabold text-[#214B11]">
                  Proyek Urgensi
                </h3>
                <p className="text-[15px] font-normal text-muted-foreground">
                  Data ringkasan terbaru dari proyek Anda untuk memantau
                  perkembangan dan hasil deteksi penyakit daun jagung
                </p>
              </div>

              {/* Total Diagnoses — the actual count from diagnoses table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Diagnosa
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full flex flex-col justify-start pt-2">
                  <div className="text-3xl font-bold">
                    {summary.imageClassificationCount}
                  </div>
                  <Link to="/diagnoses" className="text-emerald-600 ml-auto hover:underline">
                    Lihat daftar
                  </Link>
                </CardContent>
              </Card>

              {/* Menunggu Review */}
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
                  <Link to="/diagnoses?status=needs_review" className="text-amber-600 ml-auto hover:underline">
                    Lihat daftar
                  </Link>
                </CardContent>
              </Card>

              {/* Diagnosa Gagal */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Gagal
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full flex flex-col justify-start pt-2">
                  <div className="text-3xl font-bold text-red-600">
                    —
                  </div>
                  <Link to="/diagnoses?status=failed" className="text-red-600 ml-auto hover:underline">
                    Lihat daftar
                  </Link>
                </CardContent>
              </Card>

              {/* Risiko Tinggi — catalog count, link to catalog filtered */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Kategori Risiko Tinggi
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full flex flex-col justify-start pt-2">
                  <div className="text-3xl font-bold text-red-600">
                    {summary.riskDistribution.high}
                  </div>
                  <Link to="/catalog?risk=high" className="text-red-600 ml-auto hover:underline">
                    Lihat pustaka
                  </Link>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Mission section */}
          <section className="space-y-5 rounded-4xl bg-[#EEF4E8] py-6 md:py-8">
            <div className="space-y-1">
              <h3 className="text-lg md:text-[24px] font-extrabold text-[#214B11]">
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

          {/* Diseases quick access - now clickable, link to catalog/:slug */}
          <section className="space-y-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-lg md:text-[24px] font-extrabold text-[#214B11]">
                  Penyakit yang Dapat Dideteksi
                </h3>
                <p className="text-[15px] font-normal text-muted-foreground">
                  {diseases.length} kelas penyakit dan kondisi daun jagung dalam sistem kami
                </p>
              </div>
              <Link
                to="/catalog"
                className="text-emerald-600 font-semibold inline-flex items-center gap-1"
              >
                Lihat Pustaka <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {diseasesQuery.isLoading ? (
              <div className="text-center text-muted-foreground py-4">
                Memuat data penyakit...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {diseasesQuick.map((d) => (
                  <Link key={d.slug} to={`/catalog/${d.slug}`}>
                    <Card
                      className="rounded-2xl bg-white p-4 shadow-sm h-full transition-transform hover:scale-[1.03] hover:shadow-md cursor-pointer"
                    >
                      <CardContent className="h-full p-4 flex flex-col justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-1 h-3 w-3 rounded-full shrink-0"
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
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Scan quick access */}
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-[#1E8A2A] rounded-3xl p-5 sm:p-6">
            <div className="flex-1 text-white">
              <h3 className="text-2xl font-bold">Siap Mendeteksi Penyakit Daun?</h3>
              <p className="text-sm text-[#9AD872] font-normal mt-2">
                Unggah foto daun jagung Anda dan dapatkan hasil analisis AI
                dalam hitungan detik.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="bg-white hover:bg-[#1E8A2A]/90 hover:text-white px-6 py-6 text-lg font-bold text-[#214B11] shrink-0"
            >
              <Link to="/scan" className="inline-flex items-center gap-2">
                <Scan className="h-5 w-6" />
                Mulai Scan Sekarang
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
