import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { DiagnosisResultView } from "../components/diagnose-result-view";
import { diseaseCatalogSeed } from "@zeavis/shared"; // Pastikan jalur import ini benar

export function DiagnosisDetailPage() {
  const { id } = useParams();

  // Scroll to top when diagnosis ID changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [id]);

  const query = useQuery({
    queryKey: ["diagnosis", id],
    queryFn: () => apiClient.getDiagnosis(id!),
    enabled: Boolean(id),
  });

  if (query.isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat diagnosis...
      </div>
    );
  if (query.error || !query.data)
    return (
      <div className="p-8 text-center text-red-600">
        Diagnosis tidak ditemukan
      </div>
    );

  const diagnosis = query.data;

  // Fallback logic for image and medicine recommendations
  const finalImageUrl =
    diagnosis.imageUrl || "/src/assets/images/placeholder-image.png";

  const seedData = diagnosis.disease
    ? diseaseCatalogSeed.find(
        (seed) => seed.commonName === diagnosis.disease?.commonName,
      )
    : null;

  const finalMedicines =
    (diagnosis.disease as any)?.medicineRecommendations ||
    seedData?.medicineRecommendations ||
    [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#214B11]">
            Analisis & Modul Edukasi
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Hasil deteksi AI dan panduan edukasi
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-[#214B11] text-[#214B11] hover:bg-[#214B11] hover:text-white"
        >
          <Link to="/diagnoses">Kembali ke Riwayat</Link>
        </Button>
      </div>

      {diagnosis.status === "needs_review" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          <strong>Catatan:</strong> Hasil ini masih sementara karena tingkat
          keyakinan (confidence) di bawah standar minimum.
        </div>
      )}

      {diagnosis.failureReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-sm">
          <strong>Gagal Memproses:</strong> {diagnosis.failureReason}
        </div>
      )}

      <DiagnosisResultView
        imageUrl={finalImageUrl}
        confidence={diagnosis.confidence ?? 0}
        diseaseName={diagnosis.disease?.commonName ?? "Tidak Diketahui"}
        scientificName={diagnosis.disease?.label ?? ""}
        riskLevel={diagnosis.disease?.riskLevel ?? "Sedang"}
        description={
          diagnosis.disease?.description ??
          diagnosis.disease?.summary ??
          "Deskripsi tidak tersedia."
        }
        symptoms={diagnosis.disease?.symptoms ?? []}
        preventions={diagnosis.disease?.recommendations ?? []}
        medicines={finalMedicines}
      />

      {diagnosis.predictions && diagnosis.predictions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 mt-4">
          <h4 className="font-bold text-[#214B11] mb-1">
            Semua Prediksi Model
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Tebakan alternatif lain dari sistem AI ZeaVis
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {diagnosis.predictions
              .sort((a, b) => a.rank - b.rank)
              .map((pred) => (
                <div
                  key={pred.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
                >
                  <span className="text-slate-600 font-medium">
                    {pred.modelLabel}
                  </span>
                  <span className="font-bold text-slate-700">
                    {(pred.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Expert Review Section */}
      {diagnosis.latestReview && (
        <Card className="rounded-2xl shadow-sm border-blue-200 bg-blue-50/50 mt-4">
          <CardHeader>
            <CardTitle className="text-blue-800">
              Catatan Pakar Agronomi
            </CardTitle>
            <CardDescription className="text-blue-600/70">
              Ditinjau oleh: {diagnosis.latestReview.expert.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
              "{diagnosis.latestReview.notes}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
