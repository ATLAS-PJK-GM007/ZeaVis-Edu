import { ArrowRight, Leaf, ShieldCheck, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Leaf,
    title: 'Deteksi penyakit daun jagung',
    description: 'Fondasi aplikasi siap untuk integrasi model klasifikasi ZeaVis Edu.',
  },
  {
    icon: ShieldCheck,
    title: 'Edukasi berbasis data',
    description: 'Materi dan hasil analisis dapat dikembangkan di atas dashboard awal.',
  },
  {
    icon: Sprout,
    title: 'Siap tumbuh bersama produk',
    description: 'Monorepo memisahkan frontend, backend, dan shared types dengan jelas.',
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            ZeaVis Edu
          </div>
          <Button asChild variant="ghost">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground">
              Platform edukasi kesehatan tanaman jagung
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
                Belajar mengenali penyakit daun jagung dengan alur digital yang rapi.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Scaffold ini menyiapkan fondasi aplikasi ZeaVis Edu untuk antarmuka edukasi,
                API, dan integrasi model machine learning berikutnya.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Buka Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="https://elysiajs.com" target="_blank" rel="noreferrer">
                  Lihat Stack API
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card/80 backdrop-blur">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="rounded-2xl bg-muted p-3 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="mt-2 leading-6">{feature.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
