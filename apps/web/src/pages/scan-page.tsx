import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Camera,
  Upload,
  X,
  ImageOff,
  CircleAlert,
  ZoomIn,
  Sun,
  AlignCenter,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { DiagnosisStatusBadge } from "@/components/diagnosis-status-badge";
import type { DiagnosisRecord } from "@zeavis/shared";
import { apiClient } from "@/lib/api-client";
import { trackScan, trackDiagnosisResult } from "@/lib/telemetry";

export function ScanPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (file: File) => apiClient.createDiagnosis(file),
    onSuccess: (diagnosis) => {
      trackDiagnosisResult(diagnosis.status !== "failed");
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      setDiagnosisPreview(diagnosis);
      setPreviewOpen(true);
      setFileName(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: () => {
      trackDiagnosisResult(false);
    },
  });

  const handleFile = (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("Ukuran file melebihi batas 5MB");
      return;
    }
    setFileName(f.name);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    // Detect image dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = url;
  };

  const handleUpload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    trackScan();
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800">Scan Tanaman</h1>
          <p className="text-gray-500 mt-1 text-md">
            Unggah foto daun jagung untuk dianalisis oleh sistem AI kami secara
            real-time.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/diagnoses">Riwayat Diagnosis</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="w-full lg:h-117 py-3">
            <CardContent className="px-6 py-4 h-full flex flex-col">
              {/* Left Sidebar */}
              <div className="text-black flex items-center gap-2 mb-3 text-lg font-semibold">
                <Camera className="text-green-500" size={25} />
                Area Unggah Gambar
              </div>

              {/* Upload area */}
              {!previewUrl ? (
                <div className="space-y-3">
                  <div
                    className="w-full border-2 border-dashed border-green-300 rounded-md p-10 h-60 text-center cursor-pointer"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="mx-auto text-green-500 mb-3" size={48} />
                    <h3 className="font-semibold text-base text-gray-800 mb-1">
                      Seret & Lepas Foto Daun
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      atau klik untuk memilih file berkas dari perangkat Anda
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-xs font-medium">
                        <Check size={14} />
                        PNG, JPG, JPEG
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-xs font-medium">
                        <Check size={14} />
                        Maks. 5 MB
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload size={18} />
                    Pilih Berkas
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-muted w-full">
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-80 object-contain"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setImageDimensions({
                          width: img.naturalWidth,
                          height: img.naturalHeight,
                        });
                      }}
                    />
                    {/* Scanner area detection overlay */}
                    {imageDimensions && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Outer dark overlay */}
                        <div className="absolute inset-0 bg-black/20" />

                        {/* Scan area frame - responsive to image */}
                        <div
                          className="relative flex items-center justify-center"
                          style={{
                            width: `${Math.min(imageDimensions.width * 0.7, 280)}px`,
                            height: `${Math.min(imageDimensions.height * 0.7, 320)}px`,
                          }}
                        >
                          {/* Corner markers */}
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-lime-300" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-lime-300" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-lime-300" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-lime-300" />

                          {/* Center text */}
                          <div className="text-white text-center flex flex-col gap-1">
                            <span className="text-xs font-semibold tracking-widest">AREA SCAN</span>
                            <span className="text-[10px] text-lime-200 font-medium">
                              {imageDimensions.width} × {imageDimensions.height}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors z-10"
                      onClick={() => {
                        setPreviewUrl(null);
                        setFileName(null);
                        setImageDimensions(null);
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
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPreviewUrl(null);
                          setFileName(null);
                          setImageDimensions(null);
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

        {/* Right Sidebar */}
        <aside className="lg:col-span-1 flex flex-col gap-5">
          {/* Card 1: Panduan Pengambilan Foto */}
          <Card className="w-full h-max">
            <CardContent className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full">
                  <CircleAlert className="text-emerald-600" size={20} />
                </div>
                <h2 className="font-bold text-emerald-800">
                  Panduan Pengambilan Foto
                </h2>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#ECF4E8] flex items-center justify-center shrink-0">
                    <ZoomIn className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-sm text-slate-700">
                    Jarak 15–30 cm dari daun
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#ECF4E8] flex items-center justify-center shrink-0">
                    <Sun className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-sm text-slate-700">
                    Pencahayaan cukup merata
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#ECF4E8] flex items-center justify-center shrink-0">
                    <AlignCenter className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-sm text-slate-700">
                    Posisi daun mengisi bingkai dengan jelas
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#ECF4E8] flex items-center justify-center shrink-0">
                    <Camera className="text-emerald-600" size={20} />
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
            </CardContent>
          </Card>

          {/* Card 2: Persyaratan Berkas */}
          <Card className="w-full h-max">
            <CardContent className="px-6 py-4">
              <h3 className="font-bold text-emerald-800 flex items-center gap-3 mb-4">
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
                    style={{
                      borderBottom: i < 3 ? "1px solid #f0f0f0" : "none",
                    }}
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
                  {(diagnosesQuery.data ?? []).slice(0, 5).map((d) => (
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
