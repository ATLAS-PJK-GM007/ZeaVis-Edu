import type { DiseaseCatalogItem, DiseaseSlug, RiskLevel } from './diseases';

export type ManualClassificationRequest = {
  diseaseSlug: DiseaseSlug;
  observation: string;
  location: string;
};

export type ManualClassificationRecord = {
  id: string;
  diseaseSlug: DiseaseSlug;
  observation: string;
  location: string;
  createdAt: string;
  disease: DiseaseCatalogItem;
};

export type DashboardSummary = {
  diseaseCount: number;
  classificationCount: number;
  latestClassification: ManualClassificationRecord | null;
  riskDistribution: Record<RiskLevel, number>;
};
