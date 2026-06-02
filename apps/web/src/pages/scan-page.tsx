import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Modal } from "@/components/ui/modal";
import type { DiagnosisRecord } from "@zeavis/shared";

export function ScanPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (file: File) => apiClient.createDiagnosis(file),
    onSuccess: (diagnosis) => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      // show preview modal instead of immediate navigation
      setDiagnosisPreview(diagnosis);
      setPreviewOpen(true);
    },
  });

  const handleFile = (f?: File) => {
    if (!f) return;
    setFileName(f.name);
    mutation.mutate(f);
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
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Scan Tanaman</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-lg shadow">
          <button
            type="button"
            className="w-full border-2 border-dashed border-green-300 rounded-md p-8 text-center cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <div className="text-green-600">Area Unggah Gambar</div>
            <div className="mt-4 text-sm text-muted-foreground">
              Seret & Lepas atau klik untuk memilih file (PNG/JPG, maks 5MB)
            </div>
            {fileName && (
              <div className="mt-3 text-sm">Dipilih: {fileName}</div>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="mt-6 flex items-center gap-3">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md"
              onClick={() => inputRef.current?.click()}
            >
              Pilih Berkas
            </button>
            {mutation.isPending && (
              <div className="text-sm text-muted-foreground">Mengunggah...</div>
            )}
            {mutation.isError && (
              <div className="text-sm text-red-600">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : String(mutation.error) || "Upload gagal"}
              </div>
            )}
          </div>
        </div>
        <aside className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-medium mb-2">Panduan Pengambilan Foto</h2>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>Jarak 15–30 cm dari daun</li>
            <li>Pencahayaan cukup, hindari blur</li>
            <li>Daun memenuhi bingkai</li>
          </ul>
        </aside>
      </div>
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setDiagnosisPreview(null);
        }}
        title={diagnosisPreview?.predictedDiseaseSlug ?? "Hasil Diagnosis"}
        size="sm"
        footer={
          diagnosisPreview && (
            <div className="flex items-center justify-end gap-3">
              <button
                className="px-3 py-2 rounded bg-green-600 text-white text-sm"
                onClick={() => navigate(`/diagnoses/${diagnosisPreview.id}`)}
              >
                Lihat detail
              </button>
              <button
                className="px-3 py-2 rounded bg-gray-200 text-sm"
                onClick={() => {
                  setPreviewOpen(false);
                  setDiagnosisPreview(null);
                }}
              >
                Tutup
              </button>
            </div>
          )
        }
      >
        {diagnosisPreview ? (
          <div className="grid grid-cols-1 gap-4">
            {diagnosisPreview.imageUrl && (
              <img
                src={diagnosisPreview.imageUrl}
                alt="hasil"
                className="w-full rounded-md object-cover"
              />
            )}
            <div>
              <p className="text-sm text-muted-foreground">
                Prediksi:{" "}
                <strong>{diagnosisPreview.predictedDiseaseSlug}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Confidence:{" "}
                <strong>
                  {Math.round((diagnosisPreview.confidence ?? 0) * 100)}%
                </strong>
              </p>
            </div>
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">
                Daftar Diagnosis Terbaru
              </h4>
              {diagnosesQuery.isLoading && (
                <div className="text-sm text-muted-foreground">
                  Memuat daftar...
                </div>
              )}
              {diagnosesQuery.isError && (
                <div className="text-sm text-red-600">
                  Gagal memuat daftar diagnosis
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
                          className="h-10 w-10 rounded object-cover"
                        />
                        <div className="text-sm">
                          <div className="font-medium">
                            {d.disease?.commonName ?? d.predictedDiseaseSlug}
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
