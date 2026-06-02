import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Camera, Upload, X, CheckCircle, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { DiagnosisStatusBadge } from "@/components/diagnosis-status-badge";
import type { DiagnosisRecord } from "@zeavis/shared";
import { apiClient } from "@/lib/api-client";

export function ScanPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (file: File) => apiClient.createDiagnosis(file),
    onSuccess: (diagnosis) => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      setDiagnosisPreview(diagnosis);
      setPreviewOpen(true);
      setFileName(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  const handleFile = (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("Ukuran file melebihi batas 5MB");
      return;
    }
    setFileName(f.name);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleUpload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    mutation.mutate(file);
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [diagnosisPreview, setDiagnosisPreview] =
    useState<DiagnosisRecord | null>(null);

  const diagnosesQuery = useQuery({
    queryKey: ["diagnoses"],
    queryFn: () => apiClient.getDiagnoses(),
    enabled: previewOpen,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Deteksi Penyakit</p>
          <h1 className="text-3xl font-bold">Scan Tanaman</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/diagnoses">Riwayat Diagnosis</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              {/* Upload area */}
              {!previewUrl ? (
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-green-300 rounded-xl p-12 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-colors group"
                  onClick={() => inputRef.current?.click()}
                >
                  <Camera className="mx-auto h-12 w-12 text-green-400 group-hover:text-green-500 transition-colors" />
                  <div className="mt-4 text-green-600 text-lg font-medium">
                    Unggah Gambar Daun
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Seret & Lepas atau klik untuk memilih file (PNG/JPG, maks 5MB)
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-muted">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-80 object-contain"
                    />
                    <button
                      type="button"
                      className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                      onClick={() => {
                        setPreviewUrl(null);
                        setFileName(null);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      File: <span className="font-medium">{fileName}</span>
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPreviewUrl(null);
                          setFileName(null);
                          if (inputRef.current) inputRef.current.value = "";
                        }}
                      >
                        <ImageOff className="mr-2 h-4 w-4" />
                        Ganti Foto
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={mutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {mutation.isPending ? "Memproses..." : "Analisis"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {/* Error state */}
              {mutation.isError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <p className="font-medium">Upload gagal</p>
                  <p className="mt-1">
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : "Terjadi kesalahan saat memproses gambar"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="font-medium mb-3">Panduan Pengambilan Foto</h2>
              <ul className="text-sm space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  Jarak 15–30 cm dari daun
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  Pencahayaan cukup, hindari blur
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  Daun memenuhi bingkai
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  Hindari bayangan dan background berantakan
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Result Modal */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setDiagnosisPreview(null);
        }}
        title={diagnosisPreview?.disease?.commonName ?? "Hasil Diagnosis"}
        size="md"
        footer={
          diagnosisPreview && (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewOpen(false);
                  setDiagnosisPreview(null);
                }}
              >
                Tutup
              </Button>
              <Button
                onClick={() => navigate(`/diagnoses/${diagnosisPreview.id}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                Lihat Detail Lengkap
              </Button>
            </div>
          )
        }
      >
        {diagnosisPreview ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DiagnosisStatusBadge status={diagnosisPreview.status} />
              {diagnosisPreview.confidence !== null && (
                <span className="text-sm font-medium">
                  Confidence: {(diagnosisPreview.confidence * 100).toFixed(1)}%
                </span>
              )}
            </div>

            {diagnosisPreview.disease && (
              <div>
                <h3 className="font-semibold text-lg">
                  {diagnosisPreview.disease.commonName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {diagnosisPreview.disease.summary}
                </p>
              </div>
            )}

            {diagnosisPreview.failureReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {diagnosisPreview.failureReason}
              </div>
            )}

            {diagnosisPreview.predictions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Semua Prediksi</h4>
                <div className="space-y-2">
                  {diagnosisPreview.predictions
                    .sort((a, b) => a.rank - b.rank)
                    .map((pred) => (
                      <div
                        key={pred.id}
                        className="flex items-center justify-between rounded-lg border p-2 text-sm"
                      >
                        <span>{pred.modelLabel}</span>
                        <span className="font-semibold">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">
                Riwayat Diagnosis Terbaru
              </h4>
              {diagnosesQuery.isLoading && (
                <div className="text-sm text-muted-foreground">
                  Memuat riwayat...
                </div>
              )}
              {!diagnosesQuery.isLoading && !diagnosesQuery.isError && (
                <div className="space-y-2">
                  {(diagnosesQuery.data ?? [])
                    .slice(0, 5)
                    .map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={d.imageUrl}
                            alt="thumb"
                            className="h-10 w-10 rounded object-cover bg-muted"
                          />
                          <div className="text-sm">
                            <div className="font-medium">
                              {d.disease?.commonName ?? "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(d.createdAt).toLocaleString("id-ID")}
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/diagnoses/${d.id}`}
                          className="text-emerald-600 text-sm font-semibold"
                        >
                          Lihat
                        </Link>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
