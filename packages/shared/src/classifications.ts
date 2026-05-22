import type { DiseaseCatalogItem, DiseaseSlug } from './diseases';

export type ManualClassificationRequest = {
  diseaseSlug: DiseaseSlug;
  observation: string;
  location: string;
};

export type ManualClassificationRecord = ManualClassificationRequest & {
  id: string;
  createdAt: string;
  disease: DiseaseCatalogItem;
};

export type PredictionProbability = {
  diseaseSlug: DiseaseSlug;
  label: string;
  confidence: number;
};

export type UploaderMetadata = {
  public_id: string;
  telegram_file_id?: string;
  telegram_file_unique_id?: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  file_type: string;
  download_url: string;
};

export type DiagnosisStatus =
  | 'ai_verified'
  | 'needs_review'
  | 'expert_verified'
  | 'expert_corrected'
  | 'failed';

export type UserRole = 'user' | 'expert';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthFeatures = {
  googleOAuthEnabled: boolean;
};

export type AuthMeResponse = {
  user: AuthUser | null;
  features: AuthFeatures;
};

export type AuthRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = AuthRequest & {
  name: string;
};

export type AuthResponse = {
  user: AuthUser;
  features: AuthFeatures;
};

export type DiagnosisPrediction = {
  id: string;
  diseaseSlug: DiseaseSlug | null;
  modelLabel: string;
  confidence: number;
  rank: number;
};

export type ExpertReviewRecord = {
  id: string;
  diagnosisId: string;
  expertId: string;
  verdict: 'verified' | 'corrected';
  correctedDiseaseSlug: DiseaseSlug | null;
  notes: string;
  createdAt: string;
  expert: AuthUser;
};

export type DiagnosisRecord = {
  id: string;
  userId: string;
  predictedDiseaseSlug: DiseaseSlug | null;
  confidence: number | null;
  status: DiagnosisStatus;
  failureReason: string | null;
  imageUrl: string;
  uploaderPublicId: string;
  imageFileName: string;
  imageMimeType: string;
  imageSizeBytes: number;
  createdAt: string;
  updatedAt: string;
  disease: DiseaseCatalogItem | null;
  predictions: DiagnosisPrediction[];
  latestReview: ExpertReviewRecord | null;
};

export type ReviewDiagnosisRequest = {
  verdict: 'verified' | 'corrected';
  correctedDiseaseSlug?: DiseaseSlug;
  notes: string;
};

export type DashboardSummary = {
  diseaseCount: number;
  classificationCount: number;
  imageClassificationCount: number;
  needsReviewCount: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  latestClassification: ManualClassificationRecord | null;
  latestDiagnosis: DiagnosisRecord | null;
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
