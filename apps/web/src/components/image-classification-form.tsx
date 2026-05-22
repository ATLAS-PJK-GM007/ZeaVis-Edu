import { ChangeEvent, FormEvent, useRef, useState, useEffect } from 'react';
import type { DiagnosisRecord } from '@zeavis/shared';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DiagnosisStatusBadge } from '@/components/diagnosis-status-badge';

type ImageClassificationFormProps = {
  onSubmit: (file: File) => Promise<void>;
  isSubmitting: boolean;
  latestResult: DiagnosisRecord | null;
};

export function ImageClassificationForm({
  onSubmit,
  isSubmitting,
  latestResult,
}: ImageClassificationFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Revoke object URL on component unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setError(null);
    setFile(selectedFile);

    // Revoke previous preview URL before replacing it
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError('Pilih gambar terlebih dahulu');
      return;
    }

    try {
      await onSubmit(file);

      // Revoke current preview URL after successful submit before setting null
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim gambar');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" /> Diagnosis Gambar
        </CardTitle>
        <CardDescription>
          Upload gambar daun jagung untuk klasifikasi AI dan review pakar jika confidence rendah.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="image-file" className="block text-sm font-medium">
              Pilih Gambar
            </label>
            <input
              ref={fileInputRef}
              id="image-file"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="mt-1 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
            />
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                File dipilih: {file.name}
              </p>
            )}
          </div>

          {previewUrl && (
            <img src={previewUrl} alt="Pratinjau gambar daun jagung untuk diagnosis" className="h-48 rounded-lg object-cover" />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Memproses...' : 'Upload dan Diagnosis'}
          </Button>
        </form>

        {latestResult && (
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-semibold">
                {latestResult.disease?.commonName ?? 'Diagnosis gagal'}
              </h3>
              <DiagnosisStatusBadge status={latestResult.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {latestResult.confidence === null
                ? 'Tidak ada confidence'
                : `Confidence ${(latestResult.confidence * 100).toFixed(1)}%`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
