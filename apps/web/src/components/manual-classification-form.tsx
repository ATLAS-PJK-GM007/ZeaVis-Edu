import { useEffect, useState } from 'react';
import type { DiseaseSlug, DiseaseCatalogItem, ManualClassificationRequest } from '@zeavis/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ManualClassificationFormProps {
  diseases: DiseaseCatalogItem[];
  onSubmit: (payload: ManualClassificationRequest) => Promise<void>;
  isSubmitting: boolean;
}

export function ManualClassificationForm({
  diseases,
  onSubmit,
  isSubmitting,
}: ManualClassificationFormProps) {
  const [selectedSlug, setSelectedSlug] = useState<DiseaseSlug | ''>('');
  const [observation, setObservation] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (diseases.length > 0 && !selectedSlug) {
      setSelectedSlug(diseases[0].slug);
    }
  }, [diseases, selectedSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSlug || !observation.trim() || !location.trim()) {
      setError('Semua field harus diisi');
      return;
    }

    try {
      await onSubmit({
        diseaseSlug: selectedSlug,
        observation: observation.trim(),
        location: location.trim(),
      });

      setObservation('');
      setLocation('');
      if (diseases.length > 0) {
        setSelectedSlug(diseases[0].slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim data');
    }
  };

  const isFormValid = selectedSlug && observation.trim() && location.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Klasifikasi Manual</CardTitle>
        <CardDescription>Laporkan penyakit daun jagung yang Anda temukan</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <div>
            <label htmlFor="disease" className="block text-sm font-medium">
              Jenis Penyakit
            </label>
            <select
              id="disease"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value as DiseaseSlug)}
              disabled={diseases.length === 0 || isSubmitting}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              {diseases.length === 0 ? (
                <option value="">Memuat penyakit...</option>
              ) : (
                diseases.map((disease) => (
                  <option key={disease.slug} value={disease.slug}>
                    {disease.commonName} ({disease.label})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="observation" className="block text-sm font-medium">
              Pengamatan
            </label>
            <textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Jelaskan gejala atau kondisi daun yang Anda amati..."
              disabled={isSubmitting}
              rows={4}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium">
              Lokasi
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lokasi penemuan penyakit (desa, kecamatan, kabupaten)"
              disabled={isSubmitting}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting || diseases.length === 0}
            className="w-full"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
