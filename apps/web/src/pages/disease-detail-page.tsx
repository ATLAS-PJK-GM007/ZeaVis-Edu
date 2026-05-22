import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isDiseaseSlug } from '@zeavis/shared';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/risk-badge';
import { apiClient } from '@/lib/api-client';

export function DiseaseDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const validatedSlug = slug && isDiseaseSlug(slug) ? slug : null;

  const { data: disease, isLoading, error } = useQuery({
    queryKey: ['disease', slug],
    queryFn: () => apiClient.getDisease(validatedSlug!),
    enabled: validatedSlug !== null,
  });

  if (!validatedSlug || error || (!isLoading && !disease)) {
    return (
      <main className="min-h-screen px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <Button asChild variant="ghost" className="mb-8">
            <Link to="/catalog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Katalog
            </Link>
          </Button>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Materi tidak ditemukan</p>
          </Card>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <Button asChild variant="ghost" className="mb-8">
            <Link to="/catalog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Katalog
            </Link>
          </Button>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Memuat materi...</p>
          </Card>
        </div>
      </main>
    );
  }

  if (!disease) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link to="/catalog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Katalog
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <BookOpen className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{disease.commonName}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{disease.label}</p>
            </div>
            <RiskBadge level={disease.riskLevel} />
          </div>
          <p className="text-lg leading-relaxed">{disease.summary}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Deskripsi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-muted-foreground">{disease.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gejala</CardTitle>
            <CardDescription>Tanda-tanda yang perlu diperhatikan</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {disease.symptoms.map((symptom, index) => (
                <li key={index} className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                  <span className="text-muted-foreground">{symptom}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekomendasi Penanganan</CardTitle>
            <CardDescription>Langkah-langkah untuk mengendalikan penyakit</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {disease.recommendations.map((recommendation, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground pt-0.5">{recommendation}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button asChild className="flex-1">
            <Link to="/catalog">Lihat Katalog Lengkap</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
