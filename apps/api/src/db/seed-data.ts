import { diseaseCatalogSeed } from '@zeavis/shared';
import type { InferInsertModel } from 'drizzle-orm';
import { diseaseCatalog } from './schema';

export type DiseaseCatalogRow = InferInsertModel<typeof diseaseCatalog>;

export const diseaseCatalogRows: DiseaseCatalogRow[] = diseaseCatalogSeed.map((item) => ({
  slug: item.slug,
  label: item.label,
  commonName: item.commonName,
  summary: item.summary,
  description: item.description,
  symptoms: item.symptoms,
  recommendations: item.recommendations,
  riskLevel: item.riskLevel,
  accentColor: item.accentColor,
  displayOrder: item.displayOrder,
}));
