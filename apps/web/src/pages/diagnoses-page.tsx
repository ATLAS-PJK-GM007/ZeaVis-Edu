import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DiagnosisStatusBadge } from "@/components/diagnosis-status-badge";
import { RiskBadge } from "@/components/risk-badge";
import { apiClient } from "@/lib/api-client";
import type { DiagnosisStatus, RiskLevel } from "@zeavis/shared";

const STATUS_OPTIONS: { value: "all" | DiagnosisStatus; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "ai_verified", label: "Terverifikasi AI" },
  { value: "needs_review", label: "Menunggu Review" },
  { value: "expert_verified", label: "Diverifikasi Pakar" },
  { value: "expert_corrected", label: "Dikoreksi Pakar" },
  { value: "failed", label: "Gagal" },
];

const RISK_OPTIONS: { value: "all" | RiskLevel; label: string }[] = [
  { value: "all", label: "Semua Risiko" },
  { value: "high", label: "Risiko Tinggi" },
  { value: "medium", label: "Risiko Sedang" },
  { value: "low", label: "Risiko Rendah" },
];

export function DiagnosesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") as DiagnosisStatus | null;
  const initialRisk = searchParams.get("risk") as RiskLevel | null;

  const [statusFilter, setStatusFilter] = useState<
    "all" | DiagnosisStatus
  >(initialStatus ?? "all");
  const [riskFilter, setRiskFilter] = useState<
    "all" | RiskLevel
  >(initialRisk ?? "all");

  const query = useQuery({
    queryKey: ["diagnoses"],
    queryFn: () => apiClient.getDiagnoses(),
  });
  const diagnoses = query.data ?? [];

  const filtered = useMemo(() => {
    return diagnoses.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (riskFilter !== "all") {
        const level = d.disease?.riskLevel ?? "low";
        if (level !== riskFilter) return false;
      }
      return true;
    });
  }, [diagnoses, statusFilter, riskFilter]);

  const handleStatusChange = (value: string) => {
    const v = value as "all" | DiagnosisStatus;
    setStatusFilter(v);
    const next = new URLSearchParams(searchParams);
    if (v === "all") next.delete("status");
    else next.set("status", v);
    setSearchParams(next);
  };

  const handleRiskChange = (value: string) => {
    const v = value as "all" | RiskLevel;
    setRiskFilter(v);
    const next = new URLSearchParams(searchParams);
    if (v === "all") next.delete("risk");
    else next.set("risk", v);
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Manajemen Diagnosis
          </p>
          <h1 className="text-3xl font-bold">Daftar Diagnosis</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link to="/scan">Scan Baru</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium">Risiko</label>
            <select
              value={riskFilter}
              onChange={(e) => handleRiskChange(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {RISK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="ml-auto text-sm text-muted-foreground">
              Total: {filtered.length}
            </div>
          </div>

          {query.isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              Memuat diagnosis...
            </div>
          ) : query.isError ? (
            <div className="py-12 text-center text-red-600">
              Gagal memuat diagnosis
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Tidak ada diagnosis sesuai filter
              </p>
              {diagnoses.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Mulai dengan{" "}
                  <Link to="/scan" className="text-primary underline">
                    melakukan scan daun
                  </Link>
                  .
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((d) => (
                <Card key={d.id} className="h-full">
                  <CardContent className="flex gap-4 p-4 items-start">
                    <img
                      src={d.imageUrl}
                      alt="Daun"
                      className="h-24 w-24 rounded-md object-cover bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold truncate">
                            {d.disease?.commonName ?? "Diagnosis gagal"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {d.disease?.label ?? d.predictedDiseaseSlug}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <DiagnosisStatusBadge status={d.status} />
                          <RiskBadge level={d.disease?.riskLevel ?? "low"} />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(d.createdAt).toLocaleString("id-ID")}
                          {d.confidence !== null && (
                            <span className="ml-2">
                              • {(d.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/diagnoses/${d.id}`}
                          className="text-emerald-600 font-semibold text-sm shrink-0"
                        >
                          Lihat detail
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DiagnosesPage;
