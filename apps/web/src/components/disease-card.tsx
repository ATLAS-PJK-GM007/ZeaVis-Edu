import { Link } from 'react-router-dom';
import type { DiseaseCatalogItem } from '@zeavis/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/risk-badge';

export interface DiseaseCardProps {
  disease: DiseaseCatalogItem;
}

export function DiseaseCard({ disease }: DiseaseCardProps) {
  const firstTwoSymptoms = disease.symptoms.slice(0, 2);

  return (
    <Link to={`/catalog/${disease.slug}`} className="block transition-transform hover:scale-105">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl">{disease.commonName}</CardTitle>
              <CardDescription className="mt-1">{disease.label}</CardDescription>
            </div>
            <RiskBadge level={disease.riskLevel} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{disease.summary}</p>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Gejala:</h4>
            <ul className="space-y-1">
              {firstTwoSymptoms.map((symptom, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {symptom}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
