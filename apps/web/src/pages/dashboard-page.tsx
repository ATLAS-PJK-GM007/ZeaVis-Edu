import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, History, Leaf, LayoutDashboard, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ManualClassificationForm } from '@/components/manual-classification-form';
import { RiskBadge } from '@/components/risk-badge';
import { useUiStore } from '@/store/ui-store';
import { apiClient } from '@/lib/api-client';

export function DashboardPage() {
  const { dashboardCompact, toggleDashboardCompact } = useUiStore();
  const queryClient = useQueryClient();

  const [diseasesQuery, summaryQuery, classificationsQuery] = useQueries({
    queries: [
      {
        queryKey: ['diseases'],
        queryFn: () => apiClient.getDiseases(),
      },
      {
        queryKey: ['dashboard-summary'],
        queryFn: () => apiClient.getDashboardSummary(),
      },
      {
        queryKey: ['manual-classifications'],
        queryFn: () => apiClient.getManualClassifications(),
      },
    ],
  });

  const createClassificationMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof apiClient.createManualClassification>[0]) => {
      await apiClient.createManualClassification(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['manual-classifications'] });
    },
  });

  const diseases = diseasesQuery.data || [];
  const summary = summaryQuery.data;
  const classifications = classificationsQuery.data || [];

  const isLoadingData = diseasesQuery.isLoading || summaryQuery.isLoading;
  const hasError = diseasesQuery.error || summaryQuery.error;

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </div>
            <h1 className="text-3xl font-bold tracking-tight">ZeaVis Edu Workspace</h1>
            <p className="text-muted-foreground">
              Pantau penyakit daun jagung dan laporkan pengamatan Anda
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={toggleDashboardCompact}>
              {dashboardCompact ? 'Mode Nyaman' : 'Mode Ringkas'}
            </Button>
            <Button asChild>
              <Link to="/">Kembali</Link>
            </Button>
          </div>
        </header>

        {isLoadingData && (
          <Card className="p-8 text-center text-muted-foreground">
            Memuat data dashboard...
          </Card>
        )}

        {hasError && (
          <Card className="p-8 text-center text-red-600">
            Gagal memuat data dashboard
          </Card>
        )}

        {!isLoadingData && !hasError && (
          <>
            {summary && (
              <section className={dashboardCompact ? 'grid gap-4 md:grid-cols-4' : 'grid gap-6 md:grid-cols-4'}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Penyakit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.diseaseCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Laporan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.classificationCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Risiko Tinggi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {summary.riskDistribution.high}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Risiko Sedang
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {summary.riskDistribution.medium}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            <section className={dashboardCompact ? 'grid gap-4 md:grid-cols-2' : 'grid gap-6 md:grid-cols-2'}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Katalog Penyakit
                  </CardTitle>
                  <CardDescription>
                    Pelajari tentang {diseases.length} penyakit daun jagung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to="/catalog">Buka Katalog</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Distribusi Risiko
                  </CardTitle>
                  <CardDescription>
                    Penyakit berdasarkan tingkat risiko
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Risiko Tinggi</span>
                        <span className="font-semibold">{summary.riskDistribution.high}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Risiko Sedang</span>
                        <span className="font-semibold">{summary.riskDistribution.medium}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Risiko Rendah</span>
                        <span className="font-semibold">{summary.riskDistribution.low}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {summary?.latestClassification && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Laporan Terbaru
                  </CardTitle>
                  <CardDescription>
                    Pengamatan penyakit terakhir yang dilaporkan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h4 className="font-semibold">{summary.latestClassification.disease.commonName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {summary.latestClassification.disease.label}
                        </p>
                      </div>
                      <RiskBadge level={summary.latestClassification.disease.riskLevel} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {summary.latestClassification.observation}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lokasi: {summary.latestClassification.location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(summary.latestClassification.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <ManualClassificationForm
              diseases={diseases}
              onSubmit={async (payload) => {
                await createClassificationMutation.mutateAsync(payload);
              }}
              isSubmitting={createClassificationMutation.isPending}
            />

            {classifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5" />
                    Riwayat Laporan
                  </CardTitle>
                  <CardDescription>
                    {classifications.length} laporan pengamatan penyakit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {classifications.slice(0, 5).map((classification) => (
                      <div key={classification.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="text-sm font-semibold">
                              {classification.disease.commonName}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {classification.disease.label}
                            </p>
                          </div>
                          <RiskBadge level={classification.disease.riskLevel} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {classification.observation}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {classification.location} • {new Date(classification.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
