import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Pill,
  ShieldCheck,
  Search,
  Leaf,
  FlaskConical,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { RiskBadge } from "@/components/risk-badge";
import { diseaseCatalogSeed } from "@zeavis/shared/diseases";


export function CatalogPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const { data: diseases, isLoading } = useQuery({
    queryKey: ["diseases"],
    queryFn: () => apiClient.getDiseases(),
  });

  const filteredDiseases = useMemo(() => {
    if (!diseases) return [];

    return diseases.filter((disease) => {
      const matchesSearch =
        disease.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.symptoms.some((symptom) =>
          symptom.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesRisk =
        riskFilter === "all" || disease.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [diseases, searchQuery, riskFilter]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat pustaka penyakit...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#214B11]">
          Pustaka Penyakit
        </h1>
        <p className="mt-1 text-muted-foreground text-sm md:text-base">
          Referensi lengkap penyakit dan kondisi daun jagung yang dapat
          dideteksi oleh sistem AI ZeaVis Edu.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Cari penyakit
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau gejala..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#214B11]/20 focus:border-[#214B11] transition-all"
            />
          </div>
        </div>

        <div className="w-full md:w-48 space-y-1.5 shrink-0">
          <label className="text-sm font-semibold text-slate-700">
            Filter risiko
          </label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#214B11]/20 focus:border-[#214B11] transition-all bg-white"
          >
            <option value="all">Semua Risiko</option>
            <option value="high">Risiko Tinggi</option>
            <option value="medium">Risiko Sedang</option>
            <option value="low">Risiko Rendah</option>
          </select>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {filteredDiseases.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">
              Tidak ada penyakit yang sesuai dengan pencarianmu.
            </p>
          </div>
        ) : (
          filteredDiseases.map((disease) => {
            const isExpanded = expandedId === disease.slug;
            
            const seedData = diseaseCatalogSeed.find(seed => seed.slug === disease.slug);
            const finalImageUrl = disease.imageUrl || seedData?.imageUrl || "https://placehold.co/100x100?text=Daun";
            const finalMedicines = disease.medicineRecommendations || seedData?.medicineRecommendations;


            return (
              <div
                key={disease.slug}
                onClick={() =>
                  setExpandedId(isExpanded ? null : disease.slug)
                }
                className={`bg-white rounded-2xl border transition-all duration-300 ${
                  isExpanded
                    ? "border-[#214B11]/30 shadow-md ring-1 ring-[#214B11]/5"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {/* Accordion Header */}
                <div
                  className="flex items-center justify-between p-4 md:p-5 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={finalImageUrl}
                      alt={disease.commonName}
                      className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover shrink-0 bg-slate-100"
                    />
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h3 className="text-lg font-bold text-[#214B11]">
                          {disease.commonName}
                        </h3>
                        <div className="w-fit">
                          <RiskBadge level={disease.riskLevel} />
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 italic mt-0.5">
                        {disease.label}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-slate-50 text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="p-4 md:p-6 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <img
                        src={
                          finalImageUrl
                        }
                        alt="Detail Penyakit"
                        className="w-full h-48 md:h-full object-cover rounded-xl"
                      />

                      <div className="space-y-5">
                        <div>
                          <h4 className="font-bold text-[#214B11] flex items-center gap-2 mb-2">
                            Deskripsi
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {disease.description || disease.summary}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold text-[#214B11] flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Gejala
                          </h4>
                          <ul className="space-y-2">
                            {disease.symptoms?.map((symptom, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-slate-600"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                <span>{symptom}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-[#F2F8F0] border border-[#D5E8CE] rounded-xl p-5">
                        <h4 className="font-bold text-[#214B11] flex items-center gap-2 mb-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Panduan Pencegahan
                        </h4>
                        <ul className="space-y-2">
                          {disease.recommendations?.map((rec, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-slate-700"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-[#F8F4FD] border border-[#E9DDF5] rounded-xl p-5">
                        <h4 className="font-bold text-purple-900 flex items-center gap-2 mb-3">
                          <FlaskConical className="w-4 h-4 text-purple-600" />
                          Rekomendasi Obat
                        </h4>
                        <ul className="space-y-2">
                        {finalMedicines ? (
                          finalMedicines.map((obat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                              <Pill className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                              <span>{obat}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-500 italic">
                            Belum ada data rekomendasi obat spesifik.
                          </li>
                        )}
                      </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Warning Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start mt-8">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>Disclaimer:</strong> Informasi dalam pustaka ini bersifat
          edukatif dan disarikan dari literatur ilmiah. ZeaVis Edu bukan
          pengganti diagnosis lapangan oleh{" "}
          <strong>Petugas Pengamat Organisme Pengganggu Tanaman (POPT)</strong>{" "}
          atau ahli pertanian berlisensi. Selalu konsultasikan kondisi tanaman
          Anda kepada dinas pertanian atau balai penelitian tanaman terkait.
        </p>
      </div>
    </div>
  );
}
