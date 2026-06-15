import type {
  AuthMeResponse,
  AuthRequest,
  AuthResponse,
  DiagnosisRecord,
  DiseaseCatalogItem,
  DiseaseSlug,
  ImageClassificationRecord,
  ManualClassificationRequest,
  ManualClassificationRecord,
  RegisterRequest,
  ReviewDiagnosisRequest,
  DashboardSummary,
} from '@zeavis/shared';
import { recordApiCall } from './telemetry';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://zeavisedu.asepharyana.my.id';

const AUTH_TOKEN_KEY = 'zeavis_auth_token';

function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // localStorage may throw in private browsing
  }
}

export interface ApiError extends Error {
  status: number;
  source?: 'uploader' | 'model-service' | 'unknown';
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const start = performance.now();
  const url = `${apiBaseUrl}${endpoint}`;
  const token = getAuthToken();
  const headers = new Headers(options?.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options?.body && !options.method) {
    // auto-set Content-Type for JSON bodies
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  const duration = performance.now() - start;
  const method = options?.method ?? 'GET';
  recordApiCall(method, endpoint, duration, response.status);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let source: 'uploader' | 'model-service' | 'unknown' | undefined;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
      if (errorData.source) {
        source = errorData.source;
      }
    } catch {
    }
    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    error.source = source;
    throw error;
  }

  return response.json();
}

function toImageClassificationRecord(diagnosis: DiagnosisRecord): ImageClassificationRecord {
  if (!diagnosis.disease) {
    throw new Error('Diagnosis does not include disease details');
  }

  return {
    id: diagnosis.id,
    predictedDiseaseSlug: diagnosis.predictedDiseaseSlug || 'daun-sehat',
    confidence: diagnosis.confidence || 0,
    probabilities: diagnosis.predictions.map((p) => ({
      diseaseSlug: p.diseaseSlug || 'daun-sehat',
      label: p.modelLabel,
      confidence: p.confidence,
    })),
    imageUrl: diagnosis.imageUrl,
    originalFileName: diagnosis.imageFileName,
    uploaderPublicId: diagnosis.uploaderPublicId,
    uploader: {
      public_id: diagnosis.uploaderPublicId,
      file_name: diagnosis.imageFileName,
      mime_type: diagnosis.imageMimeType,
      size_bytes: diagnosis.imageSizeBytes,
      file_type: diagnosis.imageMimeType.split('/')[1] || 'unknown',
      download_url: diagnosis.imageUrl,
    },
    createdAt: diagnosis.createdAt,
    disease: diagnosis.disease,
  };
}

export const apiClient = {
  // Auth methods
  async getMe(): Promise<AuthMeResponse> {
    return fetchApi('/api/v1/auth/me');
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const result = await fetchApi<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (result.token) setAuthToken(result.token);
    return result;
  },

  async login(payload: AuthRequest): Promise<AuthResponse> {
    const result = await fetchApi<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (result.token) setAuthToken(result.token);
    return result;
  },

  async logout(): Promise<{ ok: boolean }> {
    const result = await fetchApi<{ ok: boolean }>('/api/v1/auth/logout', { method: 'POST' });
    setAuthToken(null);
    return result;
  },

  // Disease catalog methods
  async getDiseases(): Promise<DiseaseCatalogItem[]> {
    return fetchApi('/api/v1/diseases');
  },

  async getDisease(slug: DiseaseSlug): Promise<DiseaseCatalogItem> {
    return fetchApi(`/api/v1/diseases/${slug}`);
  },

  // Manual classification methods
  async getManualClassifications(): Promise<ManualClassificationRecord[]> {
    return fetchApi('/api/v1/classifications/manual');
  },

  async createManualClassification(
    payload: ManualClassificationRequest,
  ): Promise<ManualClassificationRecord> {
    return fetchApi('/api/v1/classifications/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  // Diagnosis methods
  async getDiagnoses(): Promise<DiagnosisRecord[]> {
    return fetchApi('/api/v1/diagnoses');
  },

  async getDiagnosis(id: string): Promise<DiagnosisRecord> {
    return fetchApi(`/api/v1/diagnoses/${id}`);
  },

  async createDiagnosis(file: File): Promise<DiagnosisRecord> {
    const formData = new FormData();
    formData.append('file', file);

    return fetchApi('/api/v1/diagnoses', {
      method: 'POST',
      body: formData,
    });
  },

  // Expert review methods
  async getExpertReviews(): Promise<DiagnosisRecord[]> {
    return fetchApi('/api/v1/expert/reviews');
  },

  async reviewDiagnosis(id: string, payload: ReviewDiagnosisRequest): Promise<DiagnosisRecord> {
    return fetchApi(`/api/v1/expert/reviews/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  // Dashboard methods
  async getDashboardSummary(): Promise<DashboardSummary> {
    return fetchApi('/api/v1/dashboard/summary');
  },

  // Backwards-compatible aliases for old image classification methods
  async getImageClassifications(): Promise<ImageClassificationRecord[]> {
    const diagnoses = await this.getDiagnoses();
    return diagnoses.map(toImageClassificationRecord);
  },

  async createImageClassification(file: File): Promise<ImageClassificationRecord> {
    const diagnosis = await this.createDiagnosis(file);
    return toImageClassificationRecord(diagnosis);
  },
};
