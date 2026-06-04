import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { DiagnosisStatusBadge } from "@/components/diagnosis-status-badge";
import type { DiagnosisRecord } from "@zeavis/shared";
import { apiClient } from "@/lib/api-client";
import {
  AlignCenter,
  Camera,
  Check,
  CircleAlert,
  Sun,
  Upload,
  ZoomIn,
} from "lucide-react";

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

  const getUploadErrorMessage = (error: unknown): string => {
    let raw = "";
    let source: string | undefined;

    if (error instanceof Error) {
      raw = error.message;
      // Check if error has source property from our ApiError
      source = (error as any).source;
    } else if (typeof error === "string") {
      raw = error;
    }

    // Distinguish between uploader service down vs model service down
    if (raw.includes("HTTP 502")) {
      if (source === "uploader") {
        return "Layanan penyimpanan gambar sedang down. Hubungi administrator.";
      }
      if (source === "model-service") {
        return "Layanan AI model sedang down. Hubungi administrator.";
      }
      return "Layanan backend sedang bermasalah (502). Silakan coba lagi.";
    }

    if (raw.includes("Failed to fetch")) {
      return "Koneksi ke server gagal. Pastikan API dan koneksi jaringan aktif.";
    }

    if (raw.includes("Upload service error")) {
      return "Layanan penyimpanan gambar sedang bermasalah. Coba beberapa saat lagi.";
    }

    if (raw.includes("Model service error")) {
      return "Layanan AI model sedang bermasalah. Coba beberapa saat lagi.";
    }

    if (raw.includes("File type is not allowed")) {
      return "Format file tidak didukung. Gunakan PNG, JPG, atau JPEG.";
    }

    if (raw.includes("File must be smaller")) {
      return "Ukuran file terlalu besar. Maksimal 5 MB.";
    }

    if (raw.includes("File is empty")) {
      return "File kosong. Silakan pilih file gambar yang valid.";
    }

    return raw || "Upload gagal. Silakan coba lagi.";
  };

  return (
    <main className="max-w-6xl mx-auto flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-emerald-800">Scan Tanaman</h1>
        <p className="text-gray-500 mt-1" text-sm>
          Unggah foto daun jagung untuk dianalisis oleh sistem AI kami secara
          real-time.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Sidebar */}
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow h-fit">
          <div className="text-black flex items-center gap-2 mb-3 text-lg font-semibold">
            <Camera className="text-green-500" size={25} />
            Area Unggah Gambar
          </div>

          <button
            type="button"
            className="w-full border-2 border-dashed border-green-300 rounded-md p-6 h-80 text-center cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <Upload
              className="mx-auto text-green-500 bg-[#ECF4E8] p-3 rounded-lg"
              size={60}
            />
            <div className="mt-2 text-muted-foreground">
              <h3 className="font-semibold text-base pb-1">
                Seret & Lepas Foto Daun
              </h3>
              <p className="text-xs pb-2">
                atau klik untuk memilih file berkas dari perangkat Anda
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                <div className="bg-[#ECF4E8] p-1.5 rounded-lg inline-flex items-center gap-1">
                  <Check className="text-green-500" size={14} />
                  <span className="text-xs">PNG, JPG, JPEG</span>
                </div>
                <div className="bg-[#ECF4E8] p-1.5 rounded-lg inline-flex items-center gap-1">
                  <Check className="text-green-500" size={14} />
                  <span className="text-xs">Maks. 5MB</span>
                </div>
              </div>
            </div>
            {fileName && (
              <div className="mt-2 text-xs text-slate-600">
                Dipilih: {fileName}
              </div>
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <div className="mt-3 flex flex-col gap-2">
            <button
              className="w-full bg-green-600 text-white px-4 py-2.5 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer text-sm font-medium"
              onClick={() => inputRef.current?.click()}
            >
              Pilih Berkas
            </button>
            {mutation.isPending && (
              <div className="text-xs text-muted-foreground text-center">
                Mengunggah...
              </div>
            )}
            {mutation.isError && (
              <div className="text-xs text-red-600 text-center">
                {getUploadErrorMessage(mutation.error)}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-5">
          {/* Card 1: Panduan Pengambilan Foto */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full">
                <CircleAlert className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-md font-bold text-emerald-800">
                Panduan Pengambilan Foto
              </h2>
            </div>

            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <ZoomIn className="text-emerald-600" size={18} />
                </div>
                <div className="text-sm text-slate-700">
                  Jarak 15–30 cm dari daun
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Sun className="text-emerald-600" size={18} />
                </div>
                <div className="text-sm text-slate-700">
                  Pencahayaan cukup merata
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <AlignCenter className="text-emerald-600" size={18} />
                </div>
                <div className="text-sm text-slate-700">
                  Posisi daun mengisi bingkai dengan jelas
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Camera className="text-emerald-600" size={18} />
                </div>
                <div className="text-sm text-slate-700">
                  Hindari bayangan atau pantulan pada daun & blur pada gambar
                </div>
              </li>
            </ul>

            <div className="mt-4">
              <div className="rounded-lg overflow-hidden mt-4">
                <div className="relative h-36 overflow-hidden bg-[url('/src/assets/images/scan-guide-bg.png')] bg-cover bg-center text-white md:h-44">
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute inset-0 bg-linear-to-b from-black/5 via-transparent to-black/35" />
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 text-center">
                    <div className="relative flex h-full w-30 items-center justify-center mt-8">
                      <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-l-lime-300 border-t-lime-300" />
                      <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-r-lime-300 border-t-lime-300" />
                      <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-b-lime-300 border-l-lime-300" />
                      <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-b-lime-300 border-r-lime-300" />
                      <span className="relative z-10 text-xs font-semibold tracking-[0.28em] text-white">
                        AREA SCAN
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-lime-100 bg-black/30 w-full py-1 rounded">
                      Posisi ideal: daun memenuhi bingkai
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Persyaratan Berkas */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-md font-bold text-emerald-800 flex items-center gap-3 mb-4">
              Persyaratan Berkas
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "Format", value: "PNG, JPG, JPEG" },
                { label: "Ukuran Maks.", value: "5 MB" },
                { label: "Resolusi Min.", value: "512 × 512 px" },
                { label: "Objek Foto", value: "Daun jagung tunggal" },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5"
                  style={{ borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}
                >
                  <span
                    className="text-gray-400"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {r.label}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Section */}
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
    </main>
  );
}
