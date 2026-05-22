import type {
  DiseaseSlug,
  DiseaseCatalogItem,
  ManualClassificationRequest,
  ManualClassificationRecord,
  ImageClassificationRecord,
  DashboardSummary,
} from '@zeavis/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${apiBaseUrl}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const apiClient = {
  async getDiseases(): Promise<DiseaseCatalogItem[]> {
    return fetchApi('/api/v1/diseases');
  },

  async getDisease(slug: DiseaseSlug): Promise<DiseaseCatalogItem> {
    return fetchApi(`/api/v1/diseases/${slug}`);
  },

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

  async getImageClassifications(): Promise<ImageClassificationRecord[]> {
    return fetchApi('/api/v1/classifications/image');
  },

  async createImageClassification(file: File): Promise<ImageClassificationRecord> {
    const formData = new FormData();
    formData.append('file', file);

    return fetchApi('/api/v1/classifications/image', {
      method: 'POST',
      body: formData,
    });
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    return fetchApi('/api/v1/dashboard/summary');
  },
};
