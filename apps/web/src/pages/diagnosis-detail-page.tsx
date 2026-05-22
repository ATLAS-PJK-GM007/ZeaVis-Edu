import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DiagnosisStatusBadge } from '@/components/diagnosis-status-badge';
import { RiskBadge } from '@/components/risk-badge';
import { apiClient } from '@/lib/api-client';

export function DiagnosisDetailPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ['diagnosis', id],
    queryFn: () => apiClient.getDiagnosis(id!),
    enabled: Boolean(id),
  });

  if (query.isLoading) return <main className="p-8 text-center text-muted-foreground">Memuat diagnosis...</main>;
  if (query.error || !query.data) return <main className="p-8 text-center text-red-600">Diagnosis tidak ditemukan</main>;

  const diagnosis = query.data;

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Detail Diagnosis</p>
            <h1 className="text-3xl font-bold">{diagnosis.disease?.commonName ?? 'Diagnosis gagal'}</h1>
          </div>
          <Button asChild variant="outline"><Link to="/dashboard">Kembali</Link></Button>
        </div>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card>
            <CardContent className="p-4">
              <img src={diagnosis.imageUrl} alt="Daun jagung" className="w-full rounded-xl object-cover" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Hasil AI</CardTitle>
                <DiagnosisStatusBadge status={diagnosis.status} />
              </div>
              <CardDescription>
                {diagnosis.confidence === null ? 'Model gagal memproses gambar.' : `Confidence ${(diagnosis.confidence * 100).toFixed(1)}%`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {diagnosis.status === 'needs_review' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Hasil ini masih sementara karena confidence di bawah 70% dan sedang menunggu review pakar.
                </div>
              )}
              {diagnosis.failureReason && <p className="text-sm text-red-600">{diagnosis.failureReason}</p>}
              {diagnosis.disease && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{diagnosis.disease.label}</h2>
                    <RiskBadge level={diagnosis.disease.riskLevel} />
                  </div>
                  <p className="text-muted-foreground">{diagnosis.disease.summary}</p>
                  <div>
                    <h3 className="font-semibold">Rekomendasi</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {diagnosis.disease.recommendations.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Top Predictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {diagnosis.predictions.map((prediction) => (
              <div key={prediction.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span>{prediction.rank}. {prediction.modelLabel}</span>
                <span className="font-semibold">{(prediction.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {diagnosis.latestReview && (
          <Card>
            <CardHeader>
              <CardTitle>Catatan Pakar</CardTitle>
              <CardDescription>{diagnosis.latestReview.expert.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{diagnosis.latestReview.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
