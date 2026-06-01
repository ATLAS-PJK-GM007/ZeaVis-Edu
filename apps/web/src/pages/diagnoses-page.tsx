import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiagnosisStatusBadge } from "@/components/diagnosis-status-badge";
import { RiskBadge } from "@/components/risk-badge";
import { apiClient } from "@/lib/api-client";

export function DiagnosesPage() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "needs_review" | "verified" | "failed"
  >("all");
  const [riskFilter, setRiskFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");

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

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">
              Manajemen Diagnosis
            </p>
            <h1 className="text-3xl font-bold">Daftar Diagnosis</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-md border border-border bg-background px-2 py-1"
              >
                <option value="all">All</option>
                <option value="needs_review">Needs review</option>
                <option value="verified">Verified</option>
                <option value="failed">Failed</option>
              </select>

              <label className="text-sm font-medium">Risiko</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="rounded-md border border-border bg-background px-2 py-1"
              >
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <div className="ml-auto text-sm text-muted-foreground">
                Total: {filtered.length}
              </div>
            </div>

            {query.isLoading ? (
              <div className="p-6 text-center text-muted-foreground">
                Memuat diagnosis...
              </div>
            ) : query.isError ? (
              <div className="p-6 text-center text-red-600">
                Gagal memuat diagnosis
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Tidak ada diagnosis sesuai filter
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((d) => (
                  <Card key={d.id} className="h-full">
                    <CardContent className="flex gap-4 p-4 items-start">
                      <img
                        src={d.imageUrl}
                        alt="Daun"
                        className="h-24 w-24 rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {d.disease?.commonName ?? "Unknown"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {d.predictedDiseaseSlug ?? ""}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <DiagnosisStatusBadge status={d.status} />
                            <RiskBadge level={d.disease?.riskLevel ?? "low"} />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-4">
                          <div className="text-sm text-muted-foreground">
                            {new Date(d.createdAt).toLocaleString("id-ID")}
                          </div>
                          <Link
                            to={`/diagnoses/${d.id}`}
                            className="text-emerald-600 font-semibold"
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
    </main>
  );
}

export default DiagnosesPage;
