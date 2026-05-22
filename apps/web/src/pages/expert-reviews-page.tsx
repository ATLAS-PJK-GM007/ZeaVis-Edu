import { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import type { DiseaseSlug } from '@zeavis/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DiagnosisStatusBadge } from '@/components/diagnosis-status-badge';
import { apiClient } from '@/lib/api-client';

export function ExpertReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('diagnosis');
  const [verdict, setVerdict] = useState<'verified' | 'corrected'>('verified');
  const [correctedDiseaseSlug, setCorrectedDiseaseSlug] = useState<DiseaseSlug | ''>('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const [reviewsQuery, diseasesQuery] = useQueries({
    queries: [
      { queryKey: ['expert-reviews'], queryFn: () => apiClient.getExpertReviews() },
      { queryKey: ['diseases'], queryFn: () => apiClient.getDiseases() },
    ],
  });

  const reviews = reviewsQuery.data || [];
  const diseases = diseasesQuery.data || [];
  const selected = useMemo(() => reviews.find((item) => item.id === selectedId) ?? reviews[0] ?? null, [reviews, selectedId]);

  const mutation = useMutation({
    mutationFn: () => apiClient.reviewDiagnosis(selected!.id, {
      verdict,
      correctedDiseaseSlug: verdict === 'corrected' ? correctedDiseaseSlug || undefined : undefined,
      notes,
    }),
    onSuccess: () => {
      setNotes('');
      setVerdict('verified');
      setCorrectedDiseaseSlug('');
      queryClient.invalidateQueries({ queryKey: ['expert-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await mutation.mutateAsync();
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-6">
          <h1 className="text-2xl font-bold">Expert Reviews</h1>
          <Link to="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: List of reviews */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Diagnoses to Review</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{reviews.length}</span>
            </div>

            <div className="space-y-2">
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No diagnoses pending review</p>
              ) : (
                reviews.map((review) => (
                  <button
                    key={review.id}
                    onClick={() => setSearchParams({ diagnosis: review.id })}
                    className={`w-full text-left transition ${
                      selected?.id === review.id
                        ? 'ring-2 ring-primary'
                        : 'hover:border-primary'
                    }`}
                  >
                    <Card className="transition hover:border-primary">
                      <CardContent className="flex gap-3 p-3">
                        <img
                          src={review.imageUrl}
                          alt="Daun jagung"
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <h3 className="text-sm font-semibold">{review.disease?.commonName ?? 'Diagnosis gagal'}</h3>
                            <DiagnosisStatusBadge status={review.status} className="text-xs" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {review.confidence === null ? 'Tidak ada confidence' : `${(review.confidence * 100).toFixed(1)}%`}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Detail and form */}
          <div className="lg:col-span-2 space-y-6">
            {selected ? (
              <>
                {/* Detail card */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selected.disease?.commonName ?? 'Diagnosis gagal'}</CardTitle>
                    <CardDescription>
                      {new Date(selected.createdAt).toLocaleString('id-ID')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <img
                      src={selected.imageUrl}
                      alt="Daun jagung"
                      className="h-64 w-full rounded-lg object-cover"
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status</span>
                        <DiagnosisStatusBadge status={selected.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Confidence</span>
                        <span className="text-sm">
                          {selected.confidence === null ? 'N/A' : `${(selected.confidence * 100).toFixed(1)}%`}
                        </span>
                      </div>
                    </div>

                    {/* Top predictions */}
                    {selected.predictions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Top Predictions</h4>
                        <div className="space-y-1">
                          {selected.predictions.map((pred) => (
                            <div key={pred.id} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{pred.modelLabel}</span>
                              <span className="font-medium">{(pred.confidence * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Review form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Expert Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Verdict selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Verdict</label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="verdict"
                              value="verified"
                              checked={verdict === 'verified'}
                              onChange={(e) => setVerdict(e.target.value as 'verified' | 'corrected')}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Verified</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="verdict"
                              value="corrected"
                              checked={verdict === 'corrected'}
                              onChange={(e) => setVerdict(e.target.value as 'verified' | 'corrected')}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Corrected</span>
                          </label>
                        </div>
                      </div>

                      {/* Disease selection (only if corrected) */}
                      {verdict === 'corrected' && (
                        <div className="space-y-2">
                          <label htmlFor="disease" className="text-sm font-medium">
                            Correct Disease
                          </label>
                          <select
                            id="disease"
                            value={correctedDiseaseSlug}
                            onChange={(e) => setCorrectedDiseaseSlug(e.target.value as DiseaseSlug | '')}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Select a disease...</option>
                            {diseases.map((disease) => (
                              <option key={disease.slug} value={disease.slug}>
                                {disease.commonName}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="space-y-2">
                        <label htmlFor="notes" className="text-sm font-medium">
                          Notes <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Enter your review notes..."
                          required
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={4}
                        />
                      </div>

                      {/* Submit button */}
                      <Button
                        type="submit"
                        disabled={mutation.isPending || (verdict === 'corrected' && !correctedDiseaseSlug) || !notes.trim()}
                        className="w-full"
                      >
                        {mutation.isPending ? 'Submitting...' : 'Submit Review'}
                      </Button>

                      {mutation.isError && (
                        <p className="text-sm text-red-500">
                          Error: {mutation.error instanceof Error ? mutation.error.message : 'Unknown error'}
                        </p>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No diagnoses available for review
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
