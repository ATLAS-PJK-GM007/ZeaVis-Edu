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
import type { DiagnosisRecord } from "@zeavis/shared";
import { apiClient } from "@/lib/api-client";
import { trackScan, trackDiagnosisResult } from "@/lib/telemetry";
import { DiagnosisResultView } from "../components/diagnose-result-view"; 

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
  const [diagnosisPreview, setDiagnosisPreview] = useState<DiagnosisRecord | null>(null);

  const diagnosesQuery = useQuery({
    queryKey: ["diagnoses"],
    queryFn: () => apiClient.getDiagnoses(),
    enabled: previewOpen,
  });

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800">Scan Tanaman</h1>
          <p className="text-gray-500 mt-1 text-md">
            Unggah foto daun jagung untuk dianalisis oleh sistem AI kami secara real-time.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/diagnoses">Riwayat Diagnosis</Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="w-full lg:h-117 py-3">
            <CardContent className="px-6 py-4 h-full flex flex-col">
              <div className="text-black flex items-center gap-2 mb-3 text-lg font-semibold">
                <Camera className="text-green-500" size={25} />
                Area Unggah Gambar
              </div>

              {!previewUrl ? (
                <div className="space-y-3">
                  <div
                    className="w-full border-2 border-dashed border-green-300 rounded-md p-10 h-60 text-center cursor-pointer"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="mx-auto text-green-500 mb-3" size={48} />
                    <h3 className="font-semibold text-base text-gray-800 mb-1">Seret & Lepas Foto Daun</h3>
                    <p className="text-xs text-gray-500 mb-3">atau klik untuk memilih file berkas dari perangkat Anda</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-xs font-medium">
                        <Check size={14} /> PNG, JPG, JPEG, WEBP
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-xs font-medium">
                        <Check size={14} /> Maks. 5 MB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload size={18} /> Pilih Berkas
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
                        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                      }}
                    />
                    {imageDimensions && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="absolute inset-0 bg-black/20" />
                        <div
                          className="relative flex items-center justify-center"
                          style={{
                            width: `${Math.min(imageDimensions.width * 0.7, 280)}px`,
                            height: `${Math.min(imageDimensions.height * 0.7, 320)}px`,
                          }}
                        >
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-lime-300" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-lime-300" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-lime-300" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-lime-300" />
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
                        <ImageOff className="mr-2 h-4 w-4" /> Ganti Foto
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
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {mutation.isError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <p className="font-medium">Upload gagal</p>
                  <p className="mt-1">
                    {mutation.error instanceof Error ? mutation.error.message : "Terjadi kesalahan saat memproses gambar"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Guidelines */}
        <aside className="lg:col-span-1 flex flex-col gap-5">
          <Card className="w-full h-max">
            <CardContent className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full">
                  <CircleAlert className="text-emerald-600" size={20} />
                </div>
                <h2 className="font-bold text-emerald-800">Panduan Pengambilan Foto</h2>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#ECF4E8] flex items-center justify-center shrink-0">
                    <ZoomIn className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-sm text-slate-700">Jarak 15–30 cm dari daun</div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#ECF4E8] flex items-center justify-center shrink-0">
                    <Sun className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-sm text-slate-700">Pencahayaan cukup merata</div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#ECF4E8] flex items-center justify-center shrink-0">
                    <AlignCenter className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-sm text-slate-700">Posisi daun mengisi bingkai dengan jelas</div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-[#ECF4E8] flex items-center justify-center shrink-0">
                    <Camera className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-sm text-slate-700">Hindari bayangan, pantulan, & blur</div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="w-full h-max">
            <CardContent className="px-6 py-4">
              <h3 className="font-bold text-emerald-800 flex items-center gap-3 mb-4">Persyaratan Berkas</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Format", value: "PNG, JPG, JPEG, WEBP" },
                  { label: "Ukuran Maks.", value: "5 MB" },
                  { label: "Resolusi Min.", value: "512 × 512 px" },
                  { label: "Objek Foto", value: "Daun jagung tunggal" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
                    <span className="text-gray-400 text-xs">{r.label}</span>
                    <span className="text-sm font-medium text-gray-700">{r.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Modal Preview Diagnosis */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setDiagnosisPreview(null);
        }}
        title="Hasil Analisis AI"
        size="lg"
        footer={
          diagnosisPreview && (
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewOpen(false);
                  setDiagnosisPreview(null);
                }}
              >
                Tutup Jendela
              </Button>
              <Button
                onClick={() => navigate(`/diagnoses/${diagnosisPreview.id}`)}
                className="bg-[#214B11] hover:bg-[#1a3a0d] text-white"
              >
                Masuk ke Halaman Riwayat
              </Button>
            </div>
          )
        }
      >
        {diagnosisPreview ? (
          <div className="space-y-6 p-1">
            
            {/* Warning if expert review is needed */}
            {diagnosisPreview.status === "needs_review" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
                <strong>Catatan:</strong> Hasil ini masih sementara karena tingkat keyakinan (confidence) di bawah standar minimum.
              </div>
            )}

            {/* Message if AI fails to process */}
            {diagnosisPreview.failureReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-sm">
                <strong>Gagal Memproses:</strong> {diagnosisPreview.failureReason}
              </div>
            )}

            <DiagnosisResultView 
              imageUrl={previewUrl || diagnosisPreview.imageUrl || "https://placehold.co/600x400?text=Foto+Daun"}
              confidence={diagnosisPreview.confidence ?? 0}
              diseaseName={diagnosisPreview.disease?.commonName ?? "Tidak Diketahui"}
              scientificName={diagnosisPreview.disease?.label ?? ""}
              riskLevel={diagnosisPreview.disease?.riskLevel ?? "Sedang"}
              description={diagnosisPreview.disease?.description ?? diagnosisPreview.disease?.summary ?? "Deskripsi tidak tersedia."}
              symptoms={diagnosisPreview.disease?.symptoms ?? []}
              preventions={diagnosisPreview.disease?.recommendations ?? []}
              medicines={(diagnosisPreview.disease as any)?.medicineRecommendations ?? []}
            />

            {/* All Model Predictions */}
            {diagnosisPreview.predictions && diagnosisPreview.predictions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 mt-4">
                <h4 className="font-bold text-[#214B11] mb-1">Semua Prediksi Model</h4>
                <p className="text-xs text-slate-500 mb-4">Tebakan alternatif lain dari sistem AI ZeaVis</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {diagnosisPreview.predictions
                    .sort((a, b) => a.rank - b.rank)
                    .map((pred) => (
                      <div
                        key={pred.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
                      >
                        <span className="text-slate-600 font-medium">{pred.modelLabel}</span>
                        <span className="font-bold text-slate-700">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}