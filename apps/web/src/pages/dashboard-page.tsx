import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, History, LayoutDashboard, TrendingUp, LogOut, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ManualClassificationForm } from '@/components/manual-classification-form';
import { ImageClassificationForm } from '@/components/image-classification-form';
import { DiagnosisCard } from '@/components/diagnosis-card';
import { useAuthStore } from '@/store/auth-store';
import { useUiStore } from '@/store/ui-store';
import { apiClient } from '@/lib/api-client';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { dashboardCompact, toggleDashboardCompact } = useUiStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [diseasesQuery, summaryQuery, diagnosesQuery, classificationsQuery] = useQueries({
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
        queryKey: ['diagnoses'],
        queryFn: () => apiClient.getDiagnoses(),
      },
      {
        queryKey: ['manual-classifications'],
        queryFn: () => apiClient.getManualClassifications(),
      },
    ],
  });

  const createDiagnosisMutation = useMutation({
    mutationFn: async (file: File) => {
      return await apiClient.createDiagnosis(file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.logout();
    },
    onSuccess: () => {
      useAuthStore.setState({ user: null });
      queryClient.clear();
      navigate('/login');
    },
  });

  const diseases = diseasesQuery.data || [];
  const summary = summaryQuery.data;
  const diagnoses = diagnosesQuery.data || [];
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
              {user?.name ? `Selamat datang, ${user.name}` : 'Pantau penyakit daun jagung dan laporkan pengamatan Anda'}
            </p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'expert' && (
              <Button asChild variant="outline">
                <Link to="/expert/reviews">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Review Pakar
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={toggleDashboardCompact}>
              {dashboardCompact ? 'Mode Nyaman' : 'Mode Ringkas'}
            </Button>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? 'Keluar...' : 'Keluar'}
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
                      Total Diagnosis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.imageClassificationCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Menunggu Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">
                      {summary.needsReviewCount}
                    </div>
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

            <ImageClassificationForm
              onSubmit={async (file) => {
                await createDiagnosisMutation.mutateAsync(file);
              }}
              isSubmitting={createDiagnosisMutation.isPending}
              latestResult={diagnoses[0] ?? null}
            />

            <ManualClassificationForm
              diseases={diseases}
              onSubmit={async (payload) => {
                await createClassificationMutation.mutateAsync(payload);
              }}
              isSubmitting={createClassificationMutation.isPending}
            />

            {diagnoses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Riwayat Diagnosis
                  </CardTitle>
                  <CardDescription>
                    {diagnoses.length} diagnosis yang telah dibuat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {diagnoses.slice(0, 6).map((diagnosis) => (
                      <DiagnosisCard key={diagnosis.id} diagnosis={diagnosis} />
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
