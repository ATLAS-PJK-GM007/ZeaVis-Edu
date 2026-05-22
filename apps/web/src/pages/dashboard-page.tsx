import { BookOpen, History, Leaf, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUiStore } from '@/store/ui-store';

const dashboardCards = [
  {
    icon: Leaf,
    title: 'Deteksi Penyakit',
    description: 'Area ini akan menjadi pintu masuk analisis gambar daun jagung.',
  },
  {
    icon: History,
    title: 'Riwayat Analisis',
    description: 'Hasil deteksi sebelumnya akan ditampilkan saat fitur data tersedia.',
  },
  {
    icon: BookOpen,
    title: 'Materi Edukasi',
    description: 'Konten edukasi penyakit jagung akan terhubung ke modul pembelajaran.',
  },
];

export function DashboardPage() {
  const { dashboardCompact, toggleDashboardCompact } = useUiStore();

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
              Placeholder awal untuk fitur deteksi, riwayat analisis, dan edukasi.
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

        <section className={dashboardCompact ? 'grid gap-4 md:grid-cols-3' : 'grid gap-6 md:grid-cols-3'}>
          {dashboardCards.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription className="leading-6">{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Belum ada data. Fitur akan dihubungkan pada iterasi berikutnya.
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
