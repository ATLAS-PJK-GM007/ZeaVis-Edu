import { Link } from 'react-router-dom';
import type { DiagnosisRecord } from '@zeavis/shared';
import { Card, CardContent } from '@/components/ui/card';
import { DiagnosisStatusBadge } from '@/components/diagnosis-status-badge';

export function DiagnosisCard({ diagnosis, expertLink = false }: { diagnosis: DiagnosisRecord; expertLink?: boolean }) {
  const href = expertLink ? `/expert/reviews?diagnosis=${diagnosis.id}` : `/diagnoses/${diagnosis.id}`;

  return (
    <Link to={href}>
      <Card className="transition hover:border-primary">
        <CardContent className="flex gap-4 p-4">
          <img src={diagnosis.imageUrl} alt="Daun jagung" className="h-24 w-24 rounded-lg object-cover" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{diagnosis.disease?.commonName ?? 'Diagnosis gagal'}</h3>
              <DiagnosisStatusBadge status={diagnosis.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {diagnosis.confidence === null ? 'Tidak ada confidence' : `Confidence ${(diagnosis.confidence * 100).toFixed(1)}%`}
            </p>
            <p className="text-xs text-muted-foreground">{new Date(diagnosis.createdAt).toLocaleString('id-ID')}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
