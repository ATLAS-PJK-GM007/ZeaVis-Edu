import type { DiseaseCatalogItem, DiseaseSlug, DiseaseLabel, RiskLevel } from '@zeavis/shared';
import type { diseaseCatalog } from '../db/schema';

export function toDisease(row: typeof diseaseCatalog.$inferSelect): DiseaseCatalogItem {
  return {
    slug: row.slug as DiseaseSlug,
    label: row.label as DiseaseLabel,
    commonName: row.commonName,
    summary: row.summary,
    description: row.description,
    symptoms: row.symptoms,
    recommendations: row.recommendations,
    riskLevel: row.riskLevel as RiskLevel,
    accentColor: row.accentColor,
    displayOrder: row.displayOrder,
  };
}
