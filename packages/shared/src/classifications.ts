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

export type PredictionProbability = {
  diseaseSlug: DiseaseSlug;
  label: DiseaseCatalogItem['label'];
  confidence: number;
};

export type UploaderMetadata = {
  public_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  file_type: string;
  uploader_id?: number;
  created_at: string;
  telegram_file_id?: string;
  telegram_file_unique_id?: string;
  storage_chat_id?: number;
  storage_message_id?: number;
  download_url: string;
};

export type ImageClassificationRecord = {
  id: string;
  predictedDiseaseSlug: DiseaseSlug;
  confidence: number;
  probabilities: PredictionProbability[];
  imageUrl: string;
  originalFileName: string;
  uploaderPublicId: string;
  uploader: UploaderMetadata;
  createdAt: string;
  disease: DiseaseCatalogItem;
};

export type DashboardSummary = {
  diseaseCount: number;
  classificationCount: number;
  latestClassification: ManualClassificationRecord | null;
  riskDistribution: Record<RiskLevel, number>;
};
