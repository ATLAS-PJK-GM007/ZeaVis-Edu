import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import type { RiskLevel } from '@zeavis/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RiskBadge } from '@/components/risk-badge';
import { apiClient } from '@/lib/api-client';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRisk = searchParams.get('risk') as RiskLevel | null;

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>(initialRisk ?? 'all');

  // Sync URL params with state
  useEffect(() => {
    if (initialRisk && initialRisk !== riskFilter) {
      setRiskFilter(initialRisk);
    }
  }, [initialRisk]);

  const { data: diseases, isLoading, error } = useQuery({
    queryKey: ['diseases'],
    queryFn: () => apiClient.getDiseases(),
  });

  const filteredDiseases = (diseases || [])
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .filter((disease) => {
      const matchesSearch =
        disease.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.symptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRisk = riskFilter === 'all' || disease.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });

  return (
    <main className="min-h-screen px-6 py-8 bg-[#ECF4E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" className="p-2">
                <Link to="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <p className="text-sm font-medium text-primary">Edukasi Penyakit</p>
                <h1 className="text-3xl font-bold tracking-tight">Katalog Penyakit</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium mb-2">
              Cari penyakit
            </label>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="search"
                type="text"
                placeholder="Cari berdasarkan nama atau gejala..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-10 pr-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="risk-filter" className="block text-sm font-medium mb-2">
              Filter risiko
            </label>
            <select
              id="risk-filter"
              value={riskFilter}
              onChange={(e) => {
                const v = e.target.value as RiskLevel | 'all';
                setRiskFilter(v);
                const next = new URLSearchParams(searchParams);
                if (v === 'all') next.delete('risk');
                else next.set('risk', v);
                setSearchParams(next);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Risiko</option>
              <option value="low">Risiko Rendah</option>
              <option value="medium">Risiko Sedang</option>
              <option value="high">Risiko Tinggi</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <Card className="p-8 text-center text-muted-foreground">
            Memuat katalog...
          </Card>
        )}

        {error && (
          <Card className="p-8 text-center text-red-600">
            Katalog belum tersedia
          </Card>
        )}

        {!isLoading && !error && filteredDiseases.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Tidak ada penyakit yang cocok dengan filter ini.
          </Card>
        )}

        {!isLoading && !error && filteredDiseases.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredDiseases.map((disease) => (
              <Link
                key={disease.slug}
                to={`/catalog/${disease.slug}`}
                className="block transition-transform hover:scale-[1.03]"
              >
                <Card className="h-full rounded-2xl bg-white shadow-sm hover:shadow-md">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-[#214B11]">
                          {disease.commonName}
                        </h3>
                        <p className="text-sm text-slate-400 italic">
                          {disease.label}
                        </p>
                      </div>
                      <RiskBadge level={disease.riskLevel} />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {disease.summary}
                    </p>

                    {disease.symptoms.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                          Gejala:
                        </h4>
                        <ul className="space-y-1">
                          {disease.symptoms.slice(0, 2).map((symptom, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>
                              {symptom}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: disease.accentColor }}
                      />
                      <span className="text-xs text-primary font-medium">
                        Lihat detail →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
