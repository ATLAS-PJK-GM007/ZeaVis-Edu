import { useRef, useState } from 'react';
import type { ImageClassificationRecord } from '@zeavis/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/risk-badge';

export interface ImageClassificationFormProps {
  onSubmit: (file: File) => Promise<void>;
  isSubmitting: boolean;
  latestResult: ImageClassificationRecord | null;
}

export function ImageClassificationForm({
  onSubmit,
  isSubmitting,
  latestResult,
}: ImageClassificationFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Silakan pilih file gambar');
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError('Silakan pilih file gambar');
      return;
    }

    try {
      await onSubmit(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah gambar');
    }
  };

  const isFormValid = selectedFile !== null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Klasifikasi Gambar</CardTitle>
          <CardDescription>Unggah foto daun jagung untuk klasifikasi otomatis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
            )}

            <div>
              <label htmlFor="image-file" className="block text-sm font-medium">
                Pilih Gambar
              </label>
              <input
                ref={fileInputRef}
                id="image-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="mt-1 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-muted-foreground">
                  File dipilih: {selectedFile.name}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Mengunggah...' : 'Unggah dan Klasifikasi'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {latestResult && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Klasifikasi Terbaru</CardTitle>
            <CardDescription>Prediksi penyakit dari gambar terakhir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <img
                src={latestResult.imageUrl}
                alt="Uploaded corn leaf"
                className="w-full h-48 object-cover"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold">{latestResult.disease.commonName}</h4>
                  <p className="text-sm text-muted-foreground">{latestResult.disease.label}</p>
                </div>
                <RiskBadge level={latestResult.disease.riskLevel} />
              </div>

              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">
                  Kepercayaan: {(latestResult.confidence * 100).toFixed(1)}%
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Rekomendasi awal:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {latestResult.disease.recommendations.slice(0, 3).map((recommendation) => (
                    <li key={recommendation}>• {recommendation}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                {new Date(latestResult.createdAt).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
