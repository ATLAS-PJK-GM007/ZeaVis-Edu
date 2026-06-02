import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DiseaseCard } from "@/components/disease-card";
import { apiClient } from "@/lib/api-client";
import type { RiskLevel } from "@zeavis/shared";

export function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");

  const { data: diseases, isLoading, error } = useQuery({
    queryKey: ["diseases"],
    queryFn: () => apiClient.getDiseases(),
  });

  const filteredDiseases = (diseases || []).filter((disease) => {
    const matchesSearch =
      disease.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disease.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disease.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = riskFilter === "all" || disease.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Edukasi Penyakit</p>
          <h1 className="text-3xl font-bold">Pustaka Penyakit</h1>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium mb-2">
            Cari penyakit
          </label>
          <input
            id="search"
            type="text"
            placeholder="Cari berdasarkan nama atau gejala..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="risk-filter" className="block text-sm font-medium mb-2">
            Filter risiko
          </label>
          <select
            id="risk-filter"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskLevel | "all")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">Semua Risiko</option>
            <option value="low">Risiko Rendah</option>
            <option value="medium">Risiko Sedang</option>
            <option value="high">Risiko Tinggi</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-muted-foreground">
          Memuat pustaka penyakit...
        </div>
      )}

      {error && (
        <div className="py-12 text-center text-red-600">
          Gagal memuat pustaka penyakit
        </div>
      )}

      {!isLoading && !error && filteredDiseases.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          Tidak ada penyakit yang cocok dengan filter ini.
        </div>
      )}

      {!isLoading && !error && filteredDiseases.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDiseases.map((disease) => (
            <DiseaseCard key={disease.slug} disease={disease} />
          ))}
        </div>
      )}
    </div>
  );
}
